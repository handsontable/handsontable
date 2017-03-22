'use strict';

/**
 * Config responsible for building End-to-End test files (bundled into `test/dist/`). These tests testing `*.full.min.js` files:
 *  - e2e.entry.js
 *  - helpers.entry.js
 */
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var webpack = require('webpack');
var configFactory = require('./test-e2e');
var JasmineHtml = require('./plugin/jasmine-html');

var env = process.env.NODE_ENV;
var PACKAGE_NAME = configFactory.PACKAGE_NAME;

module.exports.PACKAGE_NAME = PACKAGE_NAME;

module.exports.create = function create(envArgs) {
  var config = configFactory.create(envArgs);

  config.forEach(function(c) {
    // Remove all 'JasmineHtml' instances
    c.plugins = c.plugins.filter(function(plugin) {
      return !(plugin instanceof HtmlWebpackPlugin);
    });

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '../test/E2ERunner.html'),
        baseJasminePath: '../',
        externalCssFiles: [
          'lib/normalize.css',
          '../dist/handsontable.full.min.css',
        ],
        externalJsFiles: [
          '../test/lib/phantom-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          'lib/lodash.underscore.js',
          'lib/backbone.js',
          '../dist/handsontable.full.min.js',
          '../dist/numbro/languages.js',
        ],
      })
    );
  });

  return [].concat(config);
}
