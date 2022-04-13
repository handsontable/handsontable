import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
import { getDocsNonFrameworkedVersions, getDocsFrameworkedVersions, getFrameworks, getLatestVersion,
  getDefaultFramework, getVersions } from '../helpers.js';

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
  const isFrameworked = typeof framework !== 'undefined';

  if (isFrameworked) {
    frameworkDir = `-${framework}`;
  }

  const moveDirectlyToMainDir = getLatestVersion() === version && (
    (isFrameworked && framework === getDefaultFramework()) || isFrameworked === false);

  if (moveDirectlyToMainDir === false) {
    if (isFrameworked) {
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

const moveNext = (versions) => {
  if (versions[0] === 'next') {
    return [...versions.splice(1), 'next'];
  }

  return versions;
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

};

buildApp();
