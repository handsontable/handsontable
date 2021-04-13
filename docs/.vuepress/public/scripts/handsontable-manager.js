/* eslint-disable no-restricted-globals, no-undef, no-console, no-unused-vars */
const handsontableInstancesRegister = (() => {
  // todo reformat all this file
  const register = new Set();

  register.listen = () => {
    try {
      if (typeof Handsontable !== 'undefined' && Handsontable._instanceRegisterInstalled === undefined) {
        Handsontable._instanceRegisterInstalled = true;
        Handsontable.hooks.add('afterInit', function() {
          register.add(this);
        });
      }
    } catch (e) {
      console.error('handsontableInstancesRegister initialization failed', e);
    }
  };

  register.destroyAll = () => {
    register.forEach(instance => instance.destroy());
    register.clear();
  };

  return register;
})();

const useHandsontable = ((instanceRegister) => {
  const ATTR_VERSION = 'data-hot-version';

  const getHotUrls = (version) => {
    if (version === 'next') {
      return [
        '/docs/handsontable.js',
        '/docs/handsontable.css',
      ];
    }
    const mappedVersion = version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest';

    return [
      `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
      `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
    ];
  };

  return (version, callback = () => {}, preset = 'hot') => {
    //todo duplicated in examples
    const buildDependencyGetter = (version) => {
      const [hotJsUrl, hotCssUrl] = getHotUrls(version);
      // todo use version
      // todo describe dynamic dependencies loader in readme
      // todo describe presets in readme
      return (dependency) => {
        const dependencies = {
          hot: [hotJsUrl, ['Handsontable', 'Handsontable.react'], hotCssUrl],
          react: ['https://unpkg.com/react@17/umd/react.development.js', ['React']],
          'react-dom': ['https://unpkg.com/react-dom@17/umd/react-dom.development.js', ['ReactDOM']],
          'hot-react': ['https://cdn.jsdelivr.net/npm/@handsontable/react/dist/react-handsontable.js', ['Handsontable.react']],
          fixer: ['/docs/scripts/fixer.js', ['require', 'exports']],
          numbro: ['https://handsontable.com/docs/8.3.2/components/numbro/dist/languages.min.js', ['numbro.allLanguages','numbro']],
          redux: ['https://cdn.jsdelivr.net/npm/redux@4/dist/redux.min.js',[]],

        };

        // [jsUrl, dependentVars[]?, cssUrl?]
        return dependencies[dependency];
      };
    };
    const getDependency = buildDependencyGetter(version);

    const loadDependency = dep => new Promise((resolve) => {
      const id = `dependency-reloader_${dep}`;
      const [jsUrl, dependentVars = [], cssUrl = undefined] = getDependency(dep);

      let script = document.getElementById(`script-${id}`);

      // clear outdated version
      if (script && script.getAttribute(ATTR_VERSION) !== version) {
        dependentVars.forEach(x => delete x.split('.').reduce((p, c, i) => p[c] || {}, {}));
        script.remove();
        script = null;
      }

      // clear outdated css
      const css = document.getElementById(`css-${id}`);

      if (css && css.getAttribute(ATTR_VERSION) !== version) {
        css.remove();
      }

      // import current version
      if (!script) {
        script = document.createElement('script');
        script.src = jsUrl;
        script.id = `script-${id}`;
        script.setAttribute(ATTR_VERSION, version);
        script.addEventListener('load', () => { script.loaded = true; });

        document.head.append(script);

        if (cssUrl) {
          document.head.insertAdjacentHTML(
            'beforeend',
            `<link type="text/css" data-hot-version="${version}" rel="stylesheet" id="css-${id}" href="${cssUrl}"/>`
          );
        }
      }

      // execute callback
      if (script.loaded) {
        setTimeout(() => {
          instanceRegister.listen();
          resolve();
        });
      } else {
        script.addEventListener('load', () => {
          instanceRegister.listen();
          resolve();
        });
      }

    });

    const reloadPreset = async(preset) => {
      const presetMap = { //todo duplicated in examples
        hot: ['hot'],
        react: [ 'hot','react', 'react-dom', 'hot-react', 'fixer'],
        'react-numbro': [ 'hot', 'numbro', 'react', 'react-dom', 'hot-react', 'fixer'],
        'react-redux': [ 'hot', 'react', 'react-dom', 'redux', 'hot-react', 'fixer'],

        // todo others
      };

      for (const dep of presetMap[preset]) { // order of loading is really important. that why I use for with await - really slow solution
        await loadDependency(dep);
      }
    };

    reloadPreset(preset).then(callback);
  };

})(handsontableInstancesRegister);
