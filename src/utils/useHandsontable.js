const mapVersion = (version) => (version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest');

/**
 * @param version {string}
 * @returns {[string, string]} [script, style]
 */
export const getHotUrls = (version) => {
  const mappedVersion = mapVersion(version);

  return [
    // todo, localhost url for version `next`
    `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
    `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
  ];
};

// todo consider about refactoring
export const useHandsontable = (version, callback, id = 'hot-script') => {
  let hotScript = document.getElementById(id);

  // clear outdated version
  if (hotScript && hotScript.data['hot-version'] !== version) {
    delete window.Handsontable;
    hotScript.remove();
    hotScript = null;
  }

  // import current version
  if (!hotScript) {
    /* eslint-disable-next-line no-unused-vars */
    const [scriptUrl, styleUrl] = getHotUrls(version);

    hotScript = document.createElement('script');
    hotScript.src = scriptUrl;
    hotScript.id = id;
    hotScript.data = { 'hot-version': version };
    hotScript.addEventListener('load', () => { hotScript.loaded = true; });

    document.head.append(hotScript);
    document.head.insertAdjacentHTML('beforeend', `<link type="text/css" rel="stylesheet" href="${styleUrl}"/>`);
  }

  // execute callback
  if (hotScript.loaded) {
    callback();
  } else {
    hotScript.addEventListener('load', () => { callback(); });
  }
};
