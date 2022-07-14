/**
 * The script reads from the remote API list of the available Docs versions. Depending on
 * which environment the Docs is built, the list is fetched from the pre-generated JSON
 * file from the https://handsontable.com/docs/docs-data.json (for local builds, watch)
 * or from the GitHub API when the production Docs image is created.
 */
const semver = require('semver');
const { Octokit } = require('@octokit/rest');
const { logger } = require('@vuepress/shared-utils');

/**
 * Min Docs version that is listed in the Docs version dropdown menu.
 */
const MIN_DOCS_VERSION = '9.0';

/**
 * Reads the list of Docs versions from the latest Docs image.
 *
 * @returns {object}
 */
async function readFromDocsLatest() {
  const response = await fetch('https://handsontable.com/docs/docs-data.json');
  const data = await response.json();

  return data;
}

/**
 * Reads the list of Docs version from the GitHub using the releases list.
 *
 * @returns {object}
 */
async function readFromGitHub() {
  const octokit = new Octokit();
  let versions = [];

  const releases = await octokit.rest.repos
    .listReleases({
      owner: 'handsontable',
      repo: 'handsontable',
      per_page: 50,
    });

  if (releases.status !== 200) {
    throw new Error('Incorrect response from the GitHub API.');
  }

  const tagsSet = new Set();

  releases.data
    .map(item => item.tag_name)
    .sort((a, b) => semver.rcompare(a, b))
    .forEach(tag => tagsSet.add(`${semver.parse(tag).major}.${semver.parse(tag).minor}`));

  const tags = Array.from(tagsSet);

  versions = tags.slice(0, tags.indexOf(MIN_DOCS_VERSION) + 1);

  logger.info(`Fetched the following Docs versions: ${versions.join(', ')}`);
  logger.info(`GitHub API rate limits:
  Limit: ${releases.headers['x-ratelimit-limit']}
  Used: ${releases.headers['x-ratelimit-used']}
  Remaining: ${releases.headers['x-ratelimit-remaining']}
  `);

  return {
    versions,
    latestVersion: versions[0]
  };
}

/**
 * Fetches Docs all available versions and latest Docs version from the GitHub API or latest Docs.
 *
 * @returns {object}
 */
async function fetchDocsVersions() {
  let docsData = null;

  // for building use always the GH API
  if (process.env.DOCS_BASE && process.env.DOCS_BASE !== 'latest') {
    docsData = await readFromGitHub();
  } else {
    // for local development use the latest Docs image...
    try {
      docsData = await readFromDocsLatest();
    } catch { // ...or GH API as fallback
      docsData = await readFromGitHub();
    }
  }

  if (process.env.BUILD_MODE !== 'production') {
    docsData.versions = ['next', ...docsData.versions];
  }

  return docsData;
}

module.exports = {
  fetchDocsVersions,
};
