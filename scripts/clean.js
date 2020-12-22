const rimraf = require('rimraf');
const hotPackageJson = require('../package.json');

const workspaces = hotPackageJson.workspaces.packages;

console.log('\n Cleaning the "node_modules" directories and lock files.\n');

workspaces.forEach((packagesLocation) => {
  const nodeModulesLocation = `${packagesLocation}/node_modules`;
  const lockfileLocation = `${packagesLocation}/package-lock.json`;

  console.log(`- Removing the ${nodeModulesLocation} directory.`);

  rimraf(nodeModulesLocation, (error) => {
    if (error) {
      console.error(`Error deleting ${nodeModulesLocation} - ${error}`);
    }
  });

  console.log(`- Removing the ${lockfileLocation} file.`);

  rimraf(lockfileLocation, (error) => {
    if (error) {
      console.error(`Error deleting ${nodeModulesLocation} - ${error}`);
    }
  });
});

console.log('\n');
