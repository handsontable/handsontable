import {
  displayConfirmationMessage,
  displayErrorMessage,
} from './utils/console.mjs';
import moment from 'moment';

import fs from 'fs-extra';
import ChildProcess from 'child_process';

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

const hash = ChildProcess.execSync('git rev-parse HEAD')
  .toString()
  .trim()
  .slice(0, 7);

const date = moment().format('YYYYMMDD');

const newVersionNumber = `0.0.0-next-dev.${hash}-${date}`;

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

  ChildProcess.exec('npm publish').then(
    () => {
      displayConfirmationMessage('\x1b[32m%s\x1b[0m', `${key} - success`);
    },
    (error) => {
      displayErrorMessage('\x1b[31m%s\x1b[0m', `${key} - something went wrong`);
      throw new Error(error);
    }
  );
});
