const { register } = require('./register');
const { themeManager } = require('./theme-manager');
const {
  buildDependencyGetter,
  presetMap,
} = require('./dependencies');

const ATTR_VERSION = 'data-hot-version';

class AbortError extends Error {}

const useHandsontable = (version, callback = () => {}, preset = 'hot', buildMode = 'production') => {
  const getDependency = buildDependencyGetter(version, buildMode);
  const abortSignal = register.getAbortSignal();

  const loadDependency = dep => new Promise((resolve, reject) => {
    const abortHandler = () => {
      reject(new AbortError());
    };

    if (abortSignal.aborted) {
      reject(abortHandler());
    }

    abortSignal.addEventListener('abort', abortHandler);

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

      if (Array.isArray(cssUrl)) {
        cssUrl.forEach((cssUrlItem, index) => {
          _document.head.insertAdjacentHTML(
            'beforeend',
            // eslint-disable-next-line max-len
            `<link type="text/css" data-hot-version="${version}" rel="stylesheet" id="css-${id}-${index}" href="${cssUrlItem}"/>`
          );
        });
      } else if (cssUrl) {
        _document.head.insertAdjacentHTML(
          'beforeend',
          `<link type="text/css" data-hot-version="${version}" rel="stylesheet" id="css-${id}" href="${cssUrl}"/>`
        );
      }
    }

    // execute callback
    if (script.loaded) {
      setTimeout(() => {
        abortSignal.removeEventListener('abort', abortHandler);
        register.listen();
        themeManager.ensureCorrectHotThemes();
        resolve();
      });
    } else {
      script.addEventListener('load', () => {
        abortSignal.removeEventListener('abort', abortHandler);
        register.listen();
        themeManager.ensureCorrectHotThemes();
        resolve();
      });
    }
  });

  const loadPreset = async() => {
    const dependencies = presetMap[preset];

    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];

      if (abortSignal.aborted) {
        break;
      }

      // The order of loading is really important. For that purpose await was used.
      await loadDependency(dep); // eslint-disable-line no-await-in-loop
    }
  };

  loadPreset()
    .then(callback)
    .catch((err) => {
      if (!(err instanceof AbortError)) {
        throw err;
      }
    });
};

module.exports = { useHandsontable };
