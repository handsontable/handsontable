'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var path = require('path');
var fs = require('fs');
var webpack = require('webpack');

var licenseBody = fs.readFileSync(path.resolve(__dirname, '../LICENSE'), 'utf8');
var packageBody = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

var PACKAGE_VERSION = packageBody.version;
var PACKAGE_NAME = packageBody.name;
var BUILD_DATE = new Date();
var BASE_VERSION = void 0;

module.exports.PACKAGE_VERSION = PACKAGE_VERSION;
module.exports.PACKAGE_NAME = PACKAGE_NAME;
module.exports.BUILD_DATE = BUILD_DATE;
module.exports.BASE_VERSION = BASE_VERSION;

licenseBody += '\nVersion: ' + PACKAGE_VERSION;
licenseBody += '\nDate: ' + BUILD_DATE;

module.exports.create = function create(envArgs) {
  var config = {
    devtool: false,
    output: {
      library: 'Handsontable',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: path.resolve(__dirname, '../dist'),
    },
    resolve: {
      alias: {},
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader',
          }),
        },
        {
          test: [
            // Disable loading languages from numbro and moment into final bundle
            /numbro\/languages/,
            /moment\/locale/,
          ],
          loader: path.resolve(__dirname, 'loader/empty-loader.js'),
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [
            /node_modules/,
          ],
          options: {
            cacheDirectory: true,
          },
        },
      ]
    },
    plugins: [
      new ProgressBarPlugin({
        format: '  build [:bar] \u001b[32m:percent\u001b[0m (:elapsed seconds)',
        summary: false,
      }),
      // This helps ensure the builds are consistent if source code hasn't changed
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.BannerPlugin(licenseBody),
      new webpack.DefinePlugin({
        '__HOT_VERSION__': JSON.stringify(PACKAGE_VERSION),
        '__HOT_PACKAGE_NAME__': JSON.stringify(PACKAGE_NAME),
        '__HOT_BUILD_DATE__': JSON.stringify(BUILD_DATE),
        '__HOT_BASE_VERSION__': JSON.stringify(BASE_VERSION),
        '__ENV_ARGS__': JSON.stringify(envArgs),
      }),
    ],
    node: {
      global: false,
      process: false,
      Buffer: false,
      setImmediate: false,
    },
  };

  return [config];
}
