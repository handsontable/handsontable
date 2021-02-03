/**
 * Run the provided command in all subprojects in a declared order..
 * For example:
 * `npm run all build`
 * will run the `build` command in all of the declared projects..
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// eslint-disable-next-line import/extensions
import { spawnProcess } from './utils/index.mjs';

// eslint-disable-next-line no-unused-expressions
const argv = yargs(hideBin(process.argv))
  .alias('e', 'exclude')
  .describe('e', 'Exclude a package from being run. Can be provided as a comma-separated list (with no spaces).')
  .argv;

(async() => {
  const [command] = process.argv.slice(2);
  const ORDER = [
    'handsontable',
    'angular-handsontable',
    'react-handsontable',
    'vue-handsontable'
  ];

  /* eslint-disable no-await-in-loop,no-restricted-syntax */
  for (const project of ORDER) {
    if (!(argv.exclude || '').split(',').includes(project)) {
      await spawnProcess(`npm run in ${project} ${command} -- --if-present`);
    }
  }
  /* eslint-enable no-await-in-loop,no-restricted-syntax */
})();
