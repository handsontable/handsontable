const fse = require('fs-extra');
const path = require('path');

const TARGET_PATH = './tmp';
const filesToMove = [
  'dist',
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
