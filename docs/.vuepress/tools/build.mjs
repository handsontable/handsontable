import {getVersions} from "../helpers.js";
import path from "path";
import {fileURLToPath} from "url";
import utils from "./utils.js";
import fse from "fs-extra";

const {logger, spawnProcess} = utils;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cleanUp = () => {
  fse.removeSync(path.resolve(__dirname, `../dist`));
};
const moveNext = (versions) => {
  if(versions[0]==='next'){
    return [...versions.splice(1), 'next'];
  }
  return versions;
}
const buildVersion =  (version) => {
  logger.log(`* Build ${version}`);
   spawnProcess(
    `node_modules/.bin/vuepress build -d .vuepress/dist/prebuild-${version.replace('.','-')}`, 
    { 
      cwd: path.resolve(__dirname, '../../'),
      env: {
        DOCS_VERSION: version
      },
    }, 
     true
   )
};
const buildApp = async () => {
  logger.info(`Build started at ${new Date().toString()}`)
  logger.log('Clean up dist:')
  cleanUp();
  logger.log('Build versions:')
    moveNext(getVersions()) // next shouldn't be at the first position.
    .map(buildVersion)
    // .forEach(concatenateDist)
}

buildApp();
