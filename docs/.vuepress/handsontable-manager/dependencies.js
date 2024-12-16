// eslint-disable-next-line no-restricted-globals
const isBrowser = (typeof window !== 'undefined');

const formatVersion = version => (/^\d+\.\d+$/.test(version) ? version : 'latest');

/**
 * Gets the local/remote package url for the required file type.
 *
 * @param {string} packageName The package name.
 * @param {string} version The package version. If specified as 'next', the local urls will be returned.
 * @param {'js'|'css'|string} fileSelection If set to `js` or `css`, it will return the urls of the default js/css
 * files. If any other value is provided, it will be treated as a path the required file.
 * @returns {string} Url to the required file.
 */
const getPackageUrls = (packageName, version, fileSelection) => {
  const subDirs = {
    handsontable: {
      js: 'handsontable.full.min.js',
      css: [
        'handsontable.min.css',
        'ht-theme-main.css',
        'ht-theme-horizon.css',
      ],
      subDir: 'dist/',
      cssSubDir: 'styles/',
    },
    '@handsontable/react': {
      js: 'react-handsontable.min.js',
      subDir: 'dist/',
    },
    '@handsontable/react-wrapper': {
      js: 'react-handsontable.min.js',
      subDir: 'dist/',
    },
    '@handsontable/angular': {
      js: 'handsontable-angular.mjs',
      subDir: 'fesm2022/'
    },
    '@handsontable/vue': {
      js: 'vue-handsontable.min.js',
      subDir: 'dist/',
    },
    '@handsontable/vue3': {
      js: 'vue-handsontable.min.js',
      subDir: 'dist/',
    }
  };

  const urlSet = subDirs[packageName];
  const fileName = urlSet[fileSelection];
  let subDir = '';

  switch (fileSelection) {
    case 'js':
      subDir = urlSet.subDir;
      break;
    case 'css':
      subDir = urlSet.cssSubDir;
      break;
    default:
  }

  if (version === 'next' && isBrowser) {
    if (Array.isArray(fileName)) {
      return fileName.map(file => (`/docs/${packageName}/${subDir}${file}`));
    }

    if (fileName) {
      return `/docs/${packageName}/${subDir}${fileName}`;
    }

    return `/docs/${packageName}/${fileSelection}`;
  }

  const mappedVersion = formatVersion(version);

  if (Array.isArray(fileName)) {
    return fileName.map(file => `https://cdn.jsdelivr.net/npm/${packageName}@${mappedVersion}/${subDir}${file}`);
  }

  return fileName ?
    `https://cdn.jsdelivr.net/npm/${packageName}@${mappedVersion}/${subDir}${fileName}` :
    `https://cdn.jsdelivr.net/npm/${packageName}@${mappedVersion}/${fileSelection}`;
};

const getCommonScript = (scriptName, version) => {
  if (isBrowser) {
    // eslint-disable-next-line no-restricted-globals
    return [
      `${window.location.origin}/docs/${version === 'next' ? '' : `${version}/`}scripts/${scriptName}.js`,
      ['require', 'exports']
    ];
  }

  // eslint-disable-next-line global-require
  const { getDocsBaseFullUrl } = require('../helpers');

  return [`${getDocsBaseFullUrl()}/scripts/${scriptName}.js`, ['require', 'exports']];
};

/**
 * Some further version of Handsontable will needs different version of dependencies.
 * The function `buildDependencyGetter` is the best place to care about that.
 *
 * @param {string} version The current selected documentation version.
 * @returns {Function} Returns a function factory with the signature
 *                     `{function(dependency: string): [string,string[],string]} [jsUrl, dependentVars[]?, cssUrl?]`.
 */
const buildDependencyGetter = (version) => {
  const fixer = getCommonScript('fixer', version);
  const helpers = getCommonScript('helpers', version);

  return (dependency) => {
    /* eslint-disable max-len */
    const dependencies = {
      fixer,
      helpers,
      hot: [getPackageUrls('handsontable', version, 'js'), ['Handsontable'], getPackageUrls('handsontable', version, 'css')],
      react: ['https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js', ['React']],
      'react-dom': ['https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js', ['ReactDOM']],
      'hot-react': [getPackageUrls('@handsontable/react-wrapper', version, 'js'), ['Handsontable.react']],
      'react-redux': ['https://cdnjs.cloudflare.com/ajax/libs/react-redux/7.2.4/react-redux.min.js'],
      'react-colorful': ['https://cdn.jsdelivr.net/npm/react-colorful@5.5.1/dist/index.min.js'],
      'react-star-rating-component': ['https://cdn.jsdelivr.net/npm/react-star-rating-component@1.4.1/dist/react-star-rating-component.min.js'],
      numbro: ['https://cdn.jsdelivr.net/npm/numbro@2.5.0/dist/languages.min.js', ['numbro.allLanguages', 'numbro']],
      redux: ['https://cdn.jsdelivr.net/npm/redux@4/dist/redux.min.js', []],
      rxjs: ['https://cdn.jsdelivr.net/npm/rxjs@6/bundles/rxjs.umd.js', [/* todo */]],
      'core-js': ['https://cdn.jsdelivr.net/npm/core-js@2/client/core.min.js', [/* todo */]],
      zone: ['https://cdn.jsdelivr.net/npm/zone.js@0.11.4/dist/zone.min.js', [/* todo */]],
      'angular-compiler': ['https://cdn.jsdelivr.net/npm/@angular/compiler@12/bundles/compiler.umd.min.js', [/* todo
       */]],
      'angular-core': ['https://cdn.jsdelivr.net/npm/@angular/core@12/bundles/core.umd.min.js', [/* todo */]],
      'angular-common': ['https://cdn.jsdelivr.net/npm/@angular/common@12/bundles/common.umd.min.js', [/* todo */]],
      'angular-forms': ['https://cdn.jsdelivr.net/npm/@angular/forms@12/bundles/forms.umd.min.js', [/* todo */]],
      'angular-platform-browser': ['https://cdn.jsdelivr.net/npm/@angular/platform-browser@12/bundles/platform-browser.umd.min.js', [/* todo */]],
      'angular-platform-browser-dynamic': ['https://cdn.jsdelivr.net/npm/@angular/platform-browser-dynamic@12/bundles/platform-browser-dynamic.umd.min.js', [/* todo */]],
      'hot-angular': ['https://cdn.jsdelivr.net/npm/@handsontable/angular@14.2.0/bundles/handsontable-angular.umd.min.js'],
      'hot-vue': [getPackageUrls('@handsontable/vue', version, 'js'), [/* todo */], null, 'hot-vue3'],
      'hot-vue3': [getPackageUrls('@handsontable/vue3', version, 'js'), [/* todo */], null, 'hot-vue'],
      vue: ['https://cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js', [/* todo */], null, 'vue3'],
      vuex: ['https://cdn.jsdelivr.net/npm/vuex@3/dist/vuex.min.js', [/* todo */], null, 'vuex4'],
      'vue-color': ['https://cdn.jsdelivr.net/npm/vue-color@2/dist/vue-color.min.js', [/* todo */]],
      'vue-class-component': ['https://cdn.jsdelivr.net/npm/vue-class-component@7.1.0/dist/vue-class-component.min.js', [/* todo */]],
      'vue-star-rating': ['https://cdn.jsdelivr.net/npm/vue-star-rating@1/dist/VueStarRating.umd.min.js', [/* todo */]],
      vue3: ['https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js', [/* todo */], null, 'vue'],
      vuex4: ['https://cdn.jsdelivr.net/npm/vuex@4/dist/vuex.global.min.js', [/* todo */], null, 'vuex'],
      languages: [getPackageUrls('handsontable', version, 'dist/languages/all.js'), [/* todo */]],
    };
    /* eslint-enable max-len */

    // [jsUrl, dependentVars[]?, cssUrl?, globalVarSharedDependency?]
    return dependencies[dependency];
  };
};

const presetMap = {
  /* eslint-disable max-len */
  hot: ['hot', 'fixer'],
  'hot-lang': ['hot', 'languages', 'fixer'],
  'hot-numbro': ['hot', 'numbro', 'fixer'],
  react: ['hot', 'react', 'react-dom', 'hot-react', 'fixer'],
  'react-languages': ['hot', 'languages', 'react', 'react-dom', 'hot-react', 'fixer'],
  'react-numbro': ['hot', 'numbro', 'react', 'react-dom', 'hot-react', 'fixer'],
  'react-redux': ['hot', 'react', 'react-dom', 'redux', 'react-redux', 'hot-react', 'fixer'],
  'react-advanced': ['hot', 'react', 'react-dom', 'redux', 'react-redux', 'hot-react', 'fixer', 'react-colorful', 'react-star-rating-component'],
  angular: ['hot', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  'angular-languages': ['hot', 'languages', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-forms', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  'angular-numbro': ['hot', 'numbro', 'fixer', 'rxjs', 'core-js', 'zone', 'angular-compiler', 'angular-core', 'angular-common', 'angular-platform-browser', 'angular-platform-browser-dynamic', 'hot-angular'],
  vue: ['hot', 'vue', 'hot-vue', 'fixer'],
  'vue-numbro': ['hot', 'numbro', 'vue', 'hot-vue', 'fixer'],
  'vue-languages': ['hot', 'languages', 'vue', 'hot-vue', 'fixer'],
  'vue-vuex': ['hot', 'vue', 'vuex', 'hot-vue', 'fixer'],
  'vue-advanced': ['hot', 'vue', 'vuex', 'hot-vue', 'vue-color', 'vue-class-component', 'vue-star-rating', 'fixer'],
  vue3: ['hot', 'vue3', 'hot-vue3', 'fixer'],
  'vue3-numbro': ['hot', 'numbro', 'vue3', 'hot-vue3', 'fixer'],
  'vue3-languages': ['hot', 'languages', 'vue3', 'hot-vue3', 'fixer'],
  'vue3-vuex': ['hot', 'vue3', 'vuex4', 'hot-vue3', 'fixer'],
  /* eslint-enable max-len */
};

const getDependencies = (version, preset) => {
  const getter = buildDependencyGetter(version);

  if (!Array.isArray(presetMap[preset])) {
    throw new Error(`The preset "${preset}" was not found.`);
  }

  return presetMap[preset].map(x => getter(x));
};

module.exports = {
  isBrowser,
  getDependencies,
  buildDependencyGetter,
  presetMap,
  formatVersion
};
