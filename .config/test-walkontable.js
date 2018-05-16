'use strict';

/**
 * Config responsible for building Walkontable test files (bundled into `src/3rdparty/walkontable/test/dist/`):
 *  - specs.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const webpack = require('webpack');
const JasmineHtml = require('./plugin/jasmine-html');

const wotPath = path.resolve(__dirname, '../src/3rdparty/walkontable');

module.exports.create = function create(envArgs) {
  const config = {
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
          'helpers/jasmine-bridge-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          '../dist/walkontable.js',
        ],
      })
    ],
  };

  return [].concat(config);
}
