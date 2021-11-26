/**
 * Config responsible for building Walkontable (bundled into `src/3rdparty/walkontable/dist/`):
 *  - walkontable.js
 */
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const wotPath = path.resolve(__dirname, '../src/3rdparty/walkontable');

module.exports.create = function create() {
  const config = {
    devtool: 'cheap-module-source-map',
    mode: 'none',
    output: {
      filename: 'walkontable.js',
      globalObject: `typeof self !== 'undefined' ? self : this`,
      library: 'Walkontable',
      libraryTarget: 'var',
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
        },
        {
          test: /\.(scss|css)$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            { loader: 'sass-loader'},
            { loader: path.resolve(__dirname, 'loader/sass-rtl-loader.js')}
          ]
        },
      ]
    },
    plugins: [
      // This helps ensure the builds are consistent if source code hasn't changed
      new webpack.optimize.OccurrenceOrderPlugin(),
      new MiniCssExtractPlugin({ filename: `walkontable.css` }),
    ],
  };
  return [].concat(config);
}
