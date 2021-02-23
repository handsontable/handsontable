/**
 * Link the root-level monorepo packages to the framework directories of the examples monorepo.
 */
import examplesPackageJson from '../package.json';
import hotPackageJson from '../../package.json';
import fse from 'fs-extra';
import path from 'path';
import { displayConfirmationMessage, displayErrorMessage, displayWarningMessage } from "../../scripts/utils/index.mjs";
import glob from 'glob';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const workspaces = examplesPackageJson.workspaces.packages;
const hotWorkspaces = hotPackageJson.workspaces.packages;
const isPackageRequired = (packageName, packageLocation) => {
  return packageName === 'handsontable' || packageLocation.split('/').pop().includes(packageName.split('/').pop());
};
const packagesToLink = [];
const argv = yargs(hideBin(process.argv))
  .alias('f', 'framework')
  .array('f')
  .describe('f', 'Target framework to the linking to take place in. Defaults to none.')
  .argv;

if (!argv.f) {
  displayWarningMessage('No frameworks passed as a `-f` argument, exiting.');
  process.exit(0);
}

for (const hotPackageGlob of hotWorkspaces) {
  const mainPackages = glob.sync(`../${hotPackageGlob}`);

  for (const mainPackageUrl of mainPackages) {
    const { default: packagePackageJson } = await import(`../${mainPackageUrl}/package.json`);
    const packageName = packagePackageJson.name;
      packagesToLink.push(packageName)
  }
}

workspaces.forEach((packagesLocation) => {
  const subdirs = glob.sync(`./${packagesLocation}`);

  subdirs.forEach((packageLocation) => {
    if (
      (argv.framework && argv.framework.includes(packageLocation.split('/').pop())) ||
      !argv.framework
    ) {
      packagesToLink.forEach((packageName) => {
        if (isPackageRequired(packageName, packageLocation)) {
          try {
            fse.removeSync(
              path.resolve(`./${packageLocation}/node_modules/${packageName}`),
            );

            fse.ensureSymlinkSync(
              path.resolve(`../node_modules/${packageName}`),
              path.resolve(`./${packageLocation}/node_modules/${packageName}`)
            );

          } catch (e) {
            displayErrorMessage(e);

            process.exit(1);
          }

          displayConfirmationMessage(`Symlink created ${packageName} -> ${packageLocation}.`);
        }
      });
    }
  });
});
