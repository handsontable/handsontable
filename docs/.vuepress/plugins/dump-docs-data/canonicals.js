const BASE_URL = 'https://dev-pseudo-prod.handsontable.com'; // tmp for testing

/**
 * Generates a Map with canonical URLs using the following structure [/path url/, /latest docs version that has the url/].
 *
 * @param {object} currentCanonicals The canonical URLs parsed by this docs version.
 * @returns {Map<string, string>}
 */
async function generateCommonCanonicalURLs(currentCanonicals) {
  const commonURLs = new Map();
  const response = await fetch(`${BASE_URL}/docs/data/common.json`);
  const docsData = await response.json();
  const allDocsVersions = [...docsData.versions];
  const latestDocsVersion = docsData.latestVersion;

  if (!allDocsVersions.includes(currentCanonicals.v) && currentCanonicals.v !== 'next') {
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
      const canonicalsResponse = await fetch(`${BASE_URL}/docs/${docsVersion}/data/canonicals-raw.json`);

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
