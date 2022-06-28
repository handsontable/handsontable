import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
import { getThisDocsVersion } from '../helpers.js';

const { logger, spawnProcess } = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildMode = process.env.BUILD_MODE;

/**
 * Cleans the dist.
 */
async function cleanUp() {
  logger.info('Clean up dist');

  await fse.remove(path.resolve(__dirname, '../dist'));
}

/**
 * Builds the docs.
 *
 * @param {string} version The docs version to build.
 */
async function buildVersion(version) {
  logger.info(`Version ${version} build started at`, new Date().toString());

  const cwd = path.resolve(__dirname, '../../');

  await spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/pre-${version.replace('.', '-')}`,
    { cwd, env: { DOCS_BASE: version }, }
  );

  if (version !== 'next') {
    await spawnProcess(
      `node_modules/.bin/vuepress build -d .vuepress/dist/pre-latest-${version.replace('.', '-')}`,
      { cwd, env: { DOCS_BASE: 'latest' }, }
    );
  }

  logger.success('Version build finished at', new Date().toString());
}

/**
 * Concatenates the dist's.
 *
 * @param {version} version The docs version to concatenate.
 */
async function concatenate(version) {
  if (version !== 'next') {
    const prebuildLatest = path.resolve(__dirname, '../../', `.vuepress/dist/pre-latest-${version.replace('.', '-')}`);
    const distLatest = path.resolve(__dirname, '../../', '.vuepress/dist/docs');

    await fse.move(prebuildLatest, distLatest);
  }

  const prebuildVersioned = path.resolve(__dirname, '../../', `.vuepress/dist/pre-${version.replace('.', '-')}`);
  const distVersioned = path.resolve(__dirname, '../../', `.vuepress/dist/docs/${version}`);

  logger.info('Apply built version to the `docs/`', version);

  await fse.move(prebuildVersioned, distVersioned);
}

const startedAt = new Date().toString();

logger.info('Build started at', startedAt);

if (buildMode) {
  logger.info('buildMode: ', buildMode);
}

await cleanUp();
await buildVersion(getThisDocsVersion());
await concatenate(getThisDocsVersion());

logger.log('Build has started at', startedAt);
logger.success('Build finished at', new Date().toString());
