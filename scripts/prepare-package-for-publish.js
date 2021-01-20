const fse = require('fs-extra');
const path = require('path');

const TARGET_PATH = './tmp';
const filesToMove = [
  'dist/languages',
  'dist/handsontable.js',
  'dist/handsontable.css',
  'dist/handsontable.full.js',
  'dist/handsontable.full.css',
  'dist/handsontable.min.js',
  'dist/handsontable.min.css',
  'dist/handsontable.full.min.js',
  'dist/handsontable.full.min.css',
  'dist/README.md',
  'languages',
  'CHANGELOG.md',
  'handsontable.d.ts',
  'handsontable-general-terms.pdf',
  'handsontable-non-commercial-license.pdf',
  'LICENSE.txt',
  'package.json',
  'README.md',
];

filesToMove.forEach((file) => {
  fse.copySync(
    path.resolve(`./${file}`),
    path.resolve(`${TARGET_PATH}/${file}`),
    { overwrite: true });
});
