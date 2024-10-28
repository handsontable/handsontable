/**
 * Code-freeze helper script.
 * Required to be run on a release branch.
 *
 * It takes extends the committed changes with a new version and release date, runs builds and tests and pushes the
 * changes to the release branch.
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import inquirer from 'inquirer';
import semver from 'semver';
import {
  cleanNodeModules,
  scheduleRelease,
  spawnProcess,
  displayErrorMessage,
  displaySeparator,
} from './utils/index.mjs';

const argv = yargs(hideBin(process.argv))
  .boolean('commit')
  .default('commit', false)
  .describe('commit', '`true` if the state of the repo should be committed automatically at the end of the freeze' +
    ' process.')
  .boolean('push')
  .default('push', false)
  .describe('push', '`true` if the state of the repo should be pushed to remote automatically at the end of the' +
    ' freeze process.')
  .argv;

const [version, releaseDate] = argv._;

displaySeparator();

(async() => {
  // Initial verification prompt
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continueFreeze',
      message: 'This script will create and commit a code-freeze of the entire repo. \nContinue?',
      default: true,
    }
  ]);

  if (!answers.continueFreeze) {
    process.exit(0);
  }

  // Check if we're using the minimum required npm version.
  {
    const processInfo = await spawnProcess('npm --version', { silent: true });
    const npmVersion = processInfo.stdout.toString();

    if (!semver.satisfies(npmVersion, '>=7.17.0')) {
      displayErrorMessage('The minimum required npm version is 7.17.0');
      process.exit(1);
    }
  }

  // Check if we're on a release branch.
  {
    const processInfo = await spawnProcess('git rev-parse --abbrev-ref HEAD', { silent: true });
    const branchName = processInfo.stdout.toString();

    if (!branchName.startsWith('release/')) {
      displayErrorMessage(
        'You are not on a release branch. Create a release branch using the `git flow release start`' +
        ' command on the current `develop` branch.');
      process.exit(1);
    }
  }

  // Check if `git flow` is installed.
  try {
    await spawnProcess('git flow version', { silent: true });

  } catch (error) {
    displayErrorMessage('Git flow not installed.');

    process.exit(1);
  }

  // Check if all the files are committed.
  {
    const processInfo = await spawnProcess('git status -s', { silent: true });
    const output = processInfo.stdout.toString();

    // If there are any uncommitted changes, kill the script.
    if (output.length > 0) {
      displayErrorMessage('There are uncommitted changes present. Exiting.');

      process.exit(1);
    }
  }

  // Bump the version in all packages.
  const { version: finalVersion } = await scheduleRelease(version, releaseDate);

  // Clear the projects' node_modules nad lock files.
  cleanNodeModules();

  // Install fresh dependencies
  await spawnProcess('npm i --no-audit');

  // Clear old package builds.
  await spawnProcess('npm run all clean -- --e examples');

  // Build all packages (except examples).
  await spawnProcess('npm run all build -- --e examples');

  // Install the "next" package for examples
  await spawnProcess('npm run examples:install next');

  // Build the examples directory.
  await spawnProcess('npm run in examples build');

  // Test all packages.
  await spawnProcess('npm run all test');

  // Verify if the bundles have the same (and correct) version.
  await spawnProcess('node ./scripts/verify-bundles.mjs');

  // Generate the CHANGELOG.md file.
  await spawnProcess('npm run changelog consume', { stdin: 'pipe' });

  if (argv.commit === true) {
    // Commit the changes to the release branch.
    await spawnProcess('git add .');

    await spawnProcess(`git commit -m "${finalVersion}"`);
  }

  if (argv.push === true) {
    // Push the changes to remote.
    await spawnProcess(`git flow release publish ${finalVersion}`);
  }
})();
