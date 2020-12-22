const path = require('path');
const replace = require('replace-in-file');
const moment = require('moment');
const {
  displayConfirmationMessage,
  displayErrorMessage
} = require('./common');
const hotPackageJson = require('../package.json');

const CURRENT_VERSION = hotPackageJson.version;
const SEMVER_SECTIONS = ['major', 'minor', 'patch'];

/**
 * Check if the provided version number is a valid semver version number.
 *
 * @param {string} version Version number.
 * @returns {boolean} `true` if the version number is a valid semver version number, `false` otherwise.
 */
function isVersionValid(version) {
  const semverRegex = new RegExp(
    '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)' +
    '(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$'
  );

  return semverRegex.test(version);
}

/**
 * Check if the provided release date in a format of 'DD/MM/YYYY' is a valid future date.
 *
 * @param {string} date The date in format of 'DD/MM/YYYY'.
 * @returns {boolean} `true` if the release date is valid, `false` otherwise.
 */
function isReleaseDateValid(date) {
  const dateSplit = date.split('/');
  const now = moment();
  const dateObj = moment({
    day: dateSplit[0],
    month: dateSplit[1] - 1,
    year: dateSplit[2],
  });

  return dateObj.isAfter(now);
}

/**
 * Set the provided version number to the packages' package.json files.
 *
 * @param {string} version The version number.
 */
function setVersion(version) {
  const workspaces = hotPackageJson.workspaces.packages;

  let versionReplaced = true;
  workspaces.forEach((packagesLocation) => {
    const replacementStatus = replace.sync({
      files: `${packagesLocation}${packagesLocation === '.' ? '' : '*'}/package.json`,
      from: [/"version": "(.*)"/, /"handsontable": "([^\d]*)((\d+)\.(\d+).(\d+)(.*))"/g],
      to: (fullMatch, ...args) => {
        if (fullMatch.indexOf('version') > 0) {
          // Replace the version with the new version.
          return `"version": "${version}"`;

        } else {
          // Replace the `handsontable` dependency with the current major.
          return `"handsontable": "${args[0]}${version.split('.')[0]}.0.0"`;
        }
      },
      ignore: [
        `${packagesLocation}*/node_modules/**/*`,
        `${packagesLocation}*/projects/hot-table/package.json`,
        `${packagesLocation}*/dist/hot-table/package.json`,
      ],
    });

    replacementStatus.forEach((infoObj) => {
      if (!infoObj.hasChanged) {
        displayErrorMessage(`${infoObj.file} was not modified.`);
        versionReplaced = false;

      } else {
        displayConfirmationMessage(`- Saved the new version (${version}) to ${infoObj.file}.`);
      }
    });
  });

  if (!versionReplaced) {
    process.exit(1);
  }
}

/**
 * Set the provided release date in the `hot.config.js` file.
 *
 * @param {string} date The release date in a format of 'DD/MM/YYYY'.
 */
function setReleaseDate(date) {
  const replacementStatus = replace.sync({
    files: path.join(__dirname, '../hot.config.js'),
    from: /HOT_RELEASE_DATE: '(.*)'/,
    to: `HOT_RELEASE_DATE: '${date}'`,
  });

  if (!replacementStatus[0].hasChanged) {
    displayErrorMessage(`${replacementStatus[0].file} was not modified.`);
    process.exit(1);

  } else {
    displayConfirmationMessage(`- Saved the new date (${date}) to ${replacementStatus[0].file}.`);
  }
}

/**
 * Get the new version from the provided release type (major/minor/patch).
 *
 * @param {string} type 'major'/'minor'/'patch'.
 * @returns {string} A new semver-based version.
 */
function getVersionFromReleaseType(type) {
  const splitVersion = CURRENT_VERSION.split('.').map(
    value => parseInt(value, 10)
  );

  splitVersion[SEMVER_SECTIONS.indexOf(type)] += 1;

  return splitVersion.join('.');
}

const [/* node bin */, /* path to this script */, versionPrompt, releaseDate] = process.argv;
let newVersion = '';

if (versionPrompt && releaseDate) {
  if (!isReleaseDateValid(releaseDate)) {
    displayErrorMessage(
      `${releaseDate} is not a valid release date`);
    process.exit(1);
  }

  if (isVersionValid(versionPrompt)) {
    newVersion = versionPrompt;

  } else if (SEMVER_SECTIONS.includes(versionPrompt)) {
    newVersion = getVersionFromReleaseType(versionPrompt);

  } else {
    displayErrorMessage(
      `${versionPrompt} is not a valid version number, nor a semver change type (major/minor/patch).`);
    process.exit(1);
  }

  console.log(`\nChanging the version number to ${newVersion}, to be released on ${releaseDate}. \n`);

  setVersion(newVersion);
  setReleaseDate(releaseDate);
}

module.exports = {
  isVersionValid,
  isReleaseDateValid,
  setVersion,
  setReleaseDate,
  getVersionFromReleaseType,
};
