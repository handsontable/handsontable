/**
 * Config responsible for building End-to-End test files (bundled into `test/dist/`):
 *  - e2e.entry.js
 *  - helpers.entry.js
 */
var path = require('path');
var webpack = require('webpack');
var configFactory = require('./base');
var JasmineHtml = require('./plugin/jasmine-html');

var env = process.env.NODE_ENV;
var PACKAGE_NAME = configFactory.PACKAGE_NAME;

module.exports.PACKAGE_NAME = PACKAGE_NAME;

module.exports.create = function create(envArgs) {
  var config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.devtool = 'cheap-module-source-map';
    c.target = 'web';
    c.output = {
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

    c.externals = [
      {
        window: 'window',
      },
    ];

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '../test/E2ERunner.html'),
        baseJasminePath: '../',
        externalCssFiles: [
          'lib/normalize.css',
          '../dist/handsontable.css',
        ],
        externalJsFiles: [
          '../test/lib/phantom-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          'lib/lodash.underscore.js',
          'lib/backbone.js',
          '../dist/numbro/numbro.js',
          '../dist/numbro/languages.js',
          '../dist/moment/moment.js',
          '../dist/pikaday/pikaday.js',
          '../dist/zeroclipboard/ZeroClipboard.js',
          '../dist/handsontable.js',
        ],
      })
    );

    c.node.global = true;
  });

  return [].concat(config);
}
