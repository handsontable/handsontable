import path from 'path';
import fse from 'fs-extra';
import {
  spawnProcess
} from './utils/processes.mjs';
import codesandboxConfig from '../.codesandbox/ci.json';

/**
 * --------------------------------------------------------
 * THIS SCRIPT IS MEANT TO BE USED FOR CODESANDBOX CI ONLY!
 * --------------------------------------------------------
 *
 * This script goes through all the packages defined in the Codesandbox CI config file, installs their dependencies
 * independently (in their own subdirectories), copies the `handsontable/tmp` directory to their `node_modules` as
 * `handsontable` and builds the packages.
 *
 * Running this script locally will mess up the monorepo's dependency structure. Running the `clean:node_modules`
 * script and calling `npm i` in the root directory should bring it back to normal.
 */
(async () => {
  let spawnOptions = {};

  for (const packagePath of codesandboxConfig.packages) {
    spawnOptions = {
      cwd: packagePath
    };

    if (packagePath !== 'examples') {
      await spawnProcess('npm i --no-audit', spawnOptions);

      if (packagePath !== 'handsontable') {

        // We're copying instead of linking the directory, because linking only the `handsontable` package
        // caused issues with Handsontable's dependencies not being found by the wrappers.
        fse.copySync(
          path.resolve(`./handsontable/tmp`),
          path.resolve(`${packagePath}/node_modules/handsontable`),
          { overwrite: true });
      }

      await spawnProcess('npm run build', spawnOptions);
    }
  }
})();
