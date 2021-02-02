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

const [/* node bin */, /* path to this script */, pkgName] = process.argv;

const PACKAGE_LOCATIONS = {
  handsontable: './tmp',
  '@handsontable/angular': './wrappers/angular-handsontable/dist/hot-table'
};
let packageList = {};

if (pkgName) {
  packageList[pkgName] = PACKAGE_LOCATIONS[pkgName];

} else {
  packageList = PACKAGE_LOCATIONS;
}

for (const [packageName, packageLocation] of Object.entries(packageList)) {
  if (fse.pathExistsSync(`${packageLocation}`)) {
    fse.removeSync(
      path.resolve(`./node_modules/${packageName}`),
    );

    fse.ensureSymlinkSync(
      path.resolve(`${packageLocation}`),
      path.resolve(`./node_modules/${packageName}`),
    );

    displayConfirmationMessage(`Symlink created ${packageName} -> ${packageLocation}.`);

  } else {
    displayWarningMessage(`Cannot create symlink to ${packageLocation} - the path doesn't exits.`);
  }
}
