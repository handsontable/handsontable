/**
 * The script reads from the remote API list of the available Docs versions. Depending on
 * which environment the Docs is built, the list is fetched from the pre-generated JSON
 * file from the https://handsontable.com/docs/data/common.json(for local builds, watch)
 * or from the GitHub API when the production Docs image is created.
 */
const semver = require('semver');
const { Octokit } = require('@octokit/rest');
const { logger } = require('@vuepress/shared-utils');

/**
 * Min docs version that is used for creating canonicals.
 */
const MIN_DOCS_VERSION = '9.0';
/**
 * Max number of minors displayed in the drop-down.
 */
const MAX_MINORS_COUNT = 6;

/**
 * Reads the list of Docs versions from the latest Docs image.
 *
 * @returns {object}
 */
async function readFromDocsLatest() {
  const response = await fetch('https://handsontable.com/docs/data/common.json');
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
  const minorsToPatches = new Map();

  releases.data
    .map(item => item.tag_name)
    .sort((a, b) => semver.rcompare(a, b))
    .forEach((tag) => {
      const minorVersion = `${semver.parse(tag).major}.${semver.parse(tag).minor}`;
      const patchVersion = `${minorVersion}.${semver.parse(tag).patch}`;

      tagsSet.add(minorVersion);

      if (minorsToPatches.has(minorVersion)) {
        const uniquePatches = Array.from(new Set(minorsToPatches.get(minorVersion)).add(patchVersion));

        minorsToPatches.set(minorVersion, uniquePatches);

      } else {
        minorsToPatches.set(minorVersion, [patchVersion]);
      }
    });

  const tags = Array.from(tagsSet);
  const versions = tags.slice(0, tags.indexOf(MIN_DOCS_VERSION) + 1);
  // Converting the map, as it's later changed to JSON.
  const versionsWithPatches = Array.from(minorsToPatches).slice(0, MAX_MINORS_COUNT);

  logger.info(`Fetched the following Docs versions: ${versions.join(', ')}`);
  logger.info(`GitHub API rate limits:
  Limit: ${releases.headers['x-ratelimit-limit']}
  Used: ${releases.headers['x-ratelimit-used']}
  Remaining: ${releases.headers['x-ratelimit-remaining']}
  `);

  return {
    versions, // Please keep in mind that we have more version than displayed for purpose of creating canonicals.
    latestVersion: versions[0],
    versionsWithPatches,
  };
}

/**
 * Fetches Docs all available versions and latest Docs version from the GitHub API or latest Docs.
 *
 * @returns {object}
 */
async function fetchDocsVersions() {
  let docsData = null;

  // for building use always the GH API (the fresh data)
  if (process.env.DOCS_BASE) {
    docsData = await readFromGitHub();
  } else {
    // for local development use the latest Docs image...
    try {
      docsData = await readFromDocsLatest();
    } catch { // ...or GH API as fallback
      logger.warn('The remote JSON file with Docs versions is inaccessible (https://handsontable.com). ' +
                  'Switching to GH API.');
      docsData = await readFromGitHub();
    }
  }

  if (process.env.BUILD_MODE !== 'production') {
    docsData.versions = ['next', ...docsData.versions];
    docsData.versionsWithPatches = [['next', []], ...docsData.versionsWithPatches];
    docsData.latestVersion = 'next';
  }

  return docsData;
}

module.exports = {
  fetchDocsVersions,
};
