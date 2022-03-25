import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import utils from './utils.js';
import { getVersions, getFrameworks } from '../helpers.js';

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
  spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/prebuild-${framework}-${version.replace('.', '-')}`,
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
const moveDir = (version, framework, index) => {
  const prebuild = path.resolve(__dirname, '../../', `.vuepress/dist/prebuild-${framework}-${version.replace('.', '-')}`);
  const dist = path.resolve(__dirname, '../../', `.vuepress/dist/docs${index === 0 ? '' : `/${framework}/${version}`}`);

  logger.info(prebuild, dist, index);
  logger.info('Apply built version to the `docs/`', version, dist);

  fse.moveSync(prebuild, dist);
};
const buildApp = async() => {
  const startedAt = new Date().toString();

  logger.info('Build started at', startedAt);

  if (buildMode) {
    logger.info('buildMode: ', buildMode);
  }

  // next shouldn't be at the first position.
  const versions = moveNext(getVersions(buildMode));

  cleanUp();
  versions.forEach((version) => {
    frameworks.forEach((framework) => {
      build(version, framework);
    });
  });

  versions.forEach((version, versionIndex) => {
    frameworks.forEach((framework, frameworkIndex) => {
      moveDir(version, framework, versionIndex * frameworks.length + frameworkIndex);
    });
  });
  
  logger.log('Build has started at', startedAt);
  logger.success('Build finished at', new Date().toString());

};

buildApp();
