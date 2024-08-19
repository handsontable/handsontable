import rimraf from 'rimraf';
import mainPackageJSON from '../../package.json' with { type: 'json' };

const workspaces = mainPackageJSON.workspaces;

/**
 * Cleans the `node_modules` directory and `package-lock.json` files for all the packages declared as npm workspaces.
 */
export function cleanNodeModules() {
  console.log('\n Cleaning the "node_modules" directories and lock files.\n');

  try {
    console.log('- Removing the ./node_modules directory.');

    rimraf.sync('./node_modules');

    console.log('- Removing the ./package-lock.json file.');

    rimraf.sync('./package-lock.json');

  } catch (error) {
    console.error(`Error deleting ./node_modules or ./package-lock.json - ${error}.`);

    process.exit(1);
  }

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
