let docsVersionsCache = null;

/**
 * Fetches the Docs data like all available docs versions or what is the docs latest version
 * from remote JSON file.
 *
 * @param {object} params The params object.
 * @param {string} params.buildMode The Docs build mode.
 * @param {string} params.currentVersion The current docs build version.
 * @returns {object}
 */
export async function fetchDocsData({ buildMode, currentVersion }) {
  if (docsVersionsCache === null) {
    const pathVersion = buildMode === 'production' ? '' : `${currentVersion}/`;
    const response = await fetch(`${window.location.origin}/docs/${pathVersion}docs-data.json`);

    docsVersionsCache = await response.json();

    if (buildMode !== 'production') {
      docsVersionsCache.versions.unshift('next');
    }
  }

  return docsVersionsCache;
}
