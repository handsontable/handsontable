import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
<<<<<<< HEAD
import {
  getDocsNonFrameworkedVersions,
  getDocsFrameworkedVersions,
  getFrameworks,
  getLatestVersion,
  getVersions,
  FRAMEWORK_SUFFIX
} from '../helpers.js';
=======
import { getThisDocsVersion } from '../helpers.js';
>>>>>>> develop

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
<<<<<<< HEAD
  fse.removeSync(path.resolve(__dirname, '../dist'));
};

const moveNext = (versions) => {
  if (versions[0] === 'next') {
    return [...versions.splice(1), 'next'];
  }
=======
>>>>>>> develop

  await fse.remove(path.resolve(__dirname, '../dist'));
}

<<<<<<< HEAD
const frameworks = getFrameworks();

const build = (version, framework) => {
  let srcFrameworkDir = '';

  if (typeof framework !== 'undefined') {
    srcFrameworkDir = `-${framework}`;
  }

  spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/prebuild${srcFrameworkDir}-${
      version.replace('.', '-')
    }${
      NO_CACHE ? ' --no-cache' : ''
    }`,
    {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_VERSION: version,
        DOCS_FRAMEWORK: framework,
      },
    },
    true
=======
/**
 * Builds the docs.
 *
 * @param {string} version The docs version to build.
 */
async function buildVersion(version) {
  logger.info(`Version ${version} build started at`, new Date().toString());

  const cwd = path.resolve(__dirname, '../../');
  const versionEscaped = version.replace('.', '-');

  await spawnProcess(
    `node --experimental-fetch node_modules/.bin/vuepress build -d .vuepress/dist/pre-${versionEscaped}`,
    { cwd, env: { DOCS_BASE: version }, }
>>>>>>> develop
  );

  if (version !== 'next') {
    await spawnProcess(
      `node --experimental-fetch node_modules/.bin/vuepress build -d .vuepress/dist/pre-latest-${versionEscaped}`,
      { cwd, env: { DOCS_BASE: 'latest' }, }
    );
  }

  logger.success('Version build finished at', new Date().toString());
}

<<<<<<< HEAD
  return version;
};

const moveDir = (version, framework) => {
  let destDir = '';
  let srcFrameworkDir = '';
  const isFrameworked = typeof framework !== 'undefined';

  if (isFrameworked) {
    srcFrameworkDir = `-${framework}`;
  }

  if (getLatestVersion() !== version) {
    destDir += `/${version}`;
  }

  if (isFrameworked) {
    destDir += `/${framework}${FRAMEWORK_SUFFIX}`;
  }

  const prebuild = path.resolve(__dirname, '../../',
    `.vuepress/dist/prebuild${srcFrameworkDir}-${version.replace('.', '-')}`);
  const dist = path.resolve(__dirname, '../../', `.vuepress/dist/docs${destDir}`);

  logger.info('Apply built version to the `docs/`', dist);

  fse.moveSync(prebuild, dist);
};

const buildApp = async() => {
  const startedAt = new Date().toString();
=======
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
>>>>>>> develop

  logger.info('Apply built version to the `docs/`', version);

<<<<<<< HEAD
  if (buildMode) {
    logger.info('buildMode: ', buildMode);
  }

  cleanUp();

  getDocsNonFrameworkedVersions(buildMode).forEach((version) => {
    build(version);
  });

  getDocsFrameworkedVersions(buildMode).forEach((version) => {
    frameworks.forEach((framework) => {
      build(version, framework);
    });
  });

  // At first there is created directory with the latest version of docs. Then, next version of docs are placed inside
  // already created docs/ directory.
  moveNext(getVersions(buildMode)).forEach((version) => {
    if (getDocsFrameworkedVersions(buildMode).includes(version)) {
      frameworks.forEach((framework) => {
        moveDir(version, framework);
      });

    } else {
      moveDir(version);
    }
  });

  logger.log('Build has started at', startedAt);
  logger.success('Build finished at', new Date().toString());
=======
  await fse.move(prebuildVersioned, distVersioned);
}

const startedAt = new Date().toString();

logger.info('Build started at', startedAt);

if (buildMode) {
  logger.info('buildMode: ', buildMode);
}
>>>>>>> develop

await cleanUp();
await buildVersion(getThisDocsVersion());
await concatenate(getThisDocsVersion());

logger.log('Build has started at', startedAt);
logger.success('Build finished at', new Date().toString());
