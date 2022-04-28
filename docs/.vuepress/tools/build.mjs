import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
import { getVersions } from '../helpers.js';

const { logger, spawnProcess } = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildMode = process.env.BUILD_MODE;
const [ ...cliArgs ] = process.argv.slice(2);

const NO_CACHE = cliArgs.some(opt => opt.indexOf('--no-cache') !== -1);

const cleanUp = () => {
  logger.info('Clean up dist');
  fse.removeSync(path.resolve(__dirname, '../dist'));
};
const moveNext = (versions) => {
  if (versions[0] === 'next') {
    return [...versions.splice(1), 'next'];
  }

  return versions;
};

const buildVersion = (version) => {
  logger.info(`Version ${version} build started at`, new Date().toString());

  spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/prebuild-${
      version.replace('.', '-')
    }${
      NO_CACHE ? ' --no-cache' : ''
    }`,
    {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_VERSION: version
      },
    },
    true
  );
  logger.success('Version build finished at', new Date().toString());

  return version;
};
const concatenate = (version, index) => {
  const prebuild = path.resolve(__dirname, '../../', `.vuepress/dist/prebuild-${version.replace('.', '-')}`);
  const dist = path.resolve(__dirname, '../../', `.vuepress/dist/docs${index === 0 ? '' : `/${version}`}`);

  logger.info('Apply built version to the `docs/`', version, dist);

  fse.moveSync(prebuild, dist);
};
const buildApp = async() => {
  const startedAt = new Date().toString();

  logger.info('Build started at', startedAt);

  if (buildMode) {
    logger.info('buildMode: ', buildMode);
  }
  cleanUp();
  moveNext(getVersions(buildMode)) // next shouldn't be at the first position.
    .map(buildVersion)
    .forEach(concatenate);
  logger.log('Build has started at', startedAt);
  logger.success('Build finished at', new Date().toString());

};

buildApp();
