let docsVersionsCache = null;

/**
 * Fetches the Docs data like all available docs versions or what is the docs latest version
 * from remote JSON file.
 *
 * @param {string} buildMode The Docs build mode.
 * @returns {object}
 */
export async function fetchDocsData(buildMode) {
  if (docsVersionsCache === null) {
    const response = await fetch(`${window.location.origin}/docs/docs-data.json`);

    docsVersionsCache = await response.json();

    if (buildMode !== 'production') {
      docsVersionsCache.versions.unshift('next');
    }
  }

  return docsVersionsCache;
}
