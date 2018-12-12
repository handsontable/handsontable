'use strict';

/**
 * Config responsible for building unit test files (bundled into `test/dist/`):
 *  - unit.entry.js
 *  - helpers.entry.js
 */
const configFactory = require('./base');
const JasmineHtml = require('./plugin/jasmine-html');
const path = require('path');
const webpack = require('webpack');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.devtool = 'cheap-module-source-map';
    c.target = 'web';
    c.output = {
      libraryTarget: 'var',
      libraryExport: 'default',
      filename: '[name].entry.js',
      path: path.resolve(__dirname, '../test/dist'),
    };
    c.resolve.alias['handsontable-pro'] = path.resolve(__dirname, '../src');

    c.module.rules.unshift({
      test: [/\.css$/,],
      loader: path.resolve(__dirname, 'loader/empty-loader.js'),
    });

    c.externals = [
      {
        window: 'window',
      },
    ];

    c.plugins.push(
      new JasmineHtml({
        filename: path.resolve(__dirname, '../test/UnitRunner.html'),
        baseJasminePath: '../',
        externalCssFiles: [],
        externalJsFiles: [],
      })
    );
  });

  return [].concat(config);
}
