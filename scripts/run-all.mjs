/**
 * Run the provided command in all subprojects in a declared order..
 * For example:
 * `npm run all build`
 * will run the `build` command in all of the declared projects..
 */
import { spawnProcess } from './utils/index.mjs';

(async() => {
  const [/* node bin */, /* path to this script */, command] = process.argv;
  const ORDER = [
    'handsontable',
    'angular-handsontable',
    'react-handsontable',
    'vue-handsontable'
  ];

  /* eslint-disable no-await-in-loop,no-restricted-syntax */
  for (const project of ORDER) {
    await spawnProcess(`npm run in ${project} ${command} -- --if-present`);
  }
  /* eslint-enable no-await-in-loop,no-restricted-syntax */
})();
