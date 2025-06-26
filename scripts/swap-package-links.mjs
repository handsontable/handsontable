/**
 * Modifies the symlinks in `node_modules` for the defined packages.
 * Used to alias packages for internal importing.
 */
import path from 'path';
import fse from 'fs-extra';
import {
  displayConfirmationMessage,
  displayWarningMessage
} from './utils/console.mjs';

let [pkgName] = process.argv.slice(2);

if (pkgName) {
  // remove version from package name (e.g. @handsontable/angular-13 -> @handsontable/angular)
  pkgName = pkgName.replace(/-\d+/, '');
}

const PACKAGE_LOCATIONS = new Map([
  ['handsontable', './handsontable/tmp'],
  ['@handsontable/angular', './wrappers/angular/dist/hot-table'],
  ['@handsontable/angular-wrapper', './wrappers/angular-wrapper/dist/hot-table']
]);
const linkPackage = (packageName, packageLocation) => {
  if (fse.pathExistsSync(`${packageLocation}`)) {
    fse.removeSync(
      path.resolve(`./node_modules/${packageName}`),
    );

    fse.ensureSymlinkSync(
      path.resolve(`${packageLocation}`),
      path.resolve(`./node_modules/${packageName}`),
      'junction',
    );

    displayConfirmationMessage(`Symlink created ${packageName} -> ${packageLocation}.`);

  } else {
    displayWarningMessage(`Cannot create symlink to ${packageLocation} - the path doesn't exist.`);
  }
};

if (pkgName && PACKAGE_LOCATIONS.has(pkgName)) {
  linkPackage(pkgName, PACKAGE_LOCATIONS.get(pkgName));

} else if (!pkgName) {
  for (const [packageName, packageLocation] of PACKAGE_LOCATIONS) {
    linkPackage(packageName, packageLocation);
  }

} else {
  displayWarningMessage(
    `No package location for provided ${pkgName}, doing nothing. Known packages names: ${
      Array.from(PACKAGE_LOCATIONS.keys()).join(', ')
    }.`);
}
