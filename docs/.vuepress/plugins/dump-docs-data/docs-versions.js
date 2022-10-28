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
 * Reads the list of Docs versions from the latest Docs image.
 *
 * @returns {object}
 */
async function readFromDocsLatest() {
  const response = await fetch('https://handsontable.com/docs/data/common.json');
  const data = await response.json();

  // TODO: Mocked.
  data.patches = [
    ['12.2', ['12.2.0']],
    ['12.1', ['12.1.3', '12.1.2', '12.1.1', '12.1.0']],
    ['12.0', ['12.0.1', '12.0.0']],
    ['11.1', ['11.1.0']],
    ['11.0', ['11.0.1', '11.0.0']],
    ['10.0', ['10.0.0']],
    ['9.0', ['9.0.2', '9.0.1', '9.0.0']]
  ];

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
        const uniquePathes = Array.from(new Set(minorsToPatches.get(minorVersion)).add(patchVersion));

        minorsToPatches.set(minorVersion, uniquePathes);

      } else {
        minorsToPatches.set(minorVersion, [patchVersion]);
      }
    });

  const versions = Array.from(tagsSet).slice(0, 6);
  const patches = Array.from(minorsToPatches); // Converting the map, as it's later changed to JSON.

  logger.info(`Fetched the following Docs versions: ${versions.join(', ')}`);
  logger.info(`GitHub API rate limits:
  Limit: ${releases.headers['x-ratelimit-limit']}
  Used: ${releases.headers['x-ratelimit-used']}
  Remaining: ${releases.headers['x-ratelimit-remaining']}
  `);

  return {
    versions,
    latestVersion: versions[0],
    patches,
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
    docsData.latestVersion = 'next';
  }

  return docsData;
}

module.exports = {
  fetchDocsVersions,
};
