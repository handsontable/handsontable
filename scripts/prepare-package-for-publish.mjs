import fse from 'fs-extra';
import path from 'path';

const TARGET_PATH = './tmp';
const filesToMove = [
  'dist/handsontable.css',
  'dist/handsontable.full.css',
  'dist/handsontable.full.js',
  'dist/handsontable.full.min.css',
  'dist/handsontable.full.min.js',
  'dist/handsontable.js',
  'dist/handsontable.min.css',
  'dist/handsontable.min.js',
  'dist/languages',
  'dist/README.md',
  'languages',
  'base.d.ts',
  'CHANGELOG.md',
  'handsontable-general-terms.pdf',
  'handsontable-non-commercial-license.pdf',
  'handsontable.d.ts',
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
