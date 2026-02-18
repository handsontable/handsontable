const { register } = require('./register');
const { themeManager } = require('./theme-manager');
const {
  buildDependencyGetter,
  presetMap,
  themeMap,
} = require('./dependencies');

const ATTR_VERSION = 'data-hot-version';

class AbortError extends Error {}

// Global promise chain to ensure sequential preset loading, when loading multiple presets in parallel (on the same page).
let globalLoadingChain = Promise.resolve();

const useHandsontable = (version, callback = () => {}, preset = 'hot', buildMode = 'production') => {
  const getDependency = buildDependencyGetter(version, buildMode);
  const abortSignal = register.getAbortSignal();

  const loadDependency = dep => new Promise((resolve, reject) => {
    const abortHandler = () => {
      reject(new AbortError());
    };

    if (abortSignal?.aborted) {
      reject(abortHandler());
    }

    abortSignal?.addEventListener('abort', abortHandler);

    const getId = depName => `dependency-reloader_${depName}`;

    const [jsUrl, dependentVars = [], cssUrl = undefined, globalVarSharedDependency, isModule] = getDependency(dep);
    const id = getId(dep);

    const _document = document; // eslint-disable-line no-restricted-globals
    let script = null;

    // clear outdated version
    if (script && (script.getAttribute(ATTR_VERSION) !== version || (globalVarSharedDependency ?? false))) {
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
      // react-colorful UMD expects window.react; React UMD sets window.React
      if (dep === 'react-colorful' && typeof _document.defaultView.React !== 'undefined') {
        _document.defaultView.react = _document.defaultView.React;
      }

      script = _document.createElement('script');
      script.src = jsUrl;
      script.id = `script-${id}`;
      script.setAttribute(ATTR_VERSION, version);

      if (isModule) {
        script.setAttribute('type', 'module');
      }
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
        abortSignal?.removeEventListener('abort', abortHandler);
        register.listen();
        themeManager.ensureCorrectHotThemes();
        resolve();
      });
    } else {
      script.addEventListener('load', () => {
        abortSignal?.removeEventListener('abort', abortHandler);
        register.listen();
        themeManager.ensureCorrectHotThemes();
        resolve();
      });
    }
  });

  const loadPreset = async() => {
    const baseDependencies = presetMap[preset];

    // Only add theme dependencies for themes that are actually imported
    const callbackCode = callback.toString();
    const requiredThemes = Object.entries(themeMap)
      .filter(([themeName]) => callbackCode.includes(themeName))
      .map(([, dependency]) => dependency);

    const dependencies = requiredThemes.length > 0
      ? [...baseDependencies.slice(0, 1), ...requiredThemes, ...baseDependencies.slice(1)]
      : baseDependencies;

    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];

      if (abortSignal?.aborted) {
        throw new AbortError();
      }

      const exceptions = ['fixer', 'react-colorful', 'multiple-select-vanilla', 'flatpickr', 'coloris'];

      // Ensure that `fixer.js` is not loaded while injecting new dependencies (with an exception for `react-colorful` and others).
      if (!exceptions.includes(dep)) {
        const _document = document; // eslint-disable-line no-restricted-globals
        const getId = depName => `dependency-reloader_${depName}`;
        const fixerScript = _document.getElementById(`script-${getId('fixer')}`);

        if (fixerScript) {
          fixerScript.remove();
          try {
            delete window.require;
            delete window.exports;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error deleting require and exports', error);
          }
        }
      }

      // The order of loading is really important. For that purpose await was used.
      await loadDependency(dep); // eslint-disable-line no-await-in-loop
    }
  };

  // Add this preset loading to the global queue
  const currentPresetPromise = globalLoadingChain.then(async() => {
    try {
      await loadPreset();
    } catch (err) {
      if (!(err instanceof AbortError)) {
        throw err;
      }

      return;
    }

    // Execute callback separately - errors from example code should not break
    // the loading chain for other examples on the page
    try {
      callback();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Example callback error:', err);
    }
  });

  // Update the global chain to wait for this preset
  globalLoadingChain = currentPresetPromise.finally(() => {
    // This runs whether success or failure, maintaining the chain
  });

  // Return a promise for this specific preset loading
  return currentPresetPromise;
};

module.exports = { useHandsontable };
