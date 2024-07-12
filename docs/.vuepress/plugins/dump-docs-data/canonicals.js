const { logger } = require('@vuepress/shared-utils');

const buildMode = process.env.BUILD_MODE;
const BASE_DOCS_URL = `https://${buildMode === 'staging' ? '_docs_dev.' : ''}handsontable.com/docs`;

const fetchCommonHeaders = new Headers({
  'Accept': 'application/json', // eslint-disable-line quote-props
  'Content-Type': 'application/json',
  'User-Agent': 'HandsontableDocsBuilder'
});

logger.info(`Using "${BASE_DOCS_URL}/data/common.json" URL for fetching and building Docs data ` +
  '(fetch docs versions and build canonical URLs).');

/**
 * Generates a Map with canonical URLs using the following structure [/path url/, /latest docs version that has the url/].
 *
 * @param {object} currentCanonicals The canonical URLs parsed by this docs version.
 * @returns {Promise<Map<string, string>>}
 */
async function generateCommonCanonicalURLs(currentCanonicals) {
  const commonURLs = new Map();
  const response = await fetch(`${BASE_DOCS_URL}/data/common.json`, {
    headers: fetchCommonHeaders
  });
  const docsData = await response.json();
  const allDocsVersions = [...docsData.versions];
  const latestDocsVersion = currentCanonicals.v === 'next' ? 'next' : docsData.latestVersion;

  if (!allDocsVersions.includes(currentCanonicals.v)) {
    allDocsVersions.push(currentCanonicals.v);
  }

  for (let vIndex = 0; vIndex < allDocsVersions.length; vIndex++) {
    const docsVersion = allDocsVersions[vIndex];
    const docsVersionImplicit = docsVersion === latestDocsVersion ? '' : docsVersion;
    let canonicalsURLs;

    if (currentCanonicals.v === docsVersion) {
      canonicalsURLs = currentCanonicals.urls;
    } else {
      /* eslint-disable no-await-in-loop */
      const canonicalsResponse = await fetch(`${BASE_DOCS_URL}/${docsVersion}/data/canonicals-raw.json`, {
        headers: fetchCommonHeaders
      });

      canonicalsURLs = (await canonicalsResponse.json()).urls;
    }

    for (let urlIndex = 0; urlIndex < canonicalsURLs.length; urlIndex++) {
      const canonicalUrl = canonicalsURLs[urlIndex];

      if (commonURLs.has(canonicalUrl)) {
        const docsVersionFloat = castVersionToNumber(docsVersion);
        const lastSavedDocsVersionFloat = castVersionToNumber(commonURLs.get(canonicalUrl));

        if (docsVersionFloat > lastSavedDocsVersionFloat) {
          commonURLs.set(canonicalUrl, docsVersionImplicit);
        }

      } else {
        commonURLs.set(canonicalUrl, docsVersionImplicit);
      }
    }
  }

  return commonURLs;
}

/**
 * Casts the docs version passed as string to number (float type value).
 *
 * @param {string} docsVersion Docs version.
 * @returns {number}
 */
function castVersionToNumber(docsVersion) {
  return docsVersion === '' ? Infinity : parseFloat(docsVersion);
}

module.exports = {
  generateCommonCanonicalURLs,
};
