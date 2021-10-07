/**
 * Modifies the symlinks in `node_modules` for the defined packages.
 * Used to alias packages for internal importing.
 */
import fse from 'fs-extra';
import path from 'path';
import {
  displayConfirmationMessage,
  displayWarningMessage
} from './utils/index.mjs';

const [pkgName] = process.argv.slice(2);
const PACKAGE_LOCATIONS = new Map([
  ['handsontable', './tmp'],
  ['@handsontable/angular', './wrappers/angular/dist/hot-table']
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
    `No package location for provided ${pkgName}, doing nothing. Known page names: ${
      Array.from(PACKAGE_LOCATIONS.keys()).join(', ')
    }.`);
}
