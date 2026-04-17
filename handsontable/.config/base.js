const path = require('path');
const rspack = require('@rspack/core');
const compilationDoneMarker = require('./plugin/rspack/compilation-done-marker');
const { BROWSERS_LIST } = require('../../browser-targets.js');
const { getLicenseBody } = require('./helper/license');

const licenseBody = getLicenseBody();

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
          test: [
            // Disable loading languages from numbro and moment into final bundle
            /numbro\/languages/,
            /moment\/locale/,
          ],
          loader: path.resolve(__dirname, 'loader/empty-loader.js'),
        },
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
                jsx: true,
              },
            },
          },
        },
      ]
    },
    plugins: [
      new rspack.BannerPlugin({ banner: licenseBody }),
      new rspack.DefinePlugin({
        '__ENV_ARGS__': JSON.stringify(envArgs),
        'process.env.HOT_VERSION': JSON.stringify(process.env.HOT_VERSION),
        'process.env.HOT_BUILD_DATE': JSON.stringify(process.env.HOT_BUILD_DATE),
        'process.env.HOT_RELEASE_DATE': JSON.stringify(process.env.HOT_RELEASE_DATE),
        'process.env.HOT_FILENAME': JSON.stringify(process.env.HOT_FILENAME),
        'process.env.HOT_PACKAGE_NAME': JSON.stringify(process.env.HOT_PACKAGE_NAME),
        'process.env.JEST_WORKER_ID': JSON.stringify(''),
      }),
      compilationDoneMarker(),
    ],
    node: false,
  };

  return [config];
}
