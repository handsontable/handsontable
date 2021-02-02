import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import moment from 'moment';
import replace from 'replace-in-file';
import inquirer from 'inquirer';
import semver from 'semver';
import {
  displayErrorMessage,
  displayConfirmationMessage
} from './index.mjs';
import JSDOMGlobal from 'jsdom-global';
import chalk from 'chalk';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Using `require` exclusively to import `json` files. Prevents 'experimental' warnings from being thrown in the
// console.
const require = createRequire(import.meta.url);
const hotPackageJson = require('../../package.json');
const workspacePackages = hotPackageJson.workspaces.packages;

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
  const dateObj = moment(date, 'DD/MM/YYYY');
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
 * Set the provided version number to the packages' package.json files.
 *
 * @param {string} version The version number.
 * @param {Array} [packages] Array of package paths. Defaults to the workspace config.
 */
export function setVersion(version, packages = workspacePackages) {
  let versionReplaced = true;

  packages.forEach((packagesLocation) => {
    const replacementStatus = replace.sync({
      files: `${packagesLocation}${packagesLocation === '.' ? '' : '*'}/package.json`,
      from: [/"version": "(.*)"/, /"handsontable": "([^\d]*)((\d+)\.(\d+).(\d+)(.*))"/g],
      to: (fullMatch, ...args) => {
        if (fullMatch.indexOf('version') > 0) {
          // Replace the version with the new version.
          return `"version": "${version}"`;

        } else {
          // Replace the `handsontable` dependency with the current major.
          return `"handsontable": "${args[0]}${semver.major(version)}.0.0"`;
        }
      },
      ignore: [
        `${packagesLocation}*/node_modules/**/*`,
        `${packagesLocation}*/projects/hot-table/package.json`,
        `${packagesLocation}*/dist/hot-table/package.json`,
      ],
    });

    replacementStatus.forEach((infoObj) => {
      const filePath = infoObj.file.replace('./', '');

      if (!infoObj.hasChanged) {
        displayErrorMessage(`${filePath} was not modified.`);
        versionReplaced = false;

      } else {
        displayConfirmationMessage(`- Saved the new version (${version}) to ${filePath}.`);
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
export function setReleaseDate(date) {
  const hotConfigPath = path.resolve(__dirname, '../../hot.config.js');
  const replacementStatus = replace.sync({
    files: hotConfigPath,
    from: /HOT_RELEASE_DATE: '(.*)'/,
    to: `HOT_RELEASE_DATE: '${date}'`,
  });

  if (!replacementStatus[0].hasChanged) {
    displayErrorMessage(`${replacementStatus[0].file} was not modified.`);
    process.exit(1);

  } else {
    const rootPath = `${path.resolve(__dirname, '../../..')}/`;

    displayConfirmationMessage(
      `- Saved the new date (${date}) to ${replacementStatus[0].file.replace(rootPath, '')}.`
    );
  }
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
 */
export async function scheduleRelease(version, releaseDate) {
  const currentVersion = hotPackageJson.version;
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
        // if (isVersionValid(value)) {
        if (!!semver.valid(value)) {
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
      displayErrorMessage(`Something went wrong while updating the version number with semver.`);
      process.exit(1);
    }

    displayConfirmationMessage(
      `\nChanging the version number to ${newVersion}, to be released on ${releaseDate}. \n`
    );

    setVersion(newVersion, workspacePackages);
    setReleaseDate(releaseDate);

  } else {
    await inquirer.prompt(questions).then(async (answers) => {
      const releaseDateObj = moment(answers.releaseDate, 'DD/MM/YYYY');

      const newVersion =
        answers.changeType !== 'custom' ?
          getVersionFromReleaseType(answers.changeType, currentVersion) :
          answers.customVersion;

      await inquirer.prompt(
        getConfirmationQuestion(newVersion, releaseDateObj.format('DD MMMM YYYY'))
      ).then((confirmationAnswers) => {
        if (confirmationAnswers.isReleaseDateConfirmed) {
          setVersion(newVersion);
          setReleaseDate(answers.releaseDate);
        }
      });
    });
  }
}

/**
 * Verify if the builds of all of the packages defined as workspaces have correct version number in them.
 * Currently it's checking the following builds:
 * - the one declared as default,
 * - UMD (if it's declared under the 'jsdelivr' key in the package.json file or a `umd` key in this function's
 * settings).
 */
export async function verifyBundles() {
  const packagesInfo = {
    handsontable: {
      className: 'Handsontable',
      umd: 'tmp/dist/handsontable.full.min.js',
      entryFile: 'tmp/index.mjs',
      defaultExport: true
    },
    '@handsontable/angular': {
      className: 'HotTableModule'
    },
    '@handsontable/react': {
      className: 'HotTable'
    },
    '@handsontable/vue': {
      className: 'HotTable'
    }
  };
  const hotPackageJson = require('../../package.json');
  const mismatchedVersions = [];
  JSDOMGlobal();

  console.log(`\nMain package.json version:\n${chalk.green(hotPackageJson.version)}\n`);

  for (const packagesLocation of workspacePackages) {
    const subdirs = glob.sync(packagesLocation);

    for (const subdir of subdirs) {
      const packageJsonLocation = `../../${subdir}/package.json`;
      const packageJson = require(packageJsonLocation);
      const packageName = packageJson.name;
      const defaultPackage = await import(
        packagesInfo[packageName].entryFile ?
          `../../${subdir}/${packagesInfo[packageName].entryFile}` :
          packageName
        );
      let defaultPackageVersion = null;
      let umdPackageVersion = null;
      let umdPackage = null;

      if (packagesInfo[packageName].umd || packageJson.jsdelivr) {
        umdPackage = await import(
          packagesInfo[packageName].entryFile ?
            `../../${subdir}/${packagesInfo[packageName].umd}` :
            `${packageName}/${packageJson.jsdelivr}`
          );
        umdPackage = umdPackage.default;
      }

      if (packagesInfo[packageName]?.defaultExport) {
        defaultPackageVersion = defaultPackage.default.version;

      } else {
        defaultPackageVersion = defaultPackage[packagesInfo[packageName]?.className]?.version;

        if (umdPackage) {
          umdPackageVersion = umdPackage[packagesInfo[packageName]?.className]?.version;
        }
      }

      if (hotPackageJson.version !== defaultPackageVersion) {
        mismatchedVersions.push(`${packageName} (default) - ${defaultPackageVersion}`);
      }

      if (umdPackageVersion && (hotPackageJson.version !== umdPackageVersion)) {
        mismatchedVersions.push(`${packageName} (UMD) - ${umdPackageVersion}`);
      }
    }
  }

  if (mismatchedVersions.length > 0) {
    mismatchedVersions.forEach((mismatch) => {
      displayErrorMessage(`\nMismatched versions in ${mismatch}.`);
    });

    process.exit(1);

  } else {
    displayConfirmationMessage('\nAll packages have the expected version number.\n');

    process.exit(0);
  }
}
