/**
 * Config responsible for building Mobile End-to-End test files (bundled into `test/dist/`):
 *  - mobile.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const configFactory = require('./test-e2e');
const JasmineHtml = require('./plugin/jasmine-html');
const { getClosest }  = require('./helper/path');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    // Remove all 'JasmineHtmlPlugin' instances
    c.plugins = c.plugins.filter(function(plugin) {
      return !plugin.__isJasmineHtmlPlugin;
    });

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '../test/MobileRunner.html'),
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
          `../dist/handsontable.js`,
          `../dist/languages/all.js`,
        ],
        hotTheme: envArgs.HOT_THEME,
      })
    );
  });

  return [].concat(config);
}
