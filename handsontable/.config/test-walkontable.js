/**
 * Config responsible for building Walkontable test files (bundled into `src/3rdparty/walkontable/test/dist/`):
 *  - specs.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const rspack = require('@rspack/core');
const JasmineHtml = require('./plugin/jasmine-html');
const { BROWSERS_LIST } = require('../../browser-targets.js');
const compilationDoneMarker = require('./plugin/rspack/compilation-done-marker');

const wotPath = path.resolve(__dirname, '../src/3rdparty/walkontable');

module.exports.create = function create(envArgs) {
  const config = {
    target: 'web',
    mode: 'none',
    devtool: 'cheap-module-source-map',
    optimization: {
      sideEffects: false,
    },
    output: {
      filename: '[name].entry.js',
      globalObject: `typeof self !== 'undefined' ? self : this`,
      library: '__wot_tests__',
      libraryTarget: 'var',
      path: path.resolve(wotPath, 'test/dist'),
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
        }
      ]
    },
    externals: [
      {
        window: 'window',
      },
    ],
    plugins: [
      new JasmineHtml({
        filename: path.resolve(wotPath, 'test/SpecRunner.html'),
        baseJasminePath: '../../../../../',
        externalCssFiles: [
          '../dist/walkontable.css',
          '../css/walkontable.test.css',
        ],
        externalJsFiles: [
          'helpers/jasmine-bridge-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          '../dist/walkontable.js',
        ],
      }),
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
  };

  return [].concat(config);
}
