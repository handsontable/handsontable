import {getVersions} from "../helpers.js";
import path from "path";
import {fileURLToPath} from "url";
import utils from "./utils.js";
import fse from "fs-extra";

const {logger, spawnProcess} = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cleanUp = () => {
  logger.info('Clean up dist')
  fse.removeSync(path.resolve(__dirname, `../dist`));
};
const moveNext = (versions) => {
  if(versions[0]==='next'){
    return [...versions.splice(1), 'next'];
  }
  return versions;
}

const buildVersion =  (version) => {
   logger.info(`Build `, version);
   
   spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/prebuild-${version.replace('.','-')}`, 
    { 
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_VERSION: version
      },
    }, 
     true
   );
   return version;
};
const concatenate = (version, index) =>{
  const prebuild = path.resolve(__dirname, '../../', `.vuepress/dist/prebuild-${version.replace('.', '-')}`)
  const dist = path.resolve(__dirname, '../../', `.vuepress/dist/docs${index === 0 ? '' : `/${version}` }`);
  
  logger.info("Apply built version to the `docs/`", version, dist)
  
  fse.moveSync(prebuild, dist)
}
const buildApp = async () => {
  logger.info(`Build started at`, new Date().toString())
  cleanUp();
    moveNext(getVersions()) // next shouldn't be at the first position.
    .map(buildVersion)
    .forEach(concatenate)
}

buildApp();
