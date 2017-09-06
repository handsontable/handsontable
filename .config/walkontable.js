'use strict';

/**
 * Config responsible for building Walkontable (bundled into `src/3rdparty/walkontable/dist/`):
 *  - walkontable.js
 */
const path = require('path');
const webpack = require('webpack');
const configFactory = require('./base');
const JasmineHtml = require('./plugin/jasmine-html');

const wotPath = path.resolve(__dirname, '../src/3rdparty/walkontable');

module.exports.create = function create(envArgs) {
  const config = {
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
