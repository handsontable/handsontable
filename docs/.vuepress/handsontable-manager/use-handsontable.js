const { register } = require('./register');
const { buildDependencyGetter, presetMap } = require('./dependencies');

const ATTR_VERSION = 'data-hot-version';

const useHandsontable = (version, callback = () => {}, preset = 'hot') => {

  const getDependency = buildDependencyGetter(version);

  const loadDependency = dep => new Promise((resolve) => {
    const id = `dependency-reloader_${dep}`;
    const [jsUrl, dependentVars = [], cssUrl = undefined] = getDependency(dep);

    const _document = document; // eslint-disable-line no-restricted-globals
    let script = _document.getElementById(`script-${id}`);

    // clear outdated version
    if (script && script.getAttribute(ATTR_VERSION) !== version) {
      dependentVars.forEach(x => delete x.split('.').reduce((p, c) => p[c] || {}, {}));
      script.remove();
      script = null;
    }

    // clear outdated css
    const css = _document.getElementById(`css-${id}`);

    if (css && css.getAttribute(ATTR_VERSION) !== version) {
      css.remove();
    }

    // import current version
    if (!script) {
      script = _document.createElement('script');
      script.src = jsUrl;
      script.id = `script-${id}`;
      script.setAttribute(ATTR_VERSION, version);
      script.addEventListener('load', () => {
        script.loaded = true;
      });

      _document.head.appendChild(script);

      if (cssUrl) {
        _document.head.insertAdjacentHTML(
          'beforeend',
          `<link type="text/css" data-hot-version="${version}" rel="stylesheet" id="css-${id}" href="${cssUrl}"/>`
        );
      }
    }

    // execute callback
    if (script.loaded) {
      setTimeout(() => {
        register.listen();
        resolve();
      });
    } else {
      script.addEventListener('load', () => {
        register.listen();
        resolve();
      });
    }

  });

  const loadPreset = async() => {
    const dependencies = presetMap[preset];

    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];

      // The order of loading is really important. For that purpose await was used.
      await loadDependency(dep); // eslint-disable-line no-await-in-loop
    }
  };

  loadPreset().then(callback);
};

module.exports = { useHandsontable };
