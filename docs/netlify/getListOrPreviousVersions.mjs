import { Octokit } from '@octokit/rest';
import semver from 'semver';

/** You might think this violates DRY principle with docs/.vuepress/plugins/dump-docs-data/docs-versions.js but
 * DRY applies when you're repeating the same concept (visual or otherwise), not when you're repeating the same code.
 */

/**
 * Min docs version that is used for creating canonicals.
 */
const MIN_DOCS_VERSION = '9.0';

/**
 * Number of times the releases request is retried before giving up.
 */
const MAX_ATTEMPTS = 5;

/**
 * Fetches the releases list, retrying on transient network failures.
 *
 * Unauthenticated requests from CI runner IP addresses are throttled and the connection is often cut
 * mid-response ("Premature close"). Passing a token (when available) lifts the rate limit, and the
 * retry loop covers the remaining transient failures.
 *
 * @param {Octokit} octokit The Octokit client.
 * @returns {Promise<object>}
 */
async function fetchReleases(octokit) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await octokit.rest.repos.listReleases({
        owner: 'handsontable',
        repo: 'handsontable',
        per_page: 50,
      });
    } catch (error) {
      lastError = error;

      // eslint-disable-next-line no-console
      console.error(`Attempt ${attempt}/${MAX_ATTEMPTS} to fetch releases failed: ${error.message}`);

      if (attempt < MAX_ATTEMPTS) {
        const delay = 2 ** attempt * 1000;

        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
  }

  throw lastError;
}

/**
 * Reads the list of Docs version from the GitHub using the releases list.
 *
 * @returns {object}
 */
async function readFromGitHub() {
  // `@octokit/rest@18` ships `node-fetch@2`, whose body stream throws "Premature close" on the large,
  // gzip-compressed releases response under Node 18+ (the CI runner uses Node 22). Injecting the
  // platform's native `fetch` (undici) avoids the broken node-fetch path. `GITHUB_TOKEN` is optional -
  // it lifts the unauthenticated rate limit when present; the call still works locally without it.
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    request: { fetch: globalThis.fetch },
  });

  const releases = await fetchReleases(octokit);

  if (releases.status !== 200) {
    throw new Error('Incorrect response from the GitHub API.');
  }

  const tags = [];

  releases.data
    .map(item => item.tag_name)
    .filter(tag => !semver.prerelease(tag))
    .sort((a, b) => semver.rcompare(a, b))
    .forEach((tag) => {
      const minorVersion = `${semver.parse(tag).major}.${
        semver.parse(tag).minor
      }`;

      if (!tags.includes(minorVersion)) {
        tags.push(minorVersion);
      }
    });

  const versions = tags.slice(0, tags.indexOf(MIN_DOCS_VERSION) + 1);
  const latestVersion = versions.shift();

  return {

    previousVersions: versions, // Please keep in mind that we have more version than displayed for purpose of creating canonicals.
    latestVersion
  };
}
const versions = await readFromGitHub();

// eslint-disable-next-line no-console
console.log(`PREVIOUS_VERSIONS="${versions.previousVersions.join(' ')}"
LATEST_VERSION="${versions.latestVersion}"`);

