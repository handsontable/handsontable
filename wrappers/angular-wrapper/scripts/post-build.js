const fse = require('fs-extra')
const path = require('path');

const DIST_PATH = './dist/hot-table';

const PACKAGE_PATH = path.resolve(`${DIST_PATH}/package.json`);
const PACKAGE = fse.readJsonSync(PACKAGE_PATH, { encoding: 'utf-8' });

// workaround for https://github.com/ng-packagr/ng-packagr/issues/1159
PACKAGE.optionalDependencies = PACKAGE.dependencies;
delete PACKAGE.dependencies;

fse.writeJsonSync(PACKAGE_PATH, PACKAGE);

let licenseBody = fse.readFileSync(path.resolve('./LICENSE.txt'), { encoding: 'utf-8' });

licenseBody += `\nVersion: ${PACKAGE.version} (built at ${new Date().toString()})`;


const SRC_MODULE = path.resolve(`./projects/hot-table/src/lib/hot-table.module.ts`);
const MODULE_BODY = fse.readFileSync(SRC_MODULE, { encoding: 'utf-8' });

fse.writeFileSync(SRC_MODULE, `${MODULE_BODY.replace(`${PACKAGE.version}';`, "0.0.0-VERSION';")}`, { encoding: 'utf-8' });
