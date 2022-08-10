import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import fs from 'fs/promises';
import utils from './utils.js';
import { getThisDocsVersion, getFrameworks, FRAMEWORK_SUFFIX, getPrettyFrameworkName } from '../helpers.js';

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
async function buildVersion(version, framework) {
  logger.info(`Version "${version}" with framework "${getPrettyFrameworkName(framework)}" build started at`,
    new Date().toString());

  const cwd = path.resolve(__dirname, '../../');
  const versionEscaped = version.replace('.', '-');

  await spawnProcess(
    'node --experimental-fetch node_modules/.bin/vuepress build -d .vuepress/dist/pre-' +
      `${versionEscaped}/${NO_CACHE ? ' --no-cache' : ''}`,
      { cwd, env: { DOCS_BASE: version, DOCS_FRAMEWORK: framework }, }
    );

  if (version !== 'next') {
    await spawnProcess(
      'node --experimental-fetch node_modules/.bin/vuepress build -d .vuepress/dist/pre-latest-' +
      `${versionEscaped}/${NO_CACHE ? ' --no-cache' : ''}`,
      { cwd, env: { DOCS_BASE: 'latest', DOCS_FRAMEWORK: framework }, }
    );
  }

  logger.success(`Version "${version}" with framework "${getPrettyFrameworkName(framework)}" build ` +
    'finished at', new Date().toString());
};

/**
 * Concatenates the dist's.
 *
 * @param {string} version The docs version to concatenate.
 * @param {string} framework The docs framework to build.
 */
async function concatenate(version, framework) {
  const versionEscaped = version.replace('.', '-');

  if (version !== 'next') {
    const prebuildLatest = path.resolve(__dirname, '../../', `.vuepress/dist/pre-latest-${versionEscaped}`);
    const distLatest = path.resolve(__dirname, '../../', '.vuepress/dist/docs');

    await fs.cp(prebuildLatest, distLatest, { force: true, recursive: true });
    await fs.rmdir(prebuildLatest, { recursive: true });
  }

  const prebuildVersioned = path.resolve(
    __dirname,
    '../../', `.vuepress/dist/pre-${versionEscaped}`
  );
  const distVersioned = path.resolve(
    __dirname,
    '../../', `.vuepress/dist/docs/${version}`
  );

  logger.info(`Apply built version "${version}" with framework "${getPrettyFrameworkName(framework)}" ` +
    'to the `docs/`');

  await fs.cp(prebuildVersioned, distVersioned, { force: true, recursive: true });
  await fs.rmdir(prebuildVersioned, { recursive: true });
}

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
