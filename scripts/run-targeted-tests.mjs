import execa from 'execa';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import glob from 'glob';
import { spawnProcess } from './utils/index.mjs';
import hotPackageJson from '../package.json';

const CONFIG_PATHS = [
  '.config',
  'scripts'
];
const IGNORED_PATHS = [
  '.changelogs',
  '.codesandbox',
  '.github',
  'bin',
  'docs',
  'resources',
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.stylelintignore',
  'CODE_OF_CONDUCT.md',
  'handsontable-general-terms.pdf',
  'handsontable-non-commercial-license.pdf',
  'hot.config.js',
  'LICENSE.txt',
  'README.md',
  'stylelint.config.js',
  'CHANGELOG.md',
];

const argv = yargs(hideBin(process.argv))
  .alias('p', 'pipeline')
  .number('p')
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
  const pipeline = argv.pipeline;
  const isHandsontableTouched = modifiedProjects.includes('handsontable');

  switch (pipeline) {
    case 1:
      if (isHandsontableTouched) {
        await spawnProcess('npm run in handsontable test:production');
      }

      for (const projectName of modifiedProjects) {
        if (
          (!isHandsontableTouched &&
            modifiedProjects.indexOf(projectName) < Math.floor(modifiedProjects.length / pipelineCount)) ||
          (isHandsontableTouched && projectName !== 'handsontable')
        ) {
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

      for (const projectName of modifiedProjects) {
        if (
          !isHandsontableTouched &&
          modifiedProjects.indexOf(projectName) >= Math.floor(modifiedProjects.length / pipelineCount)
        ) {
          await spawnProcess(`npm run in ${projectName} test`);
        }
      }

      break;
    default:
      for (const projectName of modifiedProjects) {
        await spawnProcess(`npm run in ${projectName} test`);
      }
  }
}

(async() => {
  const currentBranch = (
    await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' })
  ).stdout.replace(/(\n)/gm, '');
  const filesModifiedInLastCommit = (
    await execa('git', ['log', '--name-only', '--oneline', 'HEAD^..HEAD'], { encoding: 'utf8' })
  ).stdout.split('\n');
  const fullTestBranchRegex = new RegExp('^(master|develop|release/.{5,})$');
  const configPathsRegex = new RegExp(`^(${CONFIG_PATHS.join('|').replace(/\./g, '\\.')})`);
  const fullTestBranchMatch = fullTestBranchRegex.test(currentBranch);

  filesModifiedInLastCommit.shift();

  const configPathMatched = filesModifiedInLastCommit.some(fileUrl => configPathsRegex.test(fileUrl));

  // Tests triggered on the `master`, `develop` and `release/` branches.
  if (fullTestBranchMatch || configPathMatched) {
    workspacePackages.forEach((packagesLocation) => {
      const subdirs = glob.sync(packagesLocation);

      subdirs.forEach((subdir) => {
        if (subdir === '.') {
          touchedProjects.unshift('handsontable');

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
    const ignoredPathsRegex = new RegExp(`^(${IGNORED_PATHS.join('|').replace(/\./g, '\\.')})`);
    let filesMatchedCount = 0;

    filesModifiedInLastCommit.forEach((fileUrl) => {
      if (ignoredPathsRegex.test(fileUrl)) {
        filesMatchedCount += 1;

        return;
      }

      workspacePackages.forEach((packageWildcard) => {
        if (packageWildcard.includes('/*')) {
          const escapedPackageUrl = packageWildcard.replace(/\*/g, '').replace(/\//g, '\\/');
          const packageMatch = fileUrl.match(`(${escapedPackageUrl})(?<projectName>[^/]*)(/)`);

          if (packageMatch) {
            const { projectName } = packageMatch.groups;

            if (!touchedProjects.includes(projectName)) {
              touchedProjects.push(projectName);
            }

            filesMatchedCount += 1;
          }

        } else if (packageWildcard !== '.') {
          const packageMatch = fileUrl.match(`^${packageWildcard}/`);

          if (packageMatch) {
            if (!touchedProjects.includes(packageWildcard)) {
              touchedProjects.push(packageWildcard);
            }

            filesMatchedCount += 1;
          }
        }
      });
    });

    if (filesMatchedCount < filesModifiedInLastCommit.length) {
      touchedProjects.unshift('handsontable');
    }
  }

  // If there was anything touched except for handsontable, build handsontable for it to be
  // available for import in the other projects.
  if (touchedProjects.length > 1 || (touchedProjects.length === 1 && touchedProjects[0] !== 'handsontable')) {
    await spawnProcess('npm run in handsontable build');
  }

  await distributeBetweenPipelines(touchedProjects);
})();
