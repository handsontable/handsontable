'use strict';

/**
 * Config responsible for building Walkontable test files (bundled into `src/3rdparty/walkontable/test/dist/`):
 *  - specs.entry.js
 *  - helpers.entry.js
 */
var path = require('path');
var webpack = require('webpack');
var configFactory = require('./base');
var JasmineHtml = require('./plugin/jasmine-html');

var env = process.env.NODE_ENV;
var PACKAGE_NAME = configFactory.PACKAGE_NAME;
var wotPath = path.resolve(__dirname, '../src/3rdparty/walkontable');

module.exports.PACKAGE_NAME = PACKAGE_NAME;

module.exports.create = function create(envArgs) {
  var config = {
    target: 'web',
    devtool: 'cheap-module-source-map',
    output: {
      libraryTarget: 'var',
      filename: '[name].entry.js',
      path: path.resolve(wotPath, 'test/dist'),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [
            /node_modules/,
          ],
          options: {
            cacheDirectory: true,
          },
        }
      ]
    },
    externals: [
      {
        window: 'window',
      },
    ],
    plugins: [
      // This helps ensure the builds are consistent if source code hasn't changed
      new webpack.optimize.OccurrenceOrderPlugin(),
      new JasmineHtml({
        filename: path.resolve(wotPath, 'test/SpecRunner.html'),
        baseJasminePath: '../../../../',
        externalCssFiles: [
          '../css/walkontable.css',
        ],
        externalJsFiles: [
          'lib/phantom-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          '../dist/walkontable.js',
        ],
      })
    ],
  };

  return [].concat(config);
}
