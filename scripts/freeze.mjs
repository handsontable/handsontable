/**
 * Code-freeze helper script.
 */
import { createRequire } from 'module';
import inquirer from 'inquirer';
import {
  cleanNodeModules,
  displayErrorMessage, scheduleRelease,
  spawnProcess, verifyBundles
} from './utils/index.mjs';

// Using `require` exclusively to import `json` files. Prevents 'experimental' warnings from being thrown in the
// console.
const require = createRequire(import.meta.url);
const [/* node bin */, /* path to this script */, version, releaseDate] = process.argv;

// Initial verification prompt
inquirer.prompt([
  {
    type: 'confirm',
    name: 'continueFreeze',
    message: 'This script will create and commit a code-freeze of the entire repo. \nContinue?',
    default: true,
  }
]).then(async(answers) => {
  if (!answers.continueFreeze) {
    return;
  }

  // Check if we're using the minimum required npm version.
  await spawnProcess('npm --version', true, (childProcess) => {
    const npmVersion = childProcess.stdout.toString().replace('\n', '').split('.');

    if (
      (npmVersion[0] < 7) ||
      (npmVersion[0] >= 7 && npmVersion[1] < 2)
    ) {
      displayErrorMessage('The minimum required npm version is 7.2.0');
      process.exit(1);
    }
  });

  // Check if we're on a release branch.
  let branchName = null;

  await spawnProcess('git rev-parse --abbrev-ref HEAD', true, (childProcess) => {
    branchName = childProcess.stdout.toString().replace('\n', '');

    if (!branchName.startsWith('release/')) {
      displayErrorMessage(
        'You are not on a release branch. Create a release branch using the `git flow release start`' +
        ' command on the current `develop` branch.');
      process.exit(1);
    }
  });

  // Check if `git flow` is installed.
  await spawnProcess('git flow version', true, null, () => {
    displayErrorMessage('Git flow not installed.');
  });

  // Check if all the files are committed.
  await spawnProcess('git status -s', true, (output) => {
    // If there are any uncommitted changes, kill the script.
    if (output.stdout.length > 0) {
      displayErrorMessage('There are uncommitted changes present. Exiting.');

      process.exit(1);
    }
  });

  // Bump the version in all packages.
  if (version && releaseDate) {
    await scheduleRelease(version, releaseDate);

  } else {
    await scheduleRelease();
  }

  // Clear the projects' node_modules nad lock files.
  cleanNodeModules();

  // Install fresh dependencies
  await spawnProcess('npm i');

  // Clear old package builds.
  await spawnProcess('npm run all clean');

  // Build all packages.
  await spawnProcess('npm run all build');

  // Test all packages.
  await spawnProcess('npm run all test');

  // Verify if the bundles have the same (and correct) version.
  await verifyBundles();

  // Commit the changes to the release branch.
  await spawnProcess('git add .');

  const hotPackageJson = require('../package.json');

  await spawnProcess(`git commit -m "${hotPackageJson.version}"`);

  if (branchName) {
    await spawnProcess(`git flow release publish ${hotPackageJson.version}`);
  }
});
