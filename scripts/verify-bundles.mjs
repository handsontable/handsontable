import '@angular/compiler';
import globalJsdom from 'global-jsdom';
import chalk from 'chalk';
import glob from 'glob';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  displayConfirmationMessage,
  displayErrorMessage
} from './utils/console.mjs';
import { findMissingTypePointers } from './utils/typePointers.mjs';
import hotConfig from '../hot.config.js';

// TODO: The bundle verification script was moved to a separate file because of a problem with React and Node 15
//  (https://github.com/facebook/react/issues/20756). Having this script in a separate file, allows killing its
//  process after all the tests are done.

/**
 * Verify if the builds of all the packages defined as workspaces have correct version number in them.
 * Currently, it's checking the following builds:
 * - the one declared as default,
 * - UMD (if it's declared under the 'jsdelivr' key in the package.json file or a `umd` key in this function's
 * settings).
 *
 * It also verifies that every TypeScript declaration pointer each package publishes — `types`,
 * `typings`, and any `types` condition inside `exports` — names a file that is actually present
 * in the tree that gets published. Nothing else in the publish path checks this, which is how
 * `@handsontable/vue3` shipped four releases advertising `types: "./index.d.ts"` with no
 * declaration files in the tarball at all (DEV-2732). A broken pointer is invisible at runtime:
 * the package installs, imports and bundles fine, and only a TypeScript consumer sees `TS7016`.
 *
 * Precondition: every package this script knows about must already be built. That was always
 * true — the version check imports each package's built entry file — so run it after
 * `npm run build`, not from a clean checkout.
 */

const packagesInfo = {
  handsontable: {
    className: 'Handsontable',
    umd: 'tmp/dist/handsontable.full.min.js',
    entryFile: 'tmp/index.mjs',
    defaultExport: true
  },
  '@handsontable/angular-wrapper': {
    className: 'HotTableModule',
    entryFile: 'dist/hot-table/fesm2022/handsontable-angular-wrapper.mjs',
  },
  '@handsontable/react-wrapper': {
    className: 'HotTable',
    entryFile: 'dist/react-handsontable.js',
  },
  '@handsontable/vue3': {
    className: 'HotTable',
    entryFile: 'dist/vue-handsontable.js',
  }
};
const {
  default: mainPackageJson
} = await import('../package.json', {
  with: { type: 'json' },
});
const workspacePackages = mainPackageJson.workspaces;
const mismatchedVersions = [];
const brokenTypePointers = [];
const scriptsDir = dirname(fileURLToPath(import.meta.url));

/**
 * Verify the declaration pointers of the tree a package publishes.
 *
 * `publishConfig.directory` matters here: `handsontable` publishes `tmp/` and the Angular
 * wrapper publishes `dist/hot-table/`, and in both cases the pointers live in the manifest
 * inside that directory, not in the source manifest. The Angular source manifest declares no
 * `types` at all — ng-packagr injects them — so reading the wrong one would check nothing.
 *
 * @param {string} subdir Workspace-relative package directory.
 * @param {object} sourcePackageJson The package's source manifest.
 * @returns {void}
 */
function verifyTypePointers(subdir, sourcePackageJson) {
  const packageDir = resolve(scriptsDir, '..', subdir);
  const publishDir = sourcePackageJson.publishConfig?.directory ?
    join(packageDir, sourcePackageJson.publishConfig.directory) :
    packageDir;
  const publishManifestPath = join(publishDir, 'package.json');

  if (!existsSync(publishManifestPath)) {
    brokenTypePointers.push(
      `${sourcePackageJson.name} - no manifest at ${publishManifestPath}; the package was not built`
    );

    return;
  }

  let publishManifest = null;

  try {
    publishManifest = JSON.parse(readFileSync(publishManifestPath, 'utf8'));

  } catch (error) {
    // Report through the same collector as every other failure, so a half-written manifest
    // surfaces as a named problem rather than a raw stack trace.
    brokenTypePointers.push(
      `${sourcePackageJson.name} - could not read ${publishManifestPath}: ${error.message}`
    );

    return;
  }

  const missing = findMissingTypePointers(
    publishManifest,
    target => existsSync(join(publishDir, target))
  );

  missing.forEach(({ field, target }) => {
    brokenTypePointers.push(
      `${publishManifest.name} - ${field} is ${target} but the file does not exist in ${publishDir}`
    );
  });
}

globalJsdom();

console.log(`\nHOT config version:\n${chalk.green(hotConfig.HOT_VERSION)}\n`);

for (const packagesLocation of workspacePackages) {
  const subdirs = glob.sync(packagesLocation);

  for (const subdir of subdirs) {
    const packageJsonLocation = `../${subdir}/package.json`;
    const { default: packageJson } = await import(packageJsonLocation, { with: { type: 'json' } });
    const packageName = packageJson.name;

    if (!packagesInfo[packageName]) {
      // eslint-disable-next-line no-continue
      continue;
    }

    verifyTypePointers(subdir, packageJson);

    if (packagesInfo[packageName]) {
      const defaultPackage = await import(
        packagesInfo[packageName].entryFile ? `../${subdir}/${packagesInfo[packageName].entryFile}` : packageName
      );
      let defaultPackageVersion = null;
      let umdPackageVersion = null;
      let umdPackage = null;

      if (packagesInfo[packageName].umd || packageJson.jsdelivr) {
        umdPackage = await import(
          packagesInfo[packageName].umd ?
            `../${subdir}/${packagesInfo[packageName].umd}` :
            `../${subdir}/${packageJson.jsdelivr.replace('./', '')}`);
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

      if (hotConfig.HOT_VERSION !== defaultPackageVersion) {
        mismatchedVersions.push(`${packageName} (default) - ${defaultPackageVersion}`);
      }

      if (umdPackageVersion && (hotConfig.HOT_VERSION !== umdPackageVersion)) {
        mismatchedVersions.push(`${packageName} (UMD) - ${umdPackageVersion}`);
      }
    }
  }
}

if (mismatchedVersions.length > 0 || brokenTypePointers.length > 0) {
  mismatchedVersions.forEach((mismatch) => {
    displayErrorMessage(`\nMismatched versions in ${mismatch}.`);
  });

  brokenTypePointers.forEach((problem) => {
    displayErrorMessage(`\nBroken type declaration pointer: ${problem}.`);
  });

  process.exit(1);

} else {
  displayConfirmationMessage(
    '\nAll packages have the expected version number and resolvable type declarations.\n'
  );

  process.exit(0);
}
