/**
 * Config responsible for building Walkontable (bundled into `src/3rdparty/walkontable/dist/`):
 *  - walkontable.js
 */
const path = require('path');
const rspack = require('@rspack/core');
const compilationDoneMarker = require('./plugin/rspack/compilation-done-marker');
const { BROWSERS_LIST } = require('../../browser-targets.js');

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
          loader: 'builtin:swc-loader',
          exclude: [
            /node_modules/,
          ],
          options: {
            env: {
              targets: BROWSERS_LIST.join(', '),
            },
            jsc: {
              parser: {
                syntax: 'ecmascript',
              },
            },
          },
        },
        {
          test: /\.(scss|css)$/,
          use: [
            { loader: rspack.CssExtractRspackPlugin.loader },
            { loader: 'css-loader' },
            { loader: 'sass-loader'},
            { loader: path.resolve(__dirname, 'loader/sass-rtl-loader.js')}
          ]
        },
      ]
    },
    plugins: [
      new rspack.CssExtractRspackPlugin({ filename: 'walkontable.css' }),
      new rspack.DefinePlugin({
        'process.env.HOT_VERSION': JSON.stringify(process.env.HOT_VERSION),
        'process.env.HOT_BUILD_DATE': JSON.stringify(process.env.HOT_BUILD_DATE),
        'process.env.HOT_RELEASE_DATE': JSON.stringify(process.env.HOT_RELEASE_DATE),
        'process.env.HOT_FILENAME': JSON.stringify(process.env.HOT_FILENAME),
        'process.env.HOT_PACKAGE_NAME': JSON.stringify(process.env.HOT_PACKAGE_NAME),
        'process.env.JEST_WORKER_ID': JSON.stringify(''),
      }),
      compilationDoneMarker(),
    ],
  };
  return [].concat(config);
}
