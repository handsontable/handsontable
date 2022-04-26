import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
import { getDocsNonFrameworkedVersions, getDocsFrameworkedVersions, getFrameworks, getLatestVersion,
  getVersions, FRAMEWORK_SUFFIX } from '../helpers.js';

const { logger, spawnProcess } = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildMode = process.env.BUILD_MODE;

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

const frameworks = getFrameworks();

const build = (version, framework) => {
  let srcFrameworkDir = '';

  if (typeof framework !== 'undefined') {
    srcFrameworkDir = `-${framework}`;
  }

  spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/prebuild${srcFrameworkDir}-${version.replace('.', '-')}`,
    {
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_VERSION: version,
        DOCS_FRAMEWORK: framework,
      },
    },
    true
  );
  logger.success('Version build finished at', new Date().toString());

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

};

buildApp();
