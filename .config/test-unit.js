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
    c.output.filename = 'unit.js';
    c.output.path = path.resolve(__dirname, '..', 'test', 'dist'),
    c.resolve.alias.handsontable = path.resolve(__dirname, '..', 'src');

    c.module.rules.unshift({
      test: [/\.css$/,],
      loader: path.resolve(__dirname, 'loader', 'empty-loader.js'),
    });

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '..', 'test', 'UnitRunner.html'),
        externalCssFiles: [],
        externalJsFiles: [],
      })
    );
  });

  return [].concat(config);
}
