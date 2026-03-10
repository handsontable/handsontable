const allowedE2EModules = [
  'window',
  'hyperformula*',
  'jasmine-co',
  'jest-matcher-utils',
  'html-parse-stringify',
  'regenerator-runtime/runtime*',
  '@babel/runtime/*',
  './htmlNormalize',
  './focusNavigator',
  './common',
  './utils',
  './jasmine-helpers',
  './mouseEvents',
  './keyboardEvents',
  './../bootstrap',
  './helpers/custom-matchers',
  './custom-matchers',
  './helpers/jasmine-helpers',
  '../helpers/it-themes-extension',
  './asciiTable',
  '../../../../../test/helpers/asciiTable',
  './__mocks__/*',
  './MemoryLeakTest',
  '../MemoryLeakTest',
  '../../../src/themes/static/variables/icons/*',
  '../../../src/themes/static/variables/colors/*',
  '../../../src/themes/static/variables/tokens/*',
];

const babelPresetEnvConfig = () => ({
  targets: {
    chrome: '110',
    firefox: '110',
    safari: '14.1',
    node: '11', // support for Webpack 4 and similar oldish bundlers
  },
  modules: false,
  debug: false,
  useBuiltIns: 'usage',
  corejs: {
    version: '3.37'
  }
});

module.exports = function(api) {
  const env = api.env();

  // Presets: @babel/preset-env must come BEFORE @babel/preset-typescript in the array
  // because Babel applies presets in reverse order - typescript must run first to strip
  // `declare` fields before preset-env's class features transform runs.
  const presets = [];
  const envsWithPresetEnv = ['commonjs', 'commonjs_e2e'];

  if (envsWithPresetEnv.includes(env)) {
    presets.push(['@babel/preset-env', babelPresetEnvConfig()]);
  }

  presets.push(['@babel/preset-typescript', { allowDeclareFields: true }]);

  // Base plugins applied to all environments.
  const plugins = [
    'babel-plugin-transform-inline-environment-variables',
  ];

  // Environment-specific plugins.
  if (env === 'test') {
    // Jest unit tests (NODE_ENV=test). Transforms ES modules to CommonJS
    // so that Jest can process files that use import/export syntax.
    plugins.push(
      ['@babel/plugin-transform-modules-commonjs', { loose: true }]
    );
  } else if (env === 'commonjs') {
    // Unit testing, source code and languages building via webpack (UMD).
    plugins.push(
      ['@babel/plugin-transform-runtime', {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: false,
      }],
      ['@babel/plugin-transform-modules-commonjs', { loose: true }]
    );
  } else if (env === 'commonjs_dist') {
    // Transpiling files to be compatible with CommonJS.
    plugins.push(
      ['@babel/plugin-transform-modules-commonjs', { loose: true }],
      ['babel-plugin-transform-require-ignore', { extensions: ['.css', '.scss'] }]
    );
  } else if (env === 'es') {
    // Transpiling files to be compatible with ES Modules.
    plugins.push(
      ['babel-plugin-transform-require-ignore', { extensions: ['.css', '.scss'] }],
      ['./.config/plugin/babel/add-import-extension.js', { extension: 'mjs' }]
    );
  } else if (env === 'es_languages') {
    // Transpiling only legacy language files (e.g. import `languages/pl-PL`)
    // which need to be compatible with ES Modules. That format, by default, automatically
    // registers the language pack. It's not suitable to use with the modularized version of
    // the Handsontable.
    plugins.push(
      ['babel-plugin-transform-require-ignore', { extensions: ['.css', '.scss'] }],
      ['./.config/plugin/babel/add-import-extension.js', { extension: 'mjs' }],
      ['./.config/plugin/babel/add-language-registration.js'],
    );
  } else if (env === 'commonjs_e2e') {
    // Building E2E tests (UMD).
    plugins.push(
      ['@babel/plugin-transform-runtime', {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: false,
      }],
      ['@babel/plugin-transform-modules-commonjs', { loose: true }],
      ['babel-plugin-forbidden-imports', {
        allowedModules: allowedE2EModules
      }]
    );
  }

  // Environment-specific ignore patterns.
  const ignore = [
    'src/3rdparty/walkontable/dist/',
    'src/3rdparty/walkontable/test/dist/',
  ];

  if (env === 'commonjs_dist' || env === 'es') {
    ignore.push(
      '**/__tests__/**',
      '**/test/**',
      '**/dist/**',
    );
  }

  return {
    presets,
    plugins,
    assumptions: {
      // save 21 kB (July 12, 2023) https://babeljs.io/docs/assumptions#noincompletensimportdetection
      noIncompleteNsImportDetection: true,
      // Use simple property assignment for private class fields and methods instead of
      // WeakMap-based brand checks. The strict brand checks are incompatible with the
      // plugin hook pattern where hooks reference private methods via closures.
      // This was not an issue on origin/develop because the JS source had no #private fields.
      privateFieldsAsProperties: true,
    },
    ignore,
  };
};
