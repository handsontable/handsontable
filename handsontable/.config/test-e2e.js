/**
 * Config responsible for building End-to-End test files (bundled into `test/dist/`):
 *  - e2e.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const configFactory = require('./base');
const JasmineHtml = require('./plugin/jasmine-html');
const { getClosest }  = require('./helper/path');
const { computeRunId } = require('./helper/run-id');

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
  './themeLayoutFromTokens',
  '../../src/themes/theme',
  '../../src/themes/static/variables/density',
  '../../src/themes/static/variables/sizing',
  '../../../src/themes/static/variables/icons/*',
  '../../../src/themes/static/variables/colors/*',
  '../../../src/themes/static/variables/tokens/*',
];

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);
  const runId = computeRunId({
    testPathPattern: envArgs.testPathPattern,
    theme: envArgs.HOT_THEME,
  });

  config.forEach(function(c) {
    c.devtool = 'cheap-module-source-map';
    c.target = 'web';
    c.cache = true;
    c.output = {
      library: '__hot_tests__',
      libraryTarget: 'var',
      filename: `[name].entry.${runId}.js`,
      path: path.resolve(__dirname, '../test/dist'),
    };
    c.resolve.alias.handsontable = path.resolve(__dirname, '../src');

    c.module.rules.unshift({
      test: [],
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

    const jasmineHtmlOptions = {
      baseJasminePath: '../../',
      externalCssFiles: [
        'lib/normalize.css',
        'helpers/common-themes.css',
      ],
      hotCssFiles: [
        `../styles/ht-theme-${envArgs.HOT_THEME}.css`,
      ],
      externalJsFiles: [
        'helpers/jasmine-progressbar-reporter.js',
        'helpers/jasmine-bridge-reporter.js',
        'lib/jquery.min.js',
        'lib/jquery.simulate.js',
      ],
      hotJsFiles: [
        `../dist/handsontable.js`,
        `../dist/languages/all.js`,
      ],
      hotTheme: envArgs.HOT_THEME,
    };

    // Generic runner for developer manual testing.
    c.plugins.push(new JasmineHtml({
      ...jasmineHtmlOptions,
      filename: path.resolve(__dirname, '../test/E2ERunner.html'),
    }));

    // Per-run runner consumed by Puppeteer. Kept in `test/` alongside the
    // generic one so parallel runs with different `--testPathPattern` /
    // `--theme` don't overwrite each other, and so iframe-based specs that
    // inject relative CSS paths (e.g. `lib/normalize.css`, `../styles/*.css`)
    // still resolve against the same base URL.
    c.plugins.push(new JasmineHtml({
      ...jasmineHtmlOptions,
      filename: path.resolve(__dirname, `../test/E2ERunner-${runId}.html`),
    }));

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
