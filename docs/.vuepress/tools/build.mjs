import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import semver from 'semver';
import utils from './utils.js';
import { getDocsFrameworkedVersions, getDocsNonFrameworkedVersions, getFrameworks, getLatestVersion }
  from '../helpers.js';

const { logger, spawnProcess } = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildMode = process.env.BUILD_MODE;

const cleanUp = () => {
  logger.info('Clean up dist');
  fse.removeSync(path.resolve(__dirname, '../dist'));
};

const frameworks = getFrameworks();

const build = (version, framework) => {
  let frameworkDir = '';

  if (typeof framework !== 'undefined') {
    frameworkDir = `-${framework}`;
  }

  spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/prebuild${frameworkDir}-${version.replace('.', '-')}`,
    {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_VERSION: version,
        FRAMEWORK: framework,
      },
    },
    true
  );
  logger.success('Version build finished at', new Date().toString());

  return version;
};

const moveDir = (version, framework) => {
  let dir = '';
  let frameworkDir = '';

  if (getLatestVersion() !== semver.coerce(version)) {
    if (typeof framework !== 'undefined') {
      frameworkDir = `-${framework}`;
      dir += `/${framework}`;
    }

    dir += `/${version}`;
  }

  const prebuild = path.resolve(__dirname, '../../',
    `.vuepress/dist/prebuild${frameworkDir}-${version.replace('.', '-')}`);
  const dist = path.resolve(__dirname, '../../', `.vuepress/dist/docs${dir}`);

  logger.info('Apply built version to the `docs/`', dist);

  fse.moveSync(prebuild, dist);
};

const buildApp = async() => {
  const startedAt = new Date().toString();

  logger.info('Build started at', startedAt);

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

  getDocsNonFrameworkedVersions(buildMode).forEach((version) => {
    moveDir(version);
  });

  getDocsFrameworkedVersions(buildMode).forEach((version) => {
    frameworks.forEach((framework) => {
      moveDir(version, framework);
    });
  });

  logger.log('Build has started at', startedAt);
  logger.success('Build finished at', new Date().toString());

};

buildApp();
