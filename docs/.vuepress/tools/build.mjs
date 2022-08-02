import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
import { getThisDocsVersion, getFrameworks, FRAMEWORK_SUFFIX } from '../helpers.js';

const { logger, spawnProcess } = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildMode = process.env.BUILD_MODE;
const [...cliArgs] = process.argv.slice(2);
const NO_CACHE = cliArgs.some(opt => opt.includes('--no-cache'));

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
 * @param {string} framework The docs framework to build.
 */
const buildVersion = (version, framework) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async(resolve) => {
    logger.info(`Version ${version} build started at`, new Date().toString());

    const cwd = path.resolve(__dirname, '../../');
    const versionEscaped = version.replace('.', '-');

    await spawnProcess(
      'node --experimental-fetch node_modules/.bin/vuepress build -d .vuepress/dist/pre-' +
      `${versionEscaped}/${framework}${FRAMEWORK_SUFFIX}${NO_CACHE ? ' --no-cache' : ''}`,
      { cwd, env: { DOCS_BASE: version, DOCS_FRAMEWORK: framework }, }
    );

    if (version !== 'next') {
      await spawnProcess(
        'node --experimental-fetch node_modules/.bin/vuepress build -d .vuepress/dist/pre-latest-' +
        `${versionEscaped}/${framework}${FRAMEWORK_SUFFIX}${NO_CACHE ? ' --no-cache' : ''}`,
        { cwd, env: { DOCS_BASE: 'latest', DOCS_FRAMEWORK: framework }, }
      );
    }

    logger.success('Version build finished at', new Date().toString());

    resolve();
  });
};

/**
 * Concatenates the dist's.
 *
 * @param {string} version The docs version to concatenate.
 * @param {string} framework The docs framework to build.
 */
async function concatenate(version, framework) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async(resolve) => {
    if (version !== 'next') {
      const prebuildLatest = path.resolve(__dirname, '../../', '.vuepress/dist/pre-latest-' +
        `${version.replace('.', '-')}/${framework}-${FRAMEWORK_SUFFIX}`);
      const distLatest = path.resolve(__dirname, '../../', `.vuepress/dist/docs/${framework}${FRAMEWORK_SUFFIX}`);

      await fse.move(prebuildLatest, distLatest);
    }

    const prebuildVersioned = path.resolve(
      __dirname,
      '../../', `.vuepress/dist/pre-${version.replace('.', '-')}/${framework}${FRAMEWORK_SUFFIX}`
    );
    const distVersioned = path.resolve(
      __dirname,
      '../../', `.vuepress/dist/docs/${version}/${framework}${FRAMEWORK_SUFFIX}`
    );

    logger.info('Apply built version to the `docs/`', version);

    await fse.move(prebuildVersioned, distVersioned);

    resolve();
  });
}

const buildApp = async() => {
  const startedAt = new Date().toString();

  logger.info('Build started at', startedAt);

  if (buildMode) {
    logger.info('buildMode: ', buildMode);
  }

  const frameworks = getFrameworks();

  await cleanUp();

  // eslint-disable-next-line no-restricted-syntax
  for (const framework of frameworks) {
    // eslint-disable-next-line no-await-in-loop
    await buildVersion(getThisDocsVersion(), framework);
    // eslint-disable-next-line no-await-in-loop
    await concatenate(getThisDocsVersion(), framework);
  }

  logger.success('Build finished at', new Date().toString());
};

buildApp();
