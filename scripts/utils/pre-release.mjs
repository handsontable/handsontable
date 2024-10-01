import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';
import replace from 'replace-in-file';
import inquirer from 'inquirer';
import semver from 'semver';
import {
  displayErrorMessage,
  displayConfirmationMessage
} from './index.mjs';

import mainPackageJson from '../../package.json' with { type: 'json' };
import hotConfig from '../../hot.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const workspacePackages = mainPackageJson.workspaces;

/**
 * Current version of the monorepo (before updating).
 *
 * @type {string}
 */
export const CURRENT_VERSION = hotConfig.HOT_VERSION;

/**
 * Check if the provided version number is a valid semver version number.
 *
 * @param {string} version Version number.
 * @returns {boolean} `true` if the version number is a valid semver version number, `false` otherwise.
 */
export function isVersionValid(version) {
  return !!semver.valid(version);
}

/**
 * Check if the provided release date in a format of 'DD/MM/YYYY' is a valid future date.
 *
 * @param {string} date The date in format of 'DD/MM/YYYY'.
 * @returns {object} Object containing information about the release validity in a form of `{valid: boolean, error:
 * string}`.
 */
export function validateReleaseDate(date) {
  const dateObj = moment(date, 'DD/MM/YYYY', true);
  const now = moment();
  const returnObj = {
    valid: true,
    error: null
  };

  if (!dateObj.isValid()) {
    returnObj.valid = false;
    returnObj.error = 'The provided date is invalid.';

  } else if (!dateObj.isAfter(now)) {
    returnObj.valid = false;
    returnObj.error = 'The release date has to be a future date.';
  }

  return returnObj;
}

/**
 * Set the provided version number to the Handsontable's `package.json` and other packages' `dependency` fields.
 *
 * @param {string} version The version number.
 * @param {Array} [packages] Array of package paths. Defaults to the workspace config.
 */
export function setVersion(version, packages = workspacePackages) {
  // Set the new version number to hot.config.js.
  const hotConfigPath = path.resolve(__dirname, '../../hot.config.js');

  validateReplacementStatus(replace.sync({
    files: hotConfigPath,
    from: /HOT_VERSION: '(.*)'/,
    to: `HOT_VERSION: '${version}'`,
  }), version);

  // Set the new version number to all the packages.
  packages.forEach((packagesLocation) => {
    validateReplacementStatus(replace.sync({
      files: `${packagesLocation}${packagesLocation === '.' ? '' : '*'}/package.json`,
      from: [/"version": "(.*)"/, /"handsontable": "([^\d]*)((\d+)\.(\d+).(\d+)(.*))"/g],
      to: (fullMatch, ...[semverPrefix, previousVersion]) => {
        if (fullMatch.indexOf('version') > 0) {
          // Replace the version with the new version.
          return `"version": "${version}"`;

        } else {
          const isPreRelease = version.includes('-next-');
          const newVersion = isPreRelease ? version : `${semverPrefix}${semver.major(
            semver.maxSatisfying([version, previousVersion], '*')
          )}.0.0`;

          // Replace the `handsontable` dependency with the current major (or previous major, if it's a prerelease).
          return `"handsontable": "${newVersion}"`;
        }
      },
      ignore: [
        `${packagesLocation}*/node_modules/**/*`,
        `${packagesLocation}*/projects/hot-table/package.json`,
        `${packagesLocation}*/dist/hot-table/package.json`,
      ],
    }), version);
  });
}

/**
 * Set the provided release date in the `hot.config.js` file.
 *
 * @param {string} date The release date in a format of 'DD/MM/YYYY'.
 */
export function setReleaseDate(date) {
  const hotConfigPath = path.resolve(__dirname, '../../hot.config.js');
  const replacementStatus = replace.sync({
    files: hotConfigPath,
    from: /HOT_RELEASE_DATE: '(.*)'/,
    to: `HOT_RELEASE_DATE: '${date}'`,
  });

  validateReplacementStatus(replacementStatus, date);
}

/**
 * Get the new version from the provided release type (major/minor/patch).
 *
 * @param {string} type 'major'/'minor'/'patch'.
 * @param {string} currentVersion Current version string.
 * @returns {string} A new semver-based version.
 */
export function getVersionFromReleaseType(type, currentVersion) {
  return semver.inc(currentVersion, type);
}

/**
 * Schedule the release by setting the version number to the `package.json` files in all of the packages and release
 * date in the Handsontable config.
 *
 * @param {string} [version] Version number.
 * @param {string} [releaseDate] Release date in the `DD/MM/YYYY` format.
 * @returns {object}
 */
export async function scheduleRelease(version, releaseDate) {
  const currentVersion = hotConfig.HOT_VERSION;
  const questions = [
    {
      type: 'list',
      name: 'changeType',
      message: 'Select the type of the release.',
      choices: [
        'Major',
        'Minor',
        'Patch',
        'Custom',
      ],
      filter: value => value.toLowerCase(),
    },
    {
      type: 'input',
      name: 'customVersion',
      message: 'Enter the custom version number.',
      when: answers => answers.changeType === 'custom',
      validate: (value) => {
        if (isVersionValid(value)) {
          return true;
        }

        return 'The provided version is not a proper semver version number.';
      },
    },
    {
      type: 'input',
      name: 'releaseDate',
      message: 'Enter the release date in a form of DD/MM/YYYY.',
      validate: (value) => {
        const releaseDateValidity = validateReleaseDate(value);

        if (releaseDateValidity.valid) {
          return true;
        }

        return releaseDateValidity.error;
      },
    }
  ];
  const getConfirmationQuestion = (newVersion, formattedDate) => [
    {
      type: 'confirm',
      name: 'isReleaseDateConfirmed',
      message: `

* New version: ${newVersion}
* Release date: ${formattedDate}

Are the version number and release date above correct?`,
      default: true,
    },
  ];
  let finalVersion = null;
  let finalReleaseDate = null;

  // Version and release date were passed as arguments.
  if (version && releaseDate) {
    const semverBumpOptions = ['major', 'minor', 'patch'];
    const releaseDateValidity = validateReleaseDate(releaseDate);
    let newVersion = '';

    if (!releaseDateValidity.valid) {
      displayErrorMessage(releaseDateValidity.error);
      process.exit(1);
    }

    if (isVersionValid(version)) {
      newVersion = version;

    } else if (semverBumpOptions.includes(version)) {
      newVersion = semver.inc(currentVersion, version);

    } else {
      displayErrorMessage(
        `${version} is not a valid version number, nor a semver change type (major/minor/patch).`);
      process.exit(1);
    }

    if (!newVersion) {
      displayErrorMessage('Something went wrong while updating the version number with semver.');
      process.exit(1);
    }

    displayConfirmationMessage(
      `\nChanging the version number to ${newVersion}, to be released on ${releaseDate}. \n`
    );

    finalVersion = newVersion;
    finalReleaseDate = releaseDate;

    setVersion(newVersion, workspacePackages);
    setReleaseDate(releaseDate);

  } else {
    const answers = await inquirer.prompt(questions);
    const releaseDateObj = moment(answers.releaseDate, 'DD/MM/YYYY', true);
    const newVersion =
      answers.changeType !== 'custom' ?
        getVersionFromReleaseType(answers.changeType, currentVersion) :
        answers.customVersion;
    const confirmationAnswers = await inquirer.prompt(
      getConfirmationQuestion(newVersion, releaseDateObj.format('DD MMMM YYYY'))
    );

    if (confirmationAnswers.isReleaseDateConfirmed) {

      finalVersion = newVersion;
      finalReleaseDate = answers.releaseDate;

      setVersion(newVersion);
      setReleaseDate(answers.releaseDate);
    }
  }

  return {
    version: finalVersion,
    releaseDate: finalReleaseDate
  };
}

/**
 * Helper function validating the return status of `replace-in-file`'s `replace` method.
 *
 * @private
 * @param {Array} replacementStatus Replacement status array returned from `replace-in-file`'s `replace` method.
 * @param {string} replacedString The string replaced in the source file.
 */
function validateReplacementStatus(replacementStatus, replacedString) {
  let versionReplaced = true;

  replacementStatus.forEach((infoObj) => {
    const filePath = infoObj.file.replace('./', '');

    if (!infoObj.hasChanged) {
      displayErrorMessage(`${filePath} was not modified.`);
      versionReplaced = false;

    } else {
      displayConfirmationMessage(`- Saved '${replacedString}' to ${path.relative(process.cwd(), filePath)}.`);
    }
  });

  if (!versionReplaced) {
    process.exit(1);
  }
}
