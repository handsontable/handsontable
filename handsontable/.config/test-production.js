/**
 * Config responsible for building End-to-End test files (bundled into `test/dist/`). These tests testing `*.full.min.js` files:
 *  - e2e.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const configFactory = require('./test-e2e');
const JasmineHtml = require('./plugin/jasmine-html');
const { getClosest }  = require('./helper/path');
const { computeRunId } = require('./helper/run-id');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);
  const runId = computeRunId({
    testPathPattern: envArgs.testPathPattern,
    theme: envArgs.HOT_THEME,
  });

  config.forEach(function(c) {
    // Remove all 'JasmineHtmlPlugin' instances added by the base test-e2e
    // config -- production tests reference the minified bundles instead.
    c.plugins = c.plugins.filter(function(plugin) {
      return !plugin.__isJasmineHtmlPlugin;
    });

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
        'helpers/jasmine-bridge-reporter.js',
        'lib/jquery.min.js',
        'lib/jquery.simulate.js',
      ],
      hotJsFiles: [
        '../dist/handsontable.full.min.js',
        '../dist/languages/all.min.js',
      ],
      hotTheme: envArgs.HOT_THEME,
    };

    c.plugins.push(new JasmineHtml({
      ...jasmineHtmlOptions,
      filename: path.resolve(__dirname, '../test/E2ERunner.html'),
    }));

    c.plugins.push(new JasmineHtml({
      ...jasmineHtmlOptions,
      filename: path.resolve(__dirname, `../test/E2ERunner-${runId}.html`),
    }));
  });

  return [].concat(config);
}
