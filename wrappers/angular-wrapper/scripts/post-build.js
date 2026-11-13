const fse = require('fs-extra')
const path = require('path');

const DIST_PATH = './dist/hot-table';

const PACKAGE_PATH = path.resolve(`${DIST_PATH}/package.json`);
const PACKAGE = fse.readJsonSync(PACKAGE_PATH, { encoding: 'utf-8' });

// workaround for https://github.com/ng-packagr/ng-packagr/issues/1159
PACKAGE.optionalDependencies = PACKAGE.dependencies;
delete PACKAGE.dependencies;

// ng-packagr 21+ adds `"type": "module"`. The fesm bundle is `.mjs`, so the runtime does not need it, but it makes
// TypeScript read the bundled declarations as ESM, and a `nodenext` consumer then fails with TS2709 on
// `import Handsontable from "handsontable/base"`. Dropping it keeps the declarations resolving as before.
delete PACKAGE.type;

fse.writeJsonSync(PACKAGE_PATH, PACKAGE);

let licenseBody = fse.readFileSync(path.resolve('./LICENSE.txt'), { encoding: 'utf-8' });

licenseBody += `\nVersion: ${PACKAGE.version} (built at ${new Date().toString()})`;


const SRC_MODULE = path.resolve(`./projects/hot-table/src/lib/hot-table.module.ts`);
const MODULE_BODY = fse.readFileSync(SRC_MODULE, { encoding: 'utf-8' });

fse.writeFileSync(SRC_MODULE, `${MODULE_BODY.replace(`${PACKAGE.version}';`, "0.0.0-VERSION';")}`, { encoding: 'utf-8' });

// Runs last, so a failure still leaves the module version restored. The bundled declarations must
// import packages by name. A baseUrl-relative specifier such as `import("node_modules/handsontable")`
// resolves in this repo and nowhere else.
const TYPES_PATH = path.resolve(`${DIST_PATH}/types/handsontable-angular-wrapper.d.ts`);
const LEAKED_SPECIFIER = /(?:from|import\()\s*["'][^"']*node_modules\//;

if (LEAKED_SPECIFIER.test(fse.readFileSync(TYPES_PATH, { encoding: 'utf-8' }))) {
  throw new Error(`${TYPES_PATH} imports a path inside node_modules; check "baseUrl" and "paths" in tsconfig.json.`);
}
