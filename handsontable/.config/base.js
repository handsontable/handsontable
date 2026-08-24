const path = require('path');
const rspack = require('@rspack/core');
const compilationDoneMarker = require('./plugin/rspack/compilation-done-marker');
const { BROWSERS_LIST } = require('../../browser-targets.js');
const { getLicenseBody } = require('./helper/license');

const licenseBody = getLicenseBody();

module.exports.create = function create(envArgs) {
  const config = {
    // Keep rspack's AMD dependency parsing ON (webpack's default; rspack
    // defaults it to `false`). Without it, a vendored dependency's UMD wrapper
    // (regexp-to-ast inside the full bundle) survives verbatim and calls the
    // host page's global `define` when an AMD loader (RequireJS, SharePoint)
    // is present, leaving its exports empty and crashing the bundle at load
    // time with `RegExpParser is not a constructor` (DEV-2502).
    amd: {},
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
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    mode: 'none',
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
                jsx: true,
              },
            },
          },
        },
        {
          test: /\.(ts|tsx)$/,
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
                syntax: 'typescript',
                tsx: true,
                decorators: true,
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
        'process.env.HOT_PACKAGE_NAME': JSON.stringify(process.env.HOT_PACKAGE_NAME),
        'process.env.HOT_FILENAME': JSON.stringify(process.env.HOT_FILENAME),
        'process.env.JEST_WORKER_ID': JSON.stringify(''),
      }),
      compilationDoneMarker(),
    ],
    node: false,
  };

  return [config];
}
