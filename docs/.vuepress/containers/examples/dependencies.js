/* eslint-disable max-len */
// TODO this file is quite similar to part of handsontable-manager.js,
//  However be careful because some dependencies have different URLs!
//  That URLs might be stored as JSON - to research further.
const mapVersion = (version = 'latest') => (version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest');

const getHotUrls = (version) => {
  const mappedVersion = mapVersion(version);

  return {
    handsontableJs: `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
    handsontableCss: `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
    languagesJs: `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/languages/all.js`
  };
};

/** Some further version of Handsontable will needs different version of dependencies.
 * The function `buildDependencyGetter` is the best place to care about that.
 *
 * @param {string} version The current selected documentation version.
 * @returns {function({dependency:string}):[string,string[],string]} [jsUrl, dependentVars[]?, cssUrl?].
 */
const buildDependencyGetter = (version) => {
  const { handsontableJs, handsontableCss, languagesJs } = getHotUrls(version);

  return (dependency) => {
    const dependencies = {
      hot: [handsontableJs, ['Handsontable', 'Handsontable.react'], handsontableCss],
      react: ['https://unpkg.com/react@17/umd/react.development.js', ['React']],
      'react-dom': ['https://unpkg.com/react-dom@17/umd/react-dom.development.js', ['ReactDOM']],
      'hot-react': ['https://cdn.jsdelivr.net/npm/@handsontable/react/dist/react-handsontable.js', ['Handsontable.react']],
      fixer: ['https://handsontable.com/docs/8.3.2/scripts/jsfiddle-fixer.js', ['require', 'exports']],
      numbro: ['https://handsontable.com/docs/8.3.2/components/numbro/dist/languages.min.js', ['numbro.allLanguages', 'numbro']],
      redux: ['https://cdn.jsdelivr.net/npm/redux@4/dist/redux.min.js', []],
      rxjs: ['https://cdn.jsdelivr.net/npm/rxjs@6/bundles/rxjs.umd.js', [/* todo */]],
      'core-js': ['https://cdn.jsdelivr.net/npm/core-js@2/client/core.min.js', [/* todo */]],
      zone: ['https://cdn.jsdelivr.net/npm/zone.js@0.9/dist/zone.min.js', [/* todo */]],
      'angular-compiler': ['https://cdn.jsdelivr.net/npm/@angular/compiler@8/bundles/compiler.umd.min.js', [/* todo */]],
      'angular-core': ['https://cdn.jsdelivr.net/npm/@angular/core@8/bundles/core.umd.min.js', [/* todo */]],
      'angular-common': ['https://cdn.jsdelivr.net/npm/@angular/common@8/bundles/common.umd.min.js', [/* todo */]],
      'angular-forms': ['https://cdn.jsdelivr.net/npm/@angular/forms@7/bundles/forms.umd.min.js', [/* todo */]],
      'angular-platform-browser': ['https://cdn.jsdelivr.net/npm/@angular/platform-browser@8/bundles/platform-browser.umd.min.js', [/* todo */]],
      'angular-platform-browser-dynamic': ['https://cdn.jsdelivr.net/npm/@angular/platform-browser-dynamic@8/bundles/platform-browser-dynamic.umd.min.js', [/* todo */]],
      'hot-angular': ['https://cdn.jsdelivr.net/npm/@handsontable/angular@7.0.0/bundles/handsontable-angular.umd.min.js', [/* todo */]],
      'hot-vue': ['https://cdn.jsdelivr.net/npm/@handsontable/vue@6.0.0/dist/vue-handsontable.min.js', [/* todo */]],
      vue: ['https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js', [/* todo */]],
      vuex: ['https://unpkg.com/vuex@3/dist/vuex.js', [/* todo */]],
      languages: [languagesJs, [/* todo */]],
    };

    return dependencies[dependency];
  };
};

const presetMap = {
  hot: ['hot'],
  react: ['hot', 'react', 'react-dom', 'hot-react', 'fixer'],
  'react-numbro': ['hot', 'numbro', 'react', 'react-dom', 'hot-react', 'fixer'],
  'react-redux': ['hot', 'react', 'react-dom', 'redux', 'hot-react', 'fixer'],
  angular: ['hot', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  'angular-languages': ['hot', 'languages', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-forms', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  'angular-numbro': ['hot', 'numbro', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  vue: ['hot', 'vue', 'hot-vue', 'fixer'],
  'vue-numbro': ['hot', 'numbro', 'vue', 'hot-vue', 'fixer'],
  'vue-languages': ['hot', 'languages', 'vue', 'hot-vue', 'fixer'],
  'vue-vuex': ['hot', 'vue', 'vuex', 'hot-vue', 'fixer'],
};

const getDependencies = (version, preset) => {
  const getter = buildDependencyGetter(version);
  return presetMap[preset].map(x => getter(x));
};

module.exports = { getDependencies };
