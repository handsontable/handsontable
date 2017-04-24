'use strict';

/**
 * Config responsible for building Walkontable (bundled into `src/3rdparty/walkontable/dist/`):
 *  - walkontable.js
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
    devtool: 'cheap-module-source-map',
    output: {
      library: 'Walkontable',
      libraryTarget: 'var',
      filename: 'walkontable.js',
      path: path.resolve(wotPath, 'dist'),
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
    plugins: [
      // This helps ensure the builds are consistent if source code hasn't changed
      new webpack.optimize.OccurrenceOrderPlugin(),
    ],
  };

  return [].concat(config);
}
