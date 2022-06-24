const path = require('path');
const execa = require('execa');

// TODO: fetch release versions list from GH API or so
const availableVersions = ['12.1', '12.0', '11.1', '11.0', '10.0', '9.0'];

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
  return false;
}

const versionFromBranchRegExp = /^docs-snapshot\/(\d+\.\d+)$/;

/**
 * Gets the current (this) version of docs.
 *
 * @returns {string}
 */
function getThisDocsVersion() {
  const branchName = execa.sync('git rev-parse --abbrev-ref HEAD', { shell: true }).stdout;

  if (versionFromBranchRegExp.test(branchName)) {
    return branchName.match(versionFromBranchRegExp)[1];
  }

  return 'next';
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
