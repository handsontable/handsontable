const path = require('path');
const semver = require('semver');

// TODO: fetch release versions list from GH API
const unsortedVersions = ['9.0', '10.0', '11.0', '11.1', '12.0'];
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
 * Gets the latest version of docs.
 *
 * @returns {string}
 */
function getLatestVersion() {
  return availableVersions[0];
}

/**
 * Checks if this documentation build points to the latest available version of the documentation.
 *
 * @returns {boolean}
 */
function isThisDocsTheLatestVersion() {
  return getLatestVersion() === getThisDocsVersion();
}

/**
 * Gets the current (this) version of docs.
 *
 * @returns {string}
 */
function getThisDocsVersion() {
  // TODO: fetch the version from the branch name?
  return '9.0';
}

/**
 * Gets the sidebar object for docs.
 *
 * @returns {object}
 */
function getSidebars() {
  const sidebars = { };

  // eslint-disable-next-line
  const s = require(path.join(__dirname, '../content/sidebars.js'));

  sidebars['/content/examples/'] = s.examples;
  sidebars['/content/api/'] = s.api;
  sidebars['/content/'] = s.guides;

  return sidebars;
}

/**
 * Gets docs base url (eq: https://handsontable.com).
 *
 * @returns {string}
 */
function getDocsBaseUrl() {
  return `https://${process.env.BUILD_MODE === 'staging' ? 'dev.' : ''}handsontable.com`;
}

module.exports = {
  getVersions,
  getLatestVersion,
  isThisDocsTheLatestVersion,
  getThisDocsVersion,
  getSidebars,
  getDocsBaseUrl,
};
