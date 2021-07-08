import path from 'path';
import { copyFileSync } from 'fs';

const TARGET_PATH = './.vuepress/public/';
const filesToMove = [
  ['../dist/handsontable.full.css', 'handsontable.css'],
  ['../dist/handsontable.full.js', 'handsontable.js'],
];

filesToMove.forEach((fileSchema) => {
  const [from, target] = fileSchema;

  copyFileSync(
    path.resolve(from),
    path.resolve(`${TARGET_PATH}/${target}`)
  );
});
