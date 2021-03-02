/**
 * Link the root-level monorepo packages to the framework directories of the examples monorepo.
 */
import fse from 'fs-extra';
import path from 'path';
import glob from 'glob';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { displayConfirmationMessage, displayErrorMessage, displayWarningMessage } from "../../scripts/utils/index.mjs";
import examplesPackageJson from '../package.json';
import hotPackageJson from '../../package.json';

const workspaces = examplesPackageJson.workspaces.packages;
const hotWorkspaces = hotPackageJson.workspaces.packages;
const isPackageRequired = (packageName, packageLocation) => {
  const frameworkName = packageName.split('/').pop() || null;

  return (
    // If the required package is handsontable
    packageName === 'handsontable' ||
    // If it's in the framework directory
    packageLocation.split('/').pop().includes(frameworkName) ||
    // If it's deeper in the framework directory
    packageLocation.includes(`/${frameworkName}/`)
  );
};
const packagesToLink = [];
const linkPackage = (packageName, packageLocation) => {
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
};
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
    // Currently linking the live dependencies only for the 'next' directory.
    if (packageLocation.startsWith(`./next`)) {
      const frameworkName = packageLocation.split('/').pop();

      if (
        (argv.framework && argv.framework.includes(frameworkName)) ||
        !argv.framework
      ) {
        packagesToLink.forEach((packageName) => {
          linkPackage(packageName, packageLocation);
        });

        // Additional linking to all the examples for Angular (required to load css files from `angular.json`)
        if (frameworkName === `angular`) {
          const angularPackageJson = fse.readJSONSync(`${packageLocation}/package.json`);

          angularPackageJson?.workspaces?.packages.forEach((angularPackagesLocation) => {
            const subdirs = glob.sync(`${packageLocation}/${angularPackagesLocation}`);

            subdirs.forEach((packageLocation) => {
              packagesToLink.forEach((packageName) => {
                linkPackage(packageName, packageLocation);
              });
            });
          });
        }
      }
    }
  });
});
