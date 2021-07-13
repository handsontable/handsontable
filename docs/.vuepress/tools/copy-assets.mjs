import path from 'path';
import fs from 'fs';

const TARGET_PATH = './.vuepress/public/handsontable/';
const filesToMove = [
  ['../dist/handsontable.full.css', 'handsontable.full.css'],
  ['../dist/handsontable.full.js', 'handsontable.full.js'],
  ['../dist/languages/all.js', 'languages/all.js'],
];

filesToMove.forEach((fileSchema) => {
  const [from, target] = fileSchema;
  const resolvedFrom = path.resolve(from);
  const resolvedTarget = path.resolve(`${TARGET_PATH}/${target}`);
  const dirName = path.dirname(resolvedTarget);

  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName);
  }

  fs.copyFileSync(resolvedFrom, resolvedTarget);
});
