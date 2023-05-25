const { register } = require('./register');
const {
  buildDependencyGetter,
  presetMap,
} = require('./dependencies');

const ATTR_VERSION = 'data-hot-version';

const useHandsontable = (version, callback = () => {}, preset = 'hot', buildMode = 'production') => {
  const getDependency = buildDependencyGetter(version, buildMode);

  const loadDependency = dep => new Promise((resolve) => {
    const getId = depName => `dependency-reloader_${depName}`;
    const [jsUrl, dependentVars = [], cssUrl = undefined, globalVarSharedDependency] = getDependency(dep);
    const id = getId(dep);

    const _document = document; // eslint-disable-line no-restricted-globals
    let script = null;

    // As the documentation uses multiple versions of Vue (which reuse the same global variable - `Vue`), every
    // time the Vue dependency is loaded, the previously used version should be removed.
    if (globalVarSharedDependency) {
      script = _document.getElementById(`script-${getId(globalVarSharedDependency)}`);

    } else {
      script = _document.getElementById(`script-${id}`);
    }

    // clear outdated version
    if (script && (script.getAttribute(ATTR_VERSION) !== version || globalVarSharedDependency)) {
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
