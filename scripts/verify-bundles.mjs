import JSDOMGlobal from 'jsdom-global';
import chalk from 'chalk';
import glob from 'glob';
import {
  displayConfirmationMessage,
  displayErrorMessage
} from './utils/console.mjs';

// TODO: The bundle verification script was moved to a separate file because of a problem with React and Node 15
//  (https://github.com/facebook/react/issues/20756). Having this script in a separate file, allows killing its
//  process after all the tests are done.

/**
 * Verify if the builds of all of the packages defined as workspaces have correct version number in them.
 * Currently it's checking the following builds:
 * - the one declared as default,
 * - UMD (if it's declared under the 'jsdelivr' key in the package.json file or a `umd` key in this function's
 * settings).
 */
async function verifyBundles() {
  const packagesInfo = {
    handsontable: {
      className: 'Handsontable',
      umd: 'tmp/dist/handsontable.full.min.js',
      entryFile: 'tmp/index.mjs',
      defaultExport: true
    },
    '@handsontable/angular': {
      className: 'HotTableModule'
    },
    '@handsontable/react': {
      className: 'HotTable'
    },
    '@handsontable/vue': {
      className: 'HotTable'
    }
  };
  const { default: hotPackageJson } = await import('../package.json');
  const workspacePackages = hotPackageJson.workspaces.packages;
  const mismatchedVersions = [];

  JSDOMGlobal();

  console.log(`\nMain package.json version:\n${chalk.green(hotPackageJson.version)}\n`);

  for (const packagesLocation of workspacePackages) {
    const subdirs = glob.sync(packagesLocation);

    for (const subdir of subdirs) {
      const packageJsonLocation = `../${subdir}/package.json`;
      const { default: packageJson } = await import(packageJsonLocation);
      const packageName = packageJson.name;

      if (packagesInfo[packageName]) {
        const defaultPackage = await import(
          packagesInfo[packageName].entryFile ?
            `../${subdir}/${packagesInfo[packageName].entryFile}` :
            packageName
        );
        let defaultPackageVersion = null;
        let umdPackageVersion = null;
        let umdPackage = null;

        if (packagesInfo[packageName].umd || packageJson.jsdelivr) {
          umdPackage = await import(
            packagesInfo[packageName].entryFile ?
              `../${subdir}/${packagesInfo[packageName].umd}` :
              `${packageName}/${packageJson.jsdelivr}`
          );
          umdPackage = umdPackage.default;
        }

        if (packagesInfo[packageName]?.defaultExport) {
          defaultPackageVersion = defaultPackage.default.version;

        } else {
          defaultPackageVersion = defaultPackage[packagesInfo[packageName]?.className]?.version;

          if (umdPackage) {
            umdPackageVersion = umdPackage[packagesInfo[packageName]?.className]?.version;
          }
        }

        if (hotPackageJson.version !== defaultPackageVersion) {
          mismatchedVersions.push(`${packageName} (default) - ${defaultPackageVersion}`);
        }

        if (umdPackageVersion && (hotPackageJson.version !== umdPackageVersion)) {
          mismatchedVersions.push(`${packageName} (UMD) - ${umdPackageVersion}`);
        }
      }
    }
  }

  if (mismatchedVersions.length > 0) {
    mismatchedVersions.forEach((mismatch) => {
      displayErrorMessage(`\nMismatched versions in ${mismatch}.`);
    });

    process.exit(1);

  } else {
    displayConfirmationMessage('\nAll packages have the expected version number.\n');

    process.exit(0);
  }
}

verifyBundles();
