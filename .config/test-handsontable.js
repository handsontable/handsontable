'use strict';

/**
 * Config responsible for building End-to-End test files grabbed from Handsontable CE (bundled into `test/dist/`):
 *  - e2e.entry.js
 *  - helpers.entry.js
 */
const path = require('path');
const JasmineHtml = require('./plugin/jasmine-html');
const configFactory = require('./base');

module.exports.create = function create(envArgs) {
  var config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.devtool = 'cheap-module-source-map';
    c.target = 'web';
    c.output = {
      libraryTarget: 'var',
      libraryExport: 'default',
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
        baseJasminePath: '../',
        externalCssFiles: [
          'lib/normalize.css',
          '../dist/handsontable.css',
          'helpers/common.css',
        ],
        externalJsFiles: [
          'helpers/jasmine-bridge-reporter.js',
          'lib/jquery.min.js',
          'lib/jquery.simulate.js',
          '../node_modules/numbro/dist/numbro.js',
          '../node_modules/numbro/dist/languages.min.js',
          '../dist/moment/moment.js',
          '../dist/pikaday/pikaday.js',
          '../dist/hot-formula-parser/formula-parser.js',
          '../dist/handsontable.js',
          '../dist/languages/all.js',
        ],
      })
    );

    c.node.global = true;
  });

  return [].concat(config);
};
