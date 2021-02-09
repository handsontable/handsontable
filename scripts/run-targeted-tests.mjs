import execa from 'execa';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import glob from 'glob';
// eslint-disable-next-line import/extensions
import { spawnProcess } from './utils/index.mjs';
import hotPackageJson from '../package.json';

// eslint-disable-next-line no-unused-expressions
const argv = yargs(hideBin(process.argv))
  .alias('p', 'pipeline')
  .describe('p', 'Define the pipeline number the tests will be triggered on.' +
    '\n If HOT was modified or the tests are triggered on a full-test branch:' +
    '\n - pipeline 1: `production` tests for Handsontable and package tests.' +
    '\n - pipeline 2: `unit`, `type`, `walkontable` and `e2e` tests for Handsontable.' +
    '\n\n If HOT was _not_ modified, both pipelines run the other packages\' tests (distributed ~50/50).' +
    '\n\n If no pipeline is defined, all the test run consecutively.')
  .argv;

const workspacePackages = hotPackageJson.workspaces.packages;
const touchedProjects = [];

/**
 * Distribute the tests between the pipelines as follows:
 * 1. If HOT was modified or the tests are triggered on a full-test branch:
 *     - pipeline 1: `production` tests for Handsontable and all package tests.
 *     - pipeline 2: `unit`, `type`, `walkontable` and `e2e` tests for Handsontable.
 * 2. If HOT was _not_ modified, both pipelines run the other packages' tests (distributed ~50/50).
 * 3. If no pipeline is defined, all the test run consecutively.
 *
 * @param {string[]} modifiedProjects Array of modified project names.
 * @returns {Promise<void>}
 */
async function distributeBetweenPipelines(modifiedProjects) {
  const pipelineCount = 2;
  const pipeline = parseInt(argv.pipeline, 10);
  const isHandsontableTouched = modifiedProjects.includes('handsontable');

  switch (pipeline) {
    case 1:
      if (isHandsontableTouched) {
        await spawnProcess('npm run in handsontable test:production');
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const projectName of modifiedProjects) {
        if (
          (!isHandsontableTouched &&
            modifiedProjects.indexOf(projectName) < Math.floor(modifiedProjects.length / pipelineCount)) ||
          (isHandsontableTouched && projectName !== 'handsontable')
        ) {
          // eslint-disable-next-line no-await-in-loop
          await spawnProcess(`npm run in ${projectName} test`);
        }
      }

      break;
    case 2:
      if (isHandsontableTouched) {
        await spawnProcess('npm run in handsontable test:unit');
        await spawnProcess('npm run in handsontable test:types');
        await spawnProcess('npm run in handsontable test:walkontable');
        await spawnProcess('npm run in handsontable test:e2e');
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const projectName of modifiedProjects) {
        if (
          !isHandsontableTouched &&
          modifiedProjects.indexOf(projectName) >= Math.floor(modifiedProjects.length / pipelineCount)
        ) {
          // eslint-disable-next-line no-await-in-loop
          await spawnProcess(`npm run in ${projectName} test`);
        }
      }

      break;
    default:
      await spawnProcess('npm run all test');
  }
}

(async() => {
  const currentBranch = (
    await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' })
  ).stdout.replace(/(\n)/gm, '');
  const fullTestBranchRegex = new RegExp('^(master|develop|release\/.{5,})$');
  const fullTestBranchMatch = fullTestBranchRegex.test(currentBranch);

  // Tests triggered on the `master`, `develop` and `release/` branches.
  if (fullTestBranchMatch) {
    workspacePackages.forEach((packagesLocation) => {
      const subdirs = glob.sync(packagesLocation);

      subdirs.forEach((subdir) => {
        if (subdir === '.') {
          touchedProjects.push('handsontable');

        } else {
          const splitSubdir = subdir.split('/');
          const projectName = splitSubdir[splitSubdir.length - 1];

          if (!touchedProjects.includes(projectName)) {
            touchedProjects.push(projectName);
          }
        }
      });
    });

  } else {
    const filesModifiedInLastCommit = (
      await execa('git', ['log', '--name-only', '--oneline', 'HEAD^..HEAD'], { encoding: 'utf8' })
    ).stdout.split('\n');
    let filesMatchedCount = 0;

    filesModifiedInLastCommit.shift();

    filesModifiedInLastCommit.forEach((fileUrl) => {
      if (fileUrl.includes('CHANGELOG')) {
        filesMatchedCount += 1;

        return;
      }

      workspacePackages.forEach((packageWildcard) => {
        if (packageWildcard !== '.') {
          const escapedPackageUrl = packageWildcard.replace('*', '').replace('/', '\\/');
          const packageMatch = fileUrl.match(`(${escapedPackageUrl})(?<projectName>[^\/]*)(\/)`);

          if (packageMatch) {
            const { projectName } = packageMatch.groups;

            if (!touchedProjects.includes(projectName)) {
              touchedProjects.push(projectName);
            }

            filesMatchedCount += 1;
          }
        }
      });
    });

    if (filesMatchedCount < filesModifiedInLastCommit.length) {
      touchedProjects.push('handsontable');
    }
  }

  // If the changes consist of anything except Handsontable, rebuild the handsontable package for linking.
  if (touchedProjects.length > 1 && touchedProjects.includes('handsontable')) {
    await spawnProcess('npm run in handsontable build:es');
  }

  await distributeBetweenPipelines(touchedProjects);
})();
