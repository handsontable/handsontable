let docsVersionsCache = null;

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
