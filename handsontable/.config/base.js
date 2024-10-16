const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const compilationDoneMarker = require('./plugin/webpack/compilation-done-marker');

let licenseBody = fs.readFileSync(path.resolve(__dirname, '../../LICENSE.txt'), 'utf8');

licenseBody += '\nVersion: ' + process.env.HOT_VERSION;
licenseBody += '\nRelease date: ' + process.env.HOT_RELEASE_DATE + ' (built at ' + process.env.HOT_BUILD_DATE + ')';

module.exports.create = function create(envArgs) {
  const config = {
    devtool: false,
    entry: [],
    performance: {
      maxEntrypointSize: 2000000,
      maxAssetSize: 2000000,
    },
    output: {
      globalObject: `typeof self !== 'undefined' ? self : this`,
      library: 'Handsontable',
      libraryExport: 'default',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, '../dist'),
      umdNamedDefine: true,
    },
    resolve: {
      alias: {},
    },
    mode: 'none',
    module: {
      rules: [
        {
          test: /\.(scss|css)$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader', options: { sourceMap: false } },
            { loader: 'sass-loader' },
          ],
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
            cacheDirectory: false, // Disable cache. Necessary for injected variables into source code via hot.config.js
          },
        },
      ]
    },
    plugins: [
      new webpack.BannerPlugin(licenseBody),
      new webpack.DefinePlugin({
        '__ENV_ARGS__': JSON.stringify(envArgs),
      }),
      compilationDoneMarker(),
    ],
    node: false,
  };

  return [config];
}
