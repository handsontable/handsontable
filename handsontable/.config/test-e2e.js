/**
 * Config responsible for building End-to-End test files (bundled into `test/dist/`):
 *  - e2e.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const configFactory = require('./base');
const JasmineHtml = require('./plugin/jasmine-html');
const fsExtra = require('fs-extra');
const { getClosest }  = require('./helper/path');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.devtool = 'cheap-module-source-map';
    c.target = 'web';
    c.cache = true;
    c.output = {
      library: '__hot_tests__',
      libraryTarget: 'var',
      filename: '[name].entry.js',
      path: path.resolve(__dirname, '../test/dist'),
    };
    c.resolve.alias.handsontable = path.resolve(__dirname, '../src');

    c.module.rules.unshift({
      test: [
         // Disable loading css files from pikaday module
        /pikaday\/css/,
      ],
      loader: path.resolve(__dirname, 'loader/empty-loader.js'),
    });

    c.externals = [
      {
        window: 'window',
      },
    ];

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '../test/E2ERunner.html'),
        baseJasminePath: `${
          fsExtra.pathExistsSync('./node_modules/jasmine-core') ? '../' : '../../'
        }`,
        externalCssFiles: [
          'lib/normalize.css',
          ...((envArgs.HOT_THEME && envArgs.HOT_THEME !== 'classic') ? [
              '../styles/handsontable.css',
              `../styles/ht-theme-${envArgs.HOT_THEME}.css`,
              'helpers/common-themes.css',
            ] : [
              '../dist/handsontable.css',
              'helpers/common-classic.css',
            ]
          ),
          `${getClosest('../node_modules/@handsontable/pikaday', true)}/css/pikaday.css`,
        ],
        externalJsFiles: [
          'helpers/jasmine-progressbar-reporter.js',
          'helpers/jasmine-bridge-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          `${getClosest('../node_modules/numbro', true)}/dist/numbro.js`,
          `${getClosest('../node_modules/numbro', true)}/dist/languages.min.js`,
          `${getClosest('../node_modules/moment', true)}/moment.js`,
          `${getClosest('../node_modules/@handsontable/pikaday', true)}/pikaday.js`,
          `${getClosest('../node_modules/dompurify', true)}/dist/purify.js`,
          `../dist/handsontable.js`,
          `../dist/languages/all.js`,
        ],
      })
    );

    c.node = {
      global: true,
    }
  });

  return [].concat(config);
}
