import fs from 'fs';
import path from 'path';
import helpers from '../helpers.js';
import utils from './utils.js';

const { logger } = utils;
const latestVersion = helpers.getLatestVersion();
const pathToLatest = path.resolve('./latest');

if (fs.existsSync(pathToLatest)) {
  fs.unlinkSync(pathToLatest);
}

fs.symlinkSync(
  path.resolve(`./${latestVersion}`),
  pathToLatest,
  'junction',
);

logger.success(`Symlink created "./latest" points to "./${latestVersion}".`);
