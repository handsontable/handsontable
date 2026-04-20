/**
 * Config responsible for building End-to-End test files (bundled into `test/dist/`):
 *  - e2e.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const configFactory = require('./base');
const JasmineHtml = require('./plugin/jasmine-html');
const { getClosest }  = require('./helper/path');

// Allow-list of module specifiers that may appear in files under `handsontable/test/**`
// (the loader scope defined on the rule below). Matched by literal string, with a
// trailing '*' acting as a prefix wildcard. Every `./foo` / `../foo` used by a spec
// or helper in scope must appear here, otherwise the build fails.
const ALLOWED_E2E_MODULES = [
  'window',
  'jasmine-co',
  'html-parse-stringify',
  './htmlNormalize',
  './focusNavigator',
  './common',
  './utils',
  './mouseEvents',
  './keyboardEvents',
  './../bootstrap',
  './helpers/custom-matchers',
  './helpers/jasmine-helpers',
  '../helpers/it-themes-extension',
  './asciiTable',
  './__mocks__/*',
  './MemoryLeakTest',
  '../MemoryLeakTest',
  './themeLayoutCore',
  './themeLayoutFromTokens',
  './themeLayoutE2eHelpers',
  '../../src/themes/theme',
  '../../src/themes/static/variables/density',
  '../../src/themes/static/variables/sizing',
  '../../../src/themes/static/variables/icons/*',
  '../../../src/themes/static/variables/colors/*',
  '../../../src/themes/static/variables/tokens/*',
];

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.devtool = 'cheap-module-source-map';
    c.target = 'web';
    c.cache = true;
    c.output = {
      library: '__hot_tests__',
      libraryTarget: 'var',
      filename: '[name].entry.js',
      path: path.resolve(__dirname, '../test/dist'),
    };
    c.resolve.alias.handsontable = path.resolve(__dirname, '../src');

    c.module.rules.unshift({
      test: [
         // Disable loading css files from pikaday module
        /pikaday\/css/,
      ],
      loader: path.resolve(__dirname, 'loader/empty-loader.js'),
    });

    // Enforce allowed imports in test files (prevents importing unauthorized modules)
    c.module.rules.push({
      test: /\.js$/,
      include: [
        path.resolve(__dirname, '../test'),
      ],
      enforce: 'pre',
      loader: path.resolve(__dirname, 'loader/forbidden-imports-loader.js'),
      options: {
        allowedModules: ALLOWED_E2E_MODULES,
      },
    });

    c.externals = [
      {
        window: 'window',
      },
    ];

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '../test/E2ERunner.html'),
        baseJasminePath: '../../',
        externalCssFiles: [
          'lib/normalize.css',
          'helpers/common-themes.css',
          `${getClosest('../node_modules/@handsontable/pikaday', true)}/css/pikaday.css`,
        ],
        hotCssFiles: [
          `../styles/ht-theme-${envArgs.HOT_THEME}.css`,
        ],
        externalJsFiles: [
          'helpers/jasmine-progressbar-reporter.js',
          'helpers/jasmine-bridge-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          `${getClosest('../node_modules/numbro', true)}/dist/numbro.js`,
          `${getClosest('../node_modules/numbro', true)}/dist/languages.min.js`,
          `${getClosest('../node_modules/moment', true)}/moment.js`,
          `${getClosest('../node_modules/@handsontable/pikaday', true)}/pikaday.js`,
          `${getClosest('../node_modules/dompurify', true)}/dist/purify.js`,
        ],
        hotJsFiles: [
          `../dist/handsontable.js`,
          `../dist/languages/all.js`,
        ],
        hotTheme: envArgs.HOT_THEME,
      })
    );

    // Disable side effects optimization for test builds. Test helpers like custom-matchers.js
    // have no exports but register Jasmine matchers via beforeEach (side effects only).
    // Without this, Rspack tree-shakes them away based on the package.json sideEffects field.
    c.optimization = {
      sideEffects: false,
    };

    c.node = {
      global: true,
    }
  });

  return [].concat(config);
}
