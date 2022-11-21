const fse = require('fs-extra')
const path = require('path');

const DIST_PATH = './dist/hot-table';

const PACKAGE_PATH = path.resolve(`${DIST_PATH}/package.json`);
const PACKAGE = fse.readJsonSync(PACKAGE_PATH, { encoding: 'utf-8' });

// workaround for https://github.com/ng-packagr/ng-packagr/issues/1159
PACKAGE.optionalDependencies = PACKAGE.dependencies;
delete PACKAGE.dependencies;

fse.writeJsonSync(PACKAGE_PATH, PACKAGE);

const UMD_MIN_JS_PATH = path.resolve(`${DIST_PATH}/bundles/handsontable-angular.umd.min.js`);
const UMD_JS_PATH = path.resolve(`${DIST_PATH}/bundles/handsontable-angular.umd.js`);
let licenseBody = fse.readFileSync(path.resolve('./LICENSE.txt'), { encoding: 'utf-8' });

licenseBody += `\nVersion: ${PACKAGE.version} (built at ${new Date().toString()})`;

const licenseBanner = `/*!\n${licenseBody.replace(/^/gm, ' * ')}\n */\n`;
const minUMDWithLicense = `${licenseBanner}${fse.readFileSync(UMD_MIN_JS_PATH, { encoding: 'utf-8' })}`;
const UMDWithLicense = `${licenseBanner}${fse.readFileSync(UMD_JS_PATH, { encoding: 'utf-8' })}`;

fse.writeFileSync(UMD_MIN_JS_PATH, minUMDWithLicense, { encoding: 'utf-8' });
fse.writeFileSync(UMD_JS_PATH, UMDWithLicense, { encoding: 'utf-8' });

const SRC_MODULE = path.resolve(`./projects/hot-table/src/lib/hot-table.module.ts`);
const MODULE_BODY = fse.readFileSync(SRC_MODULE, { encoding: 'utf-8' });

fse.writeFileSync(SRC_MODULE, `${MODULE_BODY.replace(`${PACKAGE.version}';`, "0.0.0-VERSION';")}`, { encoding: 'utf-8' });
