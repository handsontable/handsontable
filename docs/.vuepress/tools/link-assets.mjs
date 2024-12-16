import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import utils from './utils.js';

const { logger } = utils;

const docsBasePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const SYMLINK_PATHS = [
  { source: '../handsontable/tmp/', target: './.vuepress/public/handsontable/' },
  { source: '../wrappers/react/', target: './.vuepress/public/@handsontable/react/' },
  { source: '../wrappers/react-wrapper/', target: './.vuepress/public/@handsontable/react-wrapper/' },
  { source: '../wrappers/angular/dist/hot-table/', target: './.vuepress/public/@handsontable/angular/' },
  { source: '../wrappers/vue/', target: './.vuepress/public/@handsontable/vue/' },
  { source: '../wrappers/vue3/', target: './.vuepress/public/@handsontable/vue3/' },
];

if (!fs.existsSync(path.resolve('./.vuepress/public/@handsontable'))) {
  fs.mkdirSync(path.resolve('./.vuepress/public/@handsontable'));
}

SYMLINK_PATHS.forEach((paths) => {
  let { source, target } = paths;

  source = path.resolve(source);
  target = path.resolve(target);

  const relativeFrom = path.relative(docsBasePath, source);
  const relativeTo = path.relative(docsBasePath, target);

  if (fs.existsSync(source)) {
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }

    fs.symlinkSync(
      source,
      target,
      'junction',
    );

    logger.success(`Symlink created ${relativeFrom} -> ${relativeTo}.`);

  } else {
    logger.error(`Cannot create symlink from ${relativeFrom} - the path doesn't exist.`);
  }
});
