const fs = require('fs');
const path = require('path');
const semver = require('semver');

const unsortedVersions = fs.readdirSync(path.join(__dirname, '..'))
  .filter(f => semver.valid(semver.coerce(f)));

const availableVersions = unsortedVersions.sort((a, b) => semver.rcompare(semver.coerce(a), semver.coerce((b))));

/**
 * Gets all available docs versions.
 *
 * @param {string} buildMode The env name.
 * @returns {string[]}
 */
function getVersions(buildMode) {
  const next = buildMode !== 'production' ? ['next'] : [];

  return [...next, ...availableVersions];
}

/**
 * Gets all available frameworks.
 *
 * @returns {string[]}
 */
function getFrameworks() {
  return ['javascript', 'react'];
}

/**
 * Gets default framework.
 *
 * @returns {string}
 */
function getDefaultFramework() {
  return 'javascript';
}

/**
 * Gets the latest version of docs.
 *
 * @returns {string}
 */
function getLatestVersion() {
  return availableVersions[0];
}

/**
 * Gets the sidebar object for docs.
 *
 * @param {string} buildMode The env name.
 * @returns {object}
 */
function getSidebars(buildMode) {
  const sidebars = { };
  const versions = getVersions(buildMode);

  versions.forEach((version) => {
    // eslint-disable-next-line
    const s = require(path.join(__dirname, `../${version}/sidebars.js`));

    sidebars[`/${version}/examples/`] = s.examples;
    sidebars[`/${version}/api/`] = s.api;
    sidebars[`/${version}/`] = s.guides;
  });

  return sidebars;
}

/**
 * Parses the docs version from the URL.
 *
 * @param {string} url The URL to parse.
 * @returns {string}
 */
function parseVersion(url) {
  return url.split('/')[3] || getLatestVersion();
}

/**
 * Parses the docs framework from the URL.
 *
 * @param {string} url The URL to parse.
 * @returns {string}
 */
function parseFramework(url) {
  return url.split('/')[2] || getDefaultFramework();
}

/**
 * Gets docs version that is currently building (based on the environment variable).
 *
 * @returns {string}
 */
function getBuildDocsVersion() {
  return process.env.DOCS_VERSION;
}

/**
 * Gets docs framework that is currently building (based on the environment variable).
 *
 * @returns {string}
 */
function getBuildDocsFramework() {
  return process.env.FRAMEWORK;
}

module.exports = {
  getVersions,
  getFrameworks,
  getLatestVersion,
  getSidebars,
  parseVersion,
  parseFramework,
  getBuildDocsFramework,
  getBuildDocsVersion,
  getDefaultFramework,
};
