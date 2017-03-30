'use strict';

/**
 * Config responsible for building unit test files (bundled into `test/dist/`):
 *  - unit.entry.js
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
      test: [/\.css$/,],
      loader: path.resolve(__dirname, 'loader/empty-loader.js'),
    });

    c.externals = [
      {
        window: 'window',
      },
    ];

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '../test/UnitRunner.html'),
        baseJasminePath: '../',
        externalCssFiles: [],
        externalJsFiles: [],
      })
    );
  });

  return [].concat(config);
}
