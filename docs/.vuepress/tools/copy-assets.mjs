import fse from 'fs-extra';
import path from 'path';

const TARGET_PATH = './.vuepress/public/';
const filesToMove = [
  ['../dist/handsontable.full.css', 'handsontable.css'],
  ['../dist/handsontable.full.js', 'handsontable.js'],
];

filesToMove.forEach((fileSchema) => {
  const [from, target] = fileSchema;

  fse.copySync(
    path.resolve(from),
    path.resolve(`${TARGET_PATH}/${target}`),
    { overwrite: true });
});
