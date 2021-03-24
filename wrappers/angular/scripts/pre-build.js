const fse = require('fs-extra');
const path = require('path');

const LICENSE = 'LICENSE.txt';
const README = 'README.md';
const PACKAGE = 'package.json';
const TARGET_PATH = './dist/hot-table';

[
  'LICENSE.txt',
  'README.md',
  'handsontable-general-terms.pdf',
  'handsontable-non-commercial-license.pdf',
].forEach((file) => {
  fse.copySync(path.resolve(`./${file}`), path.resolve(`${TARGET_PATH}/${file}`), { overwrite: true });
});

const PACKAGE_BODY = fse.readJsonSync(path.resolve(`./${PACKAGE}`), { encoding: 'utf-8' });

delete PACKAGE_BODY.dependencies;
delete PACKAGE_BODY.devDependencies;
delete PACKAGE_BODY.exports;

fse.writeJsonSync(path.resolve(`./projects/hot-table/${PACKAGE}`), PACKAGE_BODY);

const SRC_MODULE = path.resolve(`./projects/hot-table/src/lib/hot-table.module.ts`);
const MODULE_BODY = fse.readFileSync(SRC_MODULE, { encoding: 'utf-8' });

fse.writeFileSync(SRC_MODULE, `${MODULE_BODY.replace("0.0.0-VERSION';", `${PACKAGE_BODY.version}';`)}`, { encoding: 'utf-8' });
