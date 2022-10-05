import fs from 'fs-extra';
import crypto from 'crypto';
import util from 'util';
import ChildProcess from 'child_process';
import hotConfig from '../hot.config.js';

const exec = util.promisify(ChildProcess.exec);
const PACKAGES_SETTINGS = {
  MAIN: {
    NAME: 'tmp-hot',
    PATH: 'handsontable/tmp',
  },
  REACT: {
    NAME: 'tmp-hot-react',
    PATH: 'wrappers/react',
  },
  ANGULAR: {
    NAME: 'tmp-hot-angular',
    PATH: 'wrappers/angular',
  },
  VUE: {
    NAME: 'tmp-hot-vue',
    PATH: 'wrappers/vue',
  },
  VUE3: {
    NAME: 'tmp-hot-vue3',
    PATH: 'wrappers/vue3',
  },
};

const FILE_NAME = 'package.json';
const MAIN_PATH = process.cwd();

const hash = crypto
  .createHash('shake256', { outputLength: 4 })
  .update(hotConfig.HOT_VERSION, 'utf8')
  .digest('hex');

const newVersionNumber = `${hotConfig.HOT_VERSION}-dev.${hash}-${Date.now()}`;

Object.entries(PACKAGES_SETTINGS).forEach(([key, item]) => {
  const dataFromFile = JSON.parse(fs.readFileSync(`${item.PATH}/${FILE_NAME}`));

  dataFromFile.version = newVersionNumber;
  dataFromFile.name = item.NAME;

  fs.writeFileSync(
    `${item.PATH}/${FILE_NAME}`,
    JSON.stringify(dataFromFile, null, 2)
  );
});

Object.entries(PACKAGES_SETTINGS).forEach(([key, item]) => {
  process.chdir(MAIN_PATH);
  process.chdir(`${item.PATH}`);

  exec('npm publish').then(
    () => {
      console.log(`%c${key} - success`, 'color: green;');
    },
    (error) => {
      console.log(`%c${key} - error`, 'color: red;');
      throw new Error(error);
    }
  );
});
