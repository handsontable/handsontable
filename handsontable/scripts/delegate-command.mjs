/**
 * Delegate the provided command to a sub-project.
 * For example:
 * `run in vue build`
 * will run the `build` command from the directory of the provided project.
 */
import execa from 'execa';
import glob from 'glob';
import hotPackageJson from '../package.json';
import { displayErrorMessage } from './utils/index.mjs';

const [project, command, ...args] = process.argv.slice(2);
const workspacePackages = hotPackageJson.workspaces.packages;
const PROJECT_ALIASES = {
  handsontable: '.',
};
const commandArray = [
  'run',
  command
];

if (args) {
  commandArray.push(...args);
}

let processCwd = null;

workspacePackages.forEach((packagesLocation) => {
  const subdirs = glob.sync(packagesLocation);

  subdirs.some((subdir) => {
    const directoryName = subdir.split('/').pop();

    if (project === directoryName || PROJECT_ALIASES[project] === directoryName) {
      processCwd = subdir;
    }

    return !!processCwd;
  });
});

((async function() {
  try {
    if (processCwd) {
      await execa('npm', commandArray, {
        cwd: processCwd,
        stdio: 'inherit'
      });

    } else {
      displayErrorMessage('Found no match for the provided project name.');
    }

  } catch (error) {
    process.exit(error.exitCode);
  }
})());
