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
      return {
        handsontableJs: '/docs/handsontable.js',
        handsontableCss: '/docs/handsontable.css',
        languagesJs: 'https://cdn.jsdelivr.net/npm/handsontable/dist/languages/all.js'
      };
    }
    const mappedVersion = version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest';

    return {
      handsontableJs:`https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
      handsontableCss:`https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
      languagesJs:`https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/languages/all.js`
    };
  };

  return (version, callback = () => {}, preset = 'hot') => {
    //todo duplicated in examples
    const buildDependencyGetter = (version) => {
      const {handsontableJs, handsontableCss, languagesJs} = getHotUrls(version);
      // todo use version
      // todo describe dynamic dependencies loader in readme
      // todo describe presets in readme
      return (dependency) => {
        const dependencies = {
          hot: [handsontableJs, ['Handsontable', 'Handsontable.react'], handsontableCss],
          react: ['https://unpkg.com/react@17/umd/react.development.js', ['React']],
          'react-dom': ['https://unpkg.com/react-dom@17/umd/react-dom.development.js', ['ReactDOM']],
          'hot-react': ['https://cdn.jsdelivr.net/npm/@handsontable/react/dist/react-handsontable.js', ['Handsontable.react']],
          fixer: ['/docs/scripts/fixer.js', ['require', 'exports']],
          numbro: ['https://handsontable.com/docs/8.3.2/components/numbro/dist/languages.min.js', ['numbro.allLanguages','numbro']],
          redux: ['https://cdn.jsdelivr.net/npm/redux@4/dist/redux.min.js',[]],
          'rxjs': ["https://cdn.jsdelivr.net/npm/rxjs@6/bundles/rxjs.umd.js",[/*todo*/]],
          'core-js': ["https://cdn.jsdelivr.net/npm/core-js@2/client/core.min.js",[/*todo*/]],
          'zone': ["https://cdn.jsdelivr.net/npm/zone.js@0.9/dist/zone.min.js",[/*todo*/]],
          'angular-compiler': ["https://cdn.jsdelivr.net/npm/@angular/compiler@8/bundles/compiler.umd.min.js",[/*todo*/]],
          'angular-core': ["https://cdn.jsdelivr.net/npm/@angular/core@8/bundles/core.umd.min.js",[/*todo*/]],
          'angular-common': ["https://cdn.jsdelivr.net/npm/@angular/common@8/bundles/common.umd.min.js",[/*todo*/]],
          'angular-forms': ['https://cdn.jsdelivr.net/npm/@angular/forms@7/bundles/forms.umd.min.js',[/*todo*/]],
          'angular-platform-browser': ["https://cdn.jsdelivr.net/npm/@angular/platform-browser@8/bundles/platform-browser.umd.min.js",[/*todo*/]],
          'angular-platform-browser-dynamic': ["https://cdn.jsdelivr.net/npm/@angular/platform-browser-dynamic@8/bundles/platform-browser-dynamic.umd.min.js",[/*todo*/]],
          'hot-angular': ["https://cdn.jsdelivr.net/npm/@handsontable/angular@7.0.0/bundles/handsontable-angular.umd.min.js",[/*todo*/]],
          'hot-vue': ["https://cdn.jsdelivr.net/npm/@handsontable/vue@6.0.0/dist/vue-handsontable.min.js", [/*todo*/]],
          'vue': ["https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js", [/*todo*/]],
          'vuex': ["https://unpkg.com/vuex@3/dist/vuex.js", [/*todo*/]],
          'languages': [languagesJs,[/*todo*/]],

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
        angular: ['hot', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular', ],
        'angular-languages': ['hot', 'languages', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-forms', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular', ],
        'angular-numbro': ['hot', 'numbro', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular', ],
        'vue':[ 'hot', 'vue', 'hot-vue', 'fixer'],
        'vue-numbro':[ 'hot', 'numbro', 'vue', 'hot-vue', 'fixer'],
        'vue-languages':[ 'hot', 'languages', 'vue', 'hot-vue', 'fixer'],
        'vue-vuex':[ 'hot', 'vue', 'vuex', 'hot-vue', 'fixer'],
        // todo others
      // <script src=""></script>
      };

      for (const dep of presetMap[preset]) { // order of loading is really important. that why I use for with await - really slow solution
        await loadDependency(dep);
      }
    };

    reloadPreset(preset).then(callback);
  };

})(handsontableInstancesRegister);
