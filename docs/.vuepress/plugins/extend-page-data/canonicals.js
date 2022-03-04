const path = require('path');
const fs = require('fs');
const semver = require('semver');
const glob = require('glob');
const frontMatter = require('front-matter');
const { getLatestVersion } = require('../../helpers');

const BASE_URL = 'https://handsontable.com/docs';
const ROOT_DOCS_DIR = path.resolve(__dirname, '../../..');

const canonicalURLs = new Map();

/**
 * Collects all canonical urls and creates an internal map with pairs 'url path' => 'docs version'.
 */
function collectAllUrls() {
  glob.sync('@([0-9]*.[0-9]*|next)/**/*.md', {
    root: ROOT_DOCS_DIR,
  }).forEach((file) => {
    const docsVersion = file.match(/^(?<version>\d+\.\d+|next)/)?.groups?.version;
    const fullVersion = coerceVersion(docsVersion);
    const {
      canonicalUrl
    } = frontMatter(fs.readFileSync(path.resolve(ROOT_DOCS_DIR, file), 'utf-8')).attributes;

    if (canonicalURLs.has(canonicalUrl)) {
      const lastFullVersion = coerceVersion(canonicalURLs.get(canonicalUrl));

      if (fullVersion !== 'next' && semver.gt(fullVersion, lastFullVersion)) {
        canonicalURLs.set(canonicalUrl, docsVersion);
      }

    } else {
      canonicalURLs.set(canonicalUrl, docsVersion);
    }
  });
}

/**
 * Gets the full canonical URL (with protocol, domain, etc.). The function returns the URL to the
 * latest version of docs where the page exists.
 *
 * @param {string} canonicalUrl The canonical URL
 * @returns {string}
 */
function getCanonicalUrl(canonicalUrl) {
  const latestDocsVersionForCanonical = canonicalURLs.get(canonicalUrl);
  let url = canonicalUrl ?? '';

  if (getLatestVersion() !== latestDocsVersionForCanonical) {
    url = `/${latestDocsVersionForCanonical}${url}`;
  }

  return `${BASE_URL}${url}/`.replace(/\/+$/, '/');
}

/**
 * Coerces the docs version (e.g. 11.1) to full version compatible with SemVer (e.g. 11.1.0).
 *
 * @param {string} docsVersion Docs version.
 * @returns {string}
 */
function coerceVersion(docsVersion) {
  if (docsVersion !== 'next') {
    return semver.coerce(docsVersion).version;
  }

  return docsVersion;
}

module.exports = {
  collectAllUrls,
  getCanonicalUrl,
}
