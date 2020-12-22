const glob = require('glob');
require('jsdom-global')();

process.env.NODE_ENV = 'production'; // Needed to prevent Vue from displaying information in the console.

const {
  displayErrorMessage,
  displayConfirmationMessage
} = require('./common');

const hotPackageJson = require('../package.json');

const packagesInfo = {
  handsontable: {
    className: 'Handsontable',
    defaultExport: true
  },
  '@handsontable/angular': {
    className: 'HotTableModule',
    packageDirectory: 'dist/hot-table',
    umd: 'dist/hot-table/bundles/handsontable-angular.umd.js'
  },
  '@handsontable/react': {
    className: 'HotTable'
  },
  '@handsontable/vue': {
    className: 'HotTable'
  }
};

/**
 * Verify if the builds of all of the packages defined as workspaces have correct version number in them.
 * Currently it's checking the following builds:
 * - the one declared as default,
 * - UMD (if it's declared under the 'jsdelivr' key in the package.json file).
 */
function verifyPackageVersions() {
  const workspaces = hotPackageJson.workspaces.packages;
  const mismatchedVersions = [];

  console.log('\nMain package.json version:');
  console.log('\x1b[32m%s\x1b[0m', hotPackageJson.version + '\n');

  workspaces.forEach((packagesLocation) => {
    const subdirs = glob.sync(packagesLocation);

    subdirs.forEach((subdir) => {
      const packageJson = require(`../${subdir}/package.json`);
      const packageName = packageJson.name;
      const defaultPackage = require(packageName);
      const jsDelivrPackage = packageJson.jsdelivr ? require(`${packageJson.name}/${packageJson.jsdelivr}`) : null;
      let defaultPackageVersion = null;
      let jsDelivrPackageVersion = null;

      if (packagesInfo[packageName].defaultExport) {
        defaultPackageVersion = defaultPackage.default.version;

      } else {
        defaultPackageVersion = defaultPackage[packagesInfo[packageName].className].version;

        if (jsDelivrPackage) {
          jsDelivrPackageVersion = jsDelivrPackage[packagesInfo[packageName].className].version;
        }
      }

      if (hotPackageJson.version !== defaultPackageVersion) {
        mismatchedVersions.push(`${packageName} (default) - ${defaultPackageVersion}`);
      }

      if (jsDelivrPackageVersion && (hotPackageJson.version !== jsDelivrPackageVersion)) {
        mismatchedVersions.push(`${packageName} (UMD) - ${jsDelivrPackageVersion}`);
      }
    });
  });

  if (mismatchedVersions.length > 0) {
    mismatchedVersions.forEach((mismatch) => {
      displayErrorMessage(`Mismatched versions in ${mismatch}.`);
    });

  } else {
    displayConfirmationMessage('All packages have the expected version number.');
  }
}

verifyPackageVersions();
