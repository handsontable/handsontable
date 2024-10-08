/**
 * Link the root-level monorepo packages to the framework directories of the examples monorepo.
 */
import fse from 'fs-extra';
import path from 'path';
import glob from 'glob';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';
import {
  displayConfirmationMessage,
  displayErrorMessage,
  displayWarningMessage
} from '../../scripts/utils/index.mjs';
import examplesPackageJson from '../package.json' with { type: 'json' };
import mainPackageJson from '../../package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exampleFrameworkSubdirs = examplesPackageJson.internal.framework_dirs;
const hotWorkspaces = mainPackageJson.workspaces;
const isPackageRequired = (packageName, packageLocation) => {
  const frameworkName = packageName.split('/').pop() || null;
  const isLegacyAngularExample = packageLocation.includes('/angular-9/') || packageLocation.includes('/angular-10/');

  return (
    // If the required package is handsontable
    packageName === 'handsontable' ||
    packageLocation.includes(frameworkName) ||
    // If the required package is @handsontable/angular
    (frameworkName === 'angular' && packageName === '@handsontable/angular' && !isLegacyAngularExample) ||
    // If it's in the framework directory
    packageLocation.split('/').pop().includes(frameworkName) ||
    // If it's deeper in the framework directory
    packageLocation.includes(`/${frameworkName}/`)
  );
};
const packagesToLink = [];
const linkPackage = (sourceLocation, linkLocation, packageName, exampleDir = false) => {
  const mainDependencyLocationPath = `${sourceLocation}/${packageName}`;
  const destinationDependencyLocationPath = `${linkLocation}/${packageName}`;

  if (isPackageRequired(packageName, linkLocation) && fse.pathExistsSync(path.resolve(mainDependencyLocationPath))) {
    try {
      fse.removeSync(
        path.resolve(destinationDependencyLocationPath),
      );

      fse.ensureSymlinkSync(
        path.resolve(mainDependencyLocationPath),
        path.resolve(destinationDependencyLocationPath),
        'junction',
      );

    } catch (e) {
      displayErrorMessage(e);

      process.exit(1);
    }

    displayConfirmationMessage(`${exampleDir ? '\t' : ''}Symlink created for ${packageName} in ${
      linkLocation.replace(path.resolve(__dirname, '..'), '').replace('/node_modules', '')}.`);
  }
};
const argv = yargs(hideBin(process.argv))
  .describe('examples-version', 'Version of the examples package to do the linking in.')
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
    const { default: packagePackageJson } = await import(`../${mainPackageUrl}/package.json`, { with: { type: 'json' } });
    const packageName = packagePackageJson.name;
    packagesToLink.push(packageName);
  }
}

exampleFrameworkSubdirs.forEach((packagesLocation) => {
  const subdirs = glob.sync(`./${packagesLocation}`);

  subdirs.forEach((packageLocation) => {
    const frameworkLocationName = packageLocation.split('/').pop();

    if (
      packageLocation.startsWith(`./${argv.examplesVersion}`) &&
      ((argv.framework && argv.framework.includes(frameworkLocationName)) ||
      !argv.framework)
    ) {

      // Currently linking the live dependencies only for the 'next' directory.
      if (argv.examplesVersion.startsWith('next')) {
        packagesToLink.forEach((packageName) => {
          linkPackage(
            path.resolve('../node_modules'),
            path.resolve(packageLocation, './node_modules'),
            packageName
          );
        });
      }

      // Additional linking to all the examples for Angular (required to load css files from `angular.json`)
      if (/^angular(-(\d+|next))?$/.test(frameworkLocationName)) {
        const angularPackageJson = fse.readJSONSync(`${packageLocation}/package.json`);
        const workspacesList = angularPackageJson?.workspaces.packages || angularPackageJson?.workspaces;

        workspacesList.forEach((angularPackagesLocation) => {
          const angularPackageDirs = glob.sync(`${packageLocation}/${angularPackagesLocation}`);

          angularPackageDirs.forEach((angularPackageLocation) => {
            packagesToLink.forEach((packageName) => {
              linkPackage(
                path.resolve(angularPackageLocation, '../node_modules'),
                path.resolve(angularPackageLocation, './node_modules'),
                packageName,
                true
              );
            });
          });
        });
      }
    }
  });
});
