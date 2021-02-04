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
    const printRelative = path => path.replace('./', '');

    try {
      // eslint-disable-next-line no-restricted-globals
      console.log(`- Removing the ${printRelative(nodeModulesLocation)} directory.`);

      rimraf.sync(nodeModulesLocation);

    } catch (error) {
      // eslint-disable-next-line no-restricted-globals
      console.error(`Error deleting ${printRelative(nodeModulesLocation)} - ${error}`);

      process.exit(1);
    }

    try {
      // eslint-disable-next-line no-restricted-globals
      console.log(`- Removing the ${printRelative(lockfileLocation)} file.`);

      rimraf.sync(lockfileLocation);

    } catch (error) {
      // eslint-disable-next-line no-restricted-globals
      console.error(`Error deleting ${printRelative(lockfileLocation)} - ${error}`);

      process.exit(1);
    }
  });

  // eslint-disable-next-line no-restricted-globals
  console.log('\n');
}
