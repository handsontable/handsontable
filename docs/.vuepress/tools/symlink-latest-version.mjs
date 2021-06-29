import fs from 'fs';
import path from 'path';
import helpers from '../helpers.js';
import utils from './utils.js';

const { logger } = utils;
const latestVersion = helpers.getLatestVersion();

fs.unlinkSync(path.resolve(`./latest`));
fs.symlinkSync(
  path.resolve(`./${latestVersion}`),
  path.resolve(`./latest`),
  'junction',
);

logger.success(`Symlink created "./latest" points to "./${latestVersion}".`);
