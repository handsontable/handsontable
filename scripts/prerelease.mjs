import { displayErrorMessage } from './utils/console.mjs';
import { setVersion } from './utils/pre-release.mjs';

import moment from 'moment';
//import fs from 'fs-extra';
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

// const FILE_NAME = 'package.json';
const MAIN_PATH = process.cwd();

const hash = ChildProcess.execSync('git rev-parse HEAD')
  .toString()
  .trim()
  .slice(0, 7);
const date = moment().format('YYYYMMDD');
const newVersionNumber = `0.0.0-next-dev.${hash}-${date}`;

setVersion(newVersionNumber);

Object.entries(PACKAGES_SETTINGS).forEach(([key, item]) => {
  process.chdir(MAIN_PATH);
  process.chdir(`${item.PATH}`);

  (async function () {
    try {
      await ChildProcess.exec('npm publish');
    } catch (error) {
      displayErrorMessage(`${key} - something went wrong`);
      process.exit(error.exitCode);
    }
  })();
});
