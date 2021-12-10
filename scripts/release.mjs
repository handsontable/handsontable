/**
 * Release helper script.
 * Required to be run on the release branch.
 *
 * It merges the release branch to the `develop` and `master` branches and pushes them, along with the created tags.
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import inquirer from 'inquirer';
import {
  displayErrorMessage,
  displaySeparator,
  spawnProcess,
} from './utils/index.mjs';

const argv = yargs(hideBin(process.argv))
  .boolean('push')
  .default('push', false)
  .describe('push', '`true` if the release should be pushed to `develop` and `master` along with the tags.')
  .argv;

displaySeparator();

(async() => {
  // Initial verification prompt
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continueRelease',
      message: 'This script will take the current state of the release branch and merge, commit and push it to the' +
        ' `master` branch (as well as the tags).\nContinue?',
      default: true,
    }
  ]);

  if (!answers.continueRelease) {
    process.exit(0);
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
  {
    // Check if we're on a release branch.
    const processInfo = await spawnProcess('git rev-parse --abbrev-ref HEAD', { silent: true });
    const branchName = processInfo.stdout.toString();

    if (!branchName.startsWith('release/')) {
      displayErrorMessage('You are not on a release branch.');
      process.exit(1);
    }

    // Pull the recent changes from the `develop` and `master` branches, to prevent conflicts after merging.
    await spawnProcess('git checkout master');
    await spawnProcess('git pull origin master');
    await spawnProcess('git checkout develop');
    await spawnProcess('git pull origin develop');
    await spawnProcess(`git checkout ${branchName}`);

    // Merge the changes to the `develop` and `master` branches.
    await spawnProcess(`git flow release finish -s ${branchName.replace('release/', '')}`);

    if (argv.push === true) {
      await spawnProcess('git checkout develop');
      await spawnProcess('git push origin develop');
      await spawnProcess('git checkout master');
      await spawnProcess('git push origin master');
      await spawnProcess('git push --tags');
    }
  }
})();
