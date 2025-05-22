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
 * Reads the list of Docs version from the GitHub using the releases list.
 *
 * @returns {object}
 */
async function readFromGitHub() {
  const octokit = new Octokit();

  const releases = await octokit.rest.repos.listReleases({
    owner: 'handsontable',
    repo: 'handsontable',
    per_page: 50,
  });

  if (releases.status !== 200) {
    throw new Error('Incorrect response from the GitHub API.');
  }

  const tags = [];

  releases.data
    .map(item => item.tag_name)
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

