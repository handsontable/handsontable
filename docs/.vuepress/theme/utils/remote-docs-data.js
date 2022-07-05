let docsVersionsCache = null;

/**
 * Fetches the Docs data like all available docs versions or what is the docs latest version
 * from remote JSON file.
 *
 * @returns {object}
 */
export async function fetchDocsData() {
  if (docsVersionsCache === null) {
    // ..................↓ TEMP: Remove after releasing to prod
    const pathVersion = ['dev-pseudo-prod.handsontable.com', 'handsontable.com'].includes(window.location.host) ? '' : 'next/';
    const response = await fetch(`${window.location.origin}/docs/${pathVersion}docs-data.json`);

    docsVersionsCache = await response.json();
  }

  return docsVersionsCache;
}
