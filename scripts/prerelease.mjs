"use strict";

const PACKAGE_NAME = "tmp-hot";
const FILE_NAME = "package.json";
const PRERELEASE_TEMP_FOLDER = "handsontable/tmp";

import fs from "fs-extra";
import crypto from "crypto";
import util from "util";
import child_process from "child_process";
const exec = util.promisify(child_process.exec);

const dataFromFile = JSON.parse(
  fs.readFileSync(`${PRERELEASE_TEMP_FOLDER}/${FILE_NAME}`)
);
const originalVersionNumber = dataFromFile.version;

const hash = crypto
  .createHash("shake256", { outputLength: 4 })
  .update(originalVersionNumber, "utf8")
  .digest("hex");

dataFromFile.version = `${originalVersionNumber}-dev.${hash}-${Math.random()}`;
dataFromFile.name = PACKAGE_NAME;

// fs.copy('.', `../${PRERELEASE_TEMP_FOLDER}`).then(() => {
fs.writeFileSync(
  `${PRERELEASE_TEMP_FOLDER}/${FILE_NAME}`,
  JSON.stringify(dataFromFile, null, 2)
);

process.chdir(`${PRERELEASE_TEMP_FOLDER}`);

exec("npm publish").then(
  () => {
    //process.chdir(`../`);
    //fs.rm(PRERELEASE_TEMP_FOLDER, { recursive: true }).then(() => {});
  },
  (error) => {
    //process.chdir(`../`);
    //fs.rm(PRERELEASE_TEMP_FOLDER, { recursive: true }).then(() => {});
    throw new Error(error);
  }
);
// });
