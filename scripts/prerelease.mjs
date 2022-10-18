import { displayErrorMessage } from './utils/console.mjs';
import { setVersion } from './utils/pre-release.mjs';

import execa from 'execa';
import moment from 'moment';
//import fs from 'fs-extra';
//import ChildProcess from 'child_process';

/* const PACKAGES_SETTINGS = {
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
}; */

// const FILE_NAME = 'package.json';
// const MAIN_PATH = process.cwd();

const { stdout: hash } = await execa.command('git rev-parse HEAD');
const date = moment().format('YYYYMMDD');
const newVersionNumber = `0.0.0-next-dev.${hash
  .toString()
  .trim()
  .slice(0, 7)}-${date}`;

setVersion(newVersionNumber);

try {
  await execa.command('npm run publish-all');
} catch (error) {
  displayErrorMessage(`error during publishing`);
  process.exit(error.exitCode);
}
