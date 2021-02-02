/**
 * Release helper script.
 */
import inquirer from 'inquirer';
import {
  displayErrorMessage,
  spawnProcess,
} from './utils/index.mjs';

// Initial verification prompt
inquirer.prompt([
  {
    type: 'confirm',
    name: 'continueRelease',
    message: 'This script will take the current state of the release branch and merge, commit and push it to the' +
      ' `master` branch (as well as the tags).\nContinue?',
    default: true,
  }
]).then((answers) => {
  if (!answers.continueRelease) {
    return;
  }

  // Check if all the files are committed.
  spawnProcess('git status -s', true, (output) => {
    // If there are any uncommitted changes, kill the script.
    if (output.stdout.length > 0) {
      displayErrorMessage('There are uncommitted changes present. Exiting.');

      process.exit(1);
    }
  });

  // Check if we're on a release branch.
  let branchName = null;

  spawnProcess('git rev-parse --abbrev-ref HEAD', true, (childProcess) => {
    branchName = childProcess.stdout.toString().replace('\n', '');

    if (!branchName.startsWith('release/')) {
      displayErrorMessage('You are not on a release branch.');
      process.exit(1);
    }
  });

  // Pull the recent changes from the `develop` and `master` branches, to prevent conflicts after merging.
  spawnProcess('git checkout master');
  spawnProcess('git pull origin master');
  spawnProcess('git checkout develop');
  spawnProcess('git pull origin develop');
  spawnProcess(`git checkout ${branchName}`);

  // Merge the changes to the `develop` and `master` branches.
  spawnProcess(`git flow release finish -s ${branchName.replace('release/', '')}`);

  if (process.argv.includes('--push')) {
    spawnProcess('git checkout develop');
    spawnProcess('git push origin develop');
    spawnProcess('git checkout master');
    spawnProcess('git push origin master');
    spawnProcess('git push --tags');
  }
});
