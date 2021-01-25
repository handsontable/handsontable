const fse = require('fs-extra');
const path = require('path');

const PACKAGE_LOCATIONS = {
  handsontable: './tmp',
  '@handsontable/angular': './wrappers/angular-handsontable/dist/hot-table'
};

for (const [packageName, packageLocation] of Object.entries(PACKAGE_LOCATIONS)) {
  fse.removeSync(
    path.resolve(`./node_modules/${packageName}`),
  );

  fse.ensureSymlinkSync(
    path.resolve(`${packageLocation}`),
    path.resolve(`./node_modules/${packageName}`),
  );

  console.log(`Symlink created ${packageName} -> ${packageLocation}.`);
}
