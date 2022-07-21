const semver = require('semver');
const {
  version: currentHandsontableVersion
} = require('../../../handsontable/package.json');

// eslint-disable-next-line no-restricted-globals
const isBrowser = (typeof window !== 'undefined');

const formatVersion = version => (/^\d+\.\d+$/.test(version) ? version : 'latest');
const generatePrefixes = (version, framework) => {
  const isLatestVersion = semver.satisfies(
    semver.coerce(version)?.version,
    semver.coerce(currentHandsontableVersion)?.version.replace(/\.([a-z0-9]|-)+$/, '.x')
  );

  const versionPrefix = !isLatestVersion || version === 'next' ? `${version}/` : '';
  const frameworkPrefix = framework ? `${framework}-data-grid/` : '';

  return {
    versionPrefix,
    frameworkPrefix
  };
};
const getHotUrls = (version, framework) => {
  const {
    versionPrefix,
    frameworkPrefix
  } = generatePrefixes(version, framework);

  if (version === 'next' && isBrowser) {
    return {
<<<<<<< HEAD
      handsontableJs: `/docs/${versionPrefix}${frameworkPrefix}handsontable/handsontable.full.js`,
      handsontableCss: `/docs/${versionPrefix}${frameworkPrefix}handsontable/handsontable.full.css`,
      languagesJs: `/docs/${versionPrefix}${frameworkPrefix}handsontable/languages/all.js`
=======
      handsontableJs: '/docs/next/handsontable/handsontable.full.js',
      handsontableCss: '/docs/next/handsontable/handsontable.full.css',
      languagesJs: '/docs/next/handsontable/languages/all.js'
>>>>>>> develop
    };
  }

  const mappedVersion = formatVersion(version);

  return {
    handsontableJs: `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
    handsontableCss: `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
    languagesJs: `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/languages/all.js`
  };
};
<<<<<<< HEAD
const getCommonScript = (scriptName, version, framework) => {
  const {
    versionPrefix,
    frameworkPrefix
  } = generatePrefixes(version, framework);

  if (isBrowser) {
    // eslint-disable-next-line no-restricted-globals
    return [
      `${window.location.origin}/docs/${versionPrefix}${frameworkPrefix}scripts/${scriptName}.js`,
      ['require', 'exports']
    ];

  }

  return [
    `https://handsontable.com/docs/${versionPrefix}${frameworkPrefix}scripts/${scriptName}.js`,
    ['require', 'exports']
  ];

=======
const getCommonScript = (scriptName, version) => {
  if (isBrowser) {
    // eslint-disable-next-line no-restricted-globals
    return [
      `${window.location.origin}/docs/${version}/scripts/${scriptName}.js`,
      ['require', 'exports']
    ];
  }

  return [`https://handsontable.com/docs/${version}/scripts/${scriptName}.js`, ['require', 'exports']];
>>>>>>> develop
};

/**
 * Some further version of Handsontable will needs different version of dependencies.
 * The function `buildDependencyGetter` is the best place to care about that.
 *
 * @param {string} version The current selected documentation version.
 * @param {string} framework The current selected documentation framework.
 * @returns {Function} Returns a function factory with the signature
 *                     `{function(dependency: string): [string,string[],string]} [jsUrl, dependentVars[]?, cssUrl?]`.
 */
const buildDependencyGetter = (version, framework) => {
  const { handsontableJs, handsontableCss, languagesJs } = getHotUrls(version, framework);
  const mappedVersion = formatVersion(version);
<<<<<<< HEAD
  const fixer = getCommonScript('fixer', version, framework);
  const helpers = getCommonScript('helpers', version, framework);
=======
  const fixer = getCommonScript('fixer', version);
  const helpers = getCommonScript('helpers', version);
>>>>>>> develop

  return (dependency) => {
    /* eslint-disable max-len */
    const dependencies = {
      fixer,
      helpers,
      hot: [handsontableJs, ['Handsontable'], handsontableCss],
      react: ['https://cdn.jsdelivr.net/npm/react@17/umd/react.production.min.js', ['React']],
      'react-dom': ['https://cdn.jsdelivr.net/npm/react-dom@17/umd/react-dom.production.min.js', ['ReactDOM']],
      'hot-react': [`https://cdn.jsdelivr.net/npm/@handsontable/react@${mappedVersion}/dist/react-handsontable.js`, ['Handsontable.react']],
      'react-redux': ['https://cdnjs.cloudflare.com/ajax/libs/react-redux/7.2.4/react-redux.min.js'],
      'react-colorful': ['https://cdn.jsdelivr.net/npm/react-colorful@5.5.1/dist/index.min.js'],
      'react-star-rating-component': ['https://cdn.jsdelivr.net/npm/react-star-rating-component@1.4.1/dist/react-star-rating-component.min.js'],
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
      'hot-angular': [`https://cdn.jsdelivr.net/npm/@handsontable/angular@${mappedVersion}/bundles/handsontable-angular.umd.min.js`, [/* todo */]],
      'hot-vue': [`https://cdn.jsdelivr.net/npm/@handsontable/vue@${mappedVersion}/dist/vue-handsontable.min.js`, [/* todo */]],
      'hot-vue3': [`https://cdn.jsdelivr.net/npm/@handsontable/vue3@${mappedVersion}/dist/vue-handsontable.min.js`, [/* todo */]],
      vue: ['https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js', [/* todo */]],
      vuex: ['https://cdn.jsdelivr.net/npm/vuex@3/dist/vuex.min.js', [/* todo */]],
      'vue-color': ['https://cdn.jsdelivr.net/npm/vue-color@2/dist/vue-color.min.js', [/* todo */]],
      'vue-class-component': ['https://cdn.jsdelivr.net/npm/vue-class-component@7.1.0/dist/vue-class-component.min.js', [/* todo */]],
      'vue-star-rating': ['https://cdn.jsdelivr.net/npm/vue-star-rating@1/dist/VueStarRating.umd.min.js', [/* todo */]],
      vue3: ['https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js', [/* todo */]],
      vuex4: ['https://cdn.jsdelivr.net/npm/vuex@4/dist/vuex.global.min.js', [/* todo */]],
      languages: [languagesJs, [/* todo */]],
    };
    /* eslint-enable max-len */

    // [jsUrl, dependentVars[]?, cssUrl?]
    return dependencies[dependency];
  };
};

const presetMap = {
  /* eslint-disable max-len */
  hot: ['hot'],
  'hot-lang': ['hot', 'languages'],
  'hot-numbro': ['hot', 'numbro'],
  react: ['hot', 'react', 'react-dom', 'hot-react', 'fixer', 'helpers'],
  'react-languages': ['hot', 'languages', 'react', 'react-dom', 'hot-react', 'fixer', 'helpers'],
  'react-numbro': ['hot', 'numbro', 'react', 'react-dom', 'hot-react', 'fixer', 'helpers'],
  'react-redux': ['hot', 'react', 'react-dom', 'redux', 'react-redux', 'hot-react', 'fixer', 'helpers'],
  'react-advanced': ['hot', 'react', 'react-dom', 'redux', 'react-redux', 'hot-react', 'fixer', 'helpers', 'react-colorful', 'react-star-rating-component'],
  angular: ['hot', 'fixer', 'helpers', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  'angular-languages': ['hot', 'languages', 'fixer', 'helpers', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-forms', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  'angular-numbro': ['hot', 'numbro', 'fixer', 'helpers', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  vue: ['hot', 'vue', 'hot-vue', 'fixer', 'helpers'],
  'vue-numbro': ['hot', 'numbro', 'vue', 'hot-vue', 'fixer', 'helpers'],
  'vue-languages': ['hot', 'languages', 'vue', 'hot-vue', 'fixer', 'helpers'],
  'vue-vuex': ['hot', 'vue', 'vuex', 'hot-vue', 'fixer', 'helpers'],
  'vue-advanced': ['hot', 'vue', 'vuex', 'hot-vue', 'vue-color', 'vue-class-component', 'vue-star-rating', 'fixer', 'helpers'],
  vue3: ['hot', 'vue3', 'hot-vue3', 'fixer', 'helpers'],
  'vue3-numbro': ['hot', 'numbro', 'vue3', 'hot-vue3', 'fixer', 'helpers'],
  'vue3-languages': ['hot', 'languages', 'vue3', 'hot-vue3', 'fixer', 'helpers'],
  'vue3-vuex': ['hot', 'vue3', 'vuex4', 'hot-vue3', 'fixer', 'helpers'],
  /* eslint-enable max-len */
};

const getDependencies = (version, preset, framework) => {
  const getter = buildDependencyGetter(version, framework);

  if (!Array.isArray(presetMap[preset])) {
    throw new Error(`The preset "${preset}" was not found.`);
  }

  return presetMap[preset].map(x => getter(x));
};

module.exports = {
  isBrowser,
  getDependencies,
  buildDependencyGetter,
  presetMap
};
