/**
 * Code-freeze helper script.
 * Required to be run on a release branch.
 *
 * It takes extends the committed changes with a new version and release date, runs builds and tests and pushes the
 * changes to the release branch.
 */
import inquirer from 'inquirer';
import {
  cleanNodeModules,
  displayErrorMessage,
  displaySeparator,
  scheduleRelease,
  spawnProcess
// eslint-disable-next-line import/extensions
} from './utils/index.mjs';

const [version, releaseDate] = process.argv.slice(2);

displaySeparator();

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
  await spawnProcess('npm --version', true).then((childProcess) => {
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

  await spawnProcess('git rev-parse --abbrev-ref HEAD', true,).then((childProcess) => {
    branchName = childProcess.stdout.toString().replace('\n', '');

    if (!branchName.startsWith('release/')) {
      displayErrorMessage(
        'You are not on a release branch. Create a release branch using the `git flow release start`' +
        ' command on the current `develop` branch.');
      process.exit(1);
    }
  });

  // Check if `git flow` is installed.
  await spawnProcess('git flow version', true).catch((error) => {
    displayErrorMessage('Git flow not installed.');

    process.exit(error.exitCode);
  });

  // Check if all the files are committed.
  await spawnProcess('git status -s', true).then((output) => {
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
  await spawnProcess('node --experimental-json-modules ./scripts/utils/verify-bundles.mjs');

  // Commit the changes to the release branch.
  await spawnProcess('git add .');

  const { default: hotPackageJson } = await import('../package.json');

  await spawnProcess(`git commit -m "${hotPackageJson.version}"`);

  await spawnProcess(`git flow release publish ${hotPackageJson.version}`);
});
