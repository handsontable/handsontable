/**
 * Release helper script.
 * Required to be run on the release branch.
 *
 * It merges the release branch to the `develop` and `master` branches and pushes them, along with the created tags.
 */
import inquirer from 'inquirer';
import {
  displayErrorMessage,
  displaySeparator,
  spawnProcess,
} from './utils/index.mjs';

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

  const releaseVersion = branchName.replace('release/', '');

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
    await spawnProcess(`git flow release finish -s ${releaseVersion}`);

    await spawnProcess('git checkout develop');
    await spawnProcess('git push origin develop');
    await spawnProcess('git checkout master');
    await spawnProcess('git push origin master');
    await spawnProcess('git push --tags');

    const docsProdBranch = `prod-docs/${releaseVersion.substr(0, 4)}`; // e.g. "prod-docs/12.1" (without patch)
    const remoteDocsBranchExists = await spawnProcess(
      `git ls-remote --heads origin --list ${docsProdBranch}`, { silent: true });

    await spawnProcess('git checkout develop');

    if (remoteDocsBranchExists.stdout) {
      await spawnProcess(`git checkout ${docsProdBranch}`);
      await spawnProcess(`git pull origin ${docsProdBranch}`);
      await spawnProcess('git merge develop');
    } else {
      await spawnProcess(`git checkout -b ${docsProdBranch}`);
      // Regenerate docs API md files.
      await spawnProcess('npm run docs:api', { cwd: 'docs' });
    }

    // Commit the Docs changes to the Docs Production branch.
    await spawnProcess('git add .');
    await spawnProcess(`git commit -m "${releaseVersion}"`);
    await spawnProcess(`git push origin ${docsProdBranch}`);
  }
})();
