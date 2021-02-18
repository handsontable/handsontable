import rimraf from 'rimraf';
import hotPackageJson from '../../package.json';

const workspaces = hotPackageJson.workspaces.packages;

/**
 * Cleans the `node_modules` directory and `package-lock.json` files for all the packages declared as npm workspaces.
 */
export function cleanNodeModules() {
  console.log('\n Cleaning the "node_modules" directories and lock files.\n');

  workspaces.forEach((packagesLocation) => {
    const nodeModulesLocation = `${packagesLocation}/node_modules`;
    const lockfileLocation = `${packagesLocation}/package-lock.json`;
    const printRelative = path => path.replace('./', '');

    try {
      console.log(`- Removing the ${printRelative(nodeModulesLocation)} directory.`);

      rimraf.sync(nodeModulesLocation);

    } catch (error) {
      console.error(`Error deleting ${printRelative(nodeModulesLocation)} - ${error}`);

      process.exit(1);
    }

    try {
      console.log(`- Removing the ${printRelative(lockfileLocation)} file.`);

      rimraf.sync(lockfileLocation);

    } catch (error) {
      console.error(`Error deleting ${printRelative(lockfileLocation)} - ${error}`);

      process.exit(1);
    }
  });

  console.log('\n');
}
