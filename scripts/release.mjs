/**
 * Release helper script.
 * Required to be run on the release branch.
 *
 * It merges the release branch to the `develop` and `master` branches and pushes them, along with the created tags.
 */
import inquirer from 'inquirer';
import execa from 'execa';
import fs from 'fs';
import path from 'path';
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
    const releaseVersion = branchName.replace('release/', '');

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

    const noPatchVersion = releaseVersion.substring(0, 4);
    const docsVersion = `prod-docs/${noPatchVersion}`; // e.g. "prod-docs/12.1" (without patch)
    const remoteDocsBranchExists = await spawnProcess(
      `git ls-remote --heads origin --list ${docsVersion}`, { silent: true });

    await spawnProcess('git checkout develop');

    if (remoteDocsBranchExists.stdout) {
      await spawnProcess(`git checkout ${docsVersion}`);
      await spawnProcess(`git pull origin ${docsVersion}`);

    } else {
      // Create a new branch based on the git tag (not `develop` branch). Thanks to that, the docs
      // branch will not contain the code changes made between freeze and release.
      await spawnProcess(`git checkout -b ${docsVersion} ${releaseVersion}`);

      const linesCount = parseInt((await execa.command('wc -l < .gitignore', {
        cwd: 'docs',
        shell: true
      })).stdout, 10);

      // Remove "/content/api/" entry from the ./docs/.gitignore file so generated API
      // docs can be committed to the branch.
      await execa.command('cat ./.gitignore | grep -v "^/content/api/$" | tee .gitignore', {
        cwd: 'docs',
        shell: true,
      });

      const newLinesCount = parseInt((await execa.command('wc -l < .gitignore', {
        cwd: 'docs',
        shell: true
      })).stdout, 10);

      if (newLinesCount + 1 !== linesCount && !Number.isNaN(newLinesCount)) {
        displayErrorMessage(
          'The docs/.gitignore file modified by the release script is incorrect. Continuing the script' +
          ' execution would result in a broken documentation build.'
        );
        process.exit(1);
      }
    }

    // Regenerate docs API md files.
    await spawnProcess('npm run docs:api', { cwd: 'docs' });
    // Update all available Docs versions for legacy docs.
    await spawnProcess('npm run docs:scripts:generate-legacy-docs-versions', { cwd: 'docs' });

    const docsPackageJsonLinesCount = parseInt((
      await execa.command('wc -l < package.json', { cwd: 'docs', shell: true })
    ).stdout, 10);

    // Update @handsontable/angular version in docs/package.json to match the docs version.
    const docsPackageJsonPath = 'docs/package.json';
    const docsPackageJson = JSON.parse(
      await execa.command(`cat ${docsPackageJsonPath}`, { shell: true }
      ).then(result => result.stdout));

    docsPackageJson.devDependencies['@handsontable/angular-wrapper'] = `~${releaseVersion}`;

    // Write updated package.json back to file with proper formatting
    fs.writeFileSync(
      path.resolve(process.cwd(), docsPackageJsonPath),
      `${JSON.stringify(docsPackageJson, null, 2)}\n`,
      'utf8'
    );

    const updatedDocsPackageJsonLinesCount = parseInt((
      await execa.command('wc -l < package.json', { cwd: 'docs', shell: true })
    ).stdout, 10);

    if (
      docsPackageJsonLinesCount !== updatedDocsPackageJsonLinesCount ||
      Number.isNaN(updatedDocsPackageJsonLinesCount)
    ) {
      displayErrorMessage(
        'The docs/package.json file modified by the release script is incorrect. Continuing the script' +
        ' execution would result in a broken documentation build.'
      );
      process.exit(1);
    }

    // Commit the Docs changes to the Docs Production branch.
    await spawnProcess('git add .');
    await spawnProcess(`git commit -m "${releaseVersion}"`);
    await spawnProcess(`git push origin ${docsVersion}`);
    // Back to `develop` branch.
    await spawnProcess('git checkout develop');
  }
})();
