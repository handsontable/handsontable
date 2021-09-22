import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import utils from './utils.js';

const { logger } = utils;

const docsBasePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_PATH = path.resolve('../dist/');
const TARGET_PATH = path.resolve('./.vuepress/public/handsontable/');

const relativeFrom = path.relative(docsBasePath, SOURCE_PATH);
const relativeTo = path.relative(docsBasePath, TARGET_PATH);

if (fs.existsSync(SOURCE_PATH)) {
  if (fs.existsSync(TARGET_PATH)) {
    fs.unlinkSync(TARGET_PATH);
  }

  fs.symlinkSync(
    SOURCE_PATH,
    TARGET_PATH,
    'junction',
  );

  logger.success(`Symlink created ${relativeFrom} -> ${relativeTo}.`);

} else {
  logger.error(`Cannot create symlink from ${relativeFrom} - the path doesn't exist.`);
}
