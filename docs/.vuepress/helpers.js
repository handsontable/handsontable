const path = require('path');
const execa = require('execa');

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
  getThisDocsVersion,
  getSidebars,
  getDocsBaseUrl,
};
