import rimraf from 'rimraf';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const hotPackageJson = require('../../package.json');

const workspaces = hotPackageJson.workspaces.packages;

/**
 * Cleans the `node_modules` directory and `package-lock.json` files for all the packages declared as npm workspaces.
 */
export function cleanNodeModules() {
  // eslint-disable-next-line no-restricted-globals
  console.log('\n Cleaning the "node_modules" directories and lock files.\n');

  workspaces.forEach((packagesLocation) => {
    const nodeModulesLocation = `${packagesLocation}/node_modules`;
    const lockfileLocation = `${packagesLocation}/package-lock.json`;

    // eslint-disable-next-line no-restricted-globals
    console.log(`- Removing the ${nodeModulesLocation} directory.`);

    rimraf(nodeModulesLocation, (error) => {
      if (error) {
        // eslint-disable-next-line no-restricted-globals
        console.error(`Error deleting ${nodeModulesLocation} - ${error}`);

        process.exit(1);
      }
    });

    // eslint-disable-next-line no-restricted-globals
    console.log(`- Removing the ${lockfileLocation} file.`);

    rimraf(lockfileLocation, (error) => {
      if (error) {
        // eslint-disable-next-line no-restricted-globals
        console.error(`Error deleting ${nodeModulesLocation} - ${error}`);

        process.exit(1);
      }
    });
  });

  // eslint-disable-next-line no-restricted-globals
  console.log('\n');
}
