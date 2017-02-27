var configFactory = require('./base');
var JasmineHtml = require('./plugin/jasmine-html');
var path = require('path');
var webpack = require('webpack');

var env = process.env.NODE_ENV;
var PACKAGE_NAME = configFactory.PACKAGE_NAME;

module.exports.PACKAGE_NAME = PACKAGE_NAME;

module.exports.create = function create() {
  var config = configFactory.create();

  config.forEach(function(c) {
    c.devtool = 'cheap-module-source-map';
    c.output = {};
    c.output.filename = 'e2e.js';
    c.output.path = path.resolve(__dirname, '..', 'test', 'dist'),
    c.resolve.alias.handsontable = path.resolve(__dirname, '..', 'src');

    c.module.rules.unshift({
      test: [
         // Disable loading css files from pikaday module
        /pikaday\/css/,
      ],
      loader: path.resolve(__dirname, 'loader', 'empty-loader.js'),
    });

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '..', 'test', 'E2ERunner.html'),
        externalCssFiles: [
          'lib/normalize.css',
          '../dist/handsontable.css',
        ],
        externalJsFiles: [
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          '../dist/numbro/numbro.js',
          '../dist/numbro/languages.js',
          '../dist/moment/moment.js',
          '../dist/pikaday/pikaday.js',
          '../dist/zeroclipboard/ZeroClipboard.js',
          '../demo/js/backbone/lodash.underscore.js',
          '../demo/js/backbone/backbone.js',
          'helpers/SpecHelper.js',
          '../dist/handsontable.js',
        ],
      })
    );
  });

  return [].concat(config);
}
