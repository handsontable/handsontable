import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
import { getThisDocsVersion } from '../helpers.js';

const { logger, spawnProcess } = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildMode = process.env.BUILD_MODE;

const cleanUp = () => {
  logger.info('Clean up dist');
  fse.removeSync(path.resolve(__dirname, '../dist'));
};

const buildVersion = (version) => {
  logger.info(`Version ${version} build started at`, new Date().toString());

  spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/pre-latest-${version.replace('.', '-')}`,
    {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_BASE: 'latest'
      },
    },
    true
  );
  spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/pre-${version.replace('.', '-')}`,
    {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_BASE: version
      },
    },
    true
  );
  logger.success('Version build finished at', new Date().toString());

  return version;
};
const concatenate = (version) => {
  const prebuildLatest = path.resolve(__dirname, '../../', `.vuepress/dist/pre-latest-${version.replace('.', '-')}`);
  const prebuildVersioned = path.resolve(__dirname, '../../', `.vuepress/dist/pre-${version.replace('.', '-')}`);
  const distLatest = path.resolve(__dirname, '../../', '.vuepress/dist/docs');
  const distVersioned = path.resolve(__dirname, '../../', `.vuepress/dist/docs/${version}`);

  logger.info('Apply built version to the `docs/`', version);

  fse.moveSync(prebuildLatest, distLatest);
  fse.moveSync(prebuildVersioned, distVersioned);
};
const buildApp = async() => {
  const startedAt = new Date().toString();

  logger.info('Build started at', startedAt);

  if (buildMode) {
    logger.info('buildMode: ', buildMode);
  }

  cleanUp();
  buildVersion(getThisDocsVersion());
  concatenate(getThisDocsVersion());

  logger.log('Build has started at', startedAt);
  logger.success('Build finished at', new Date().toString());

};

buildApp();
