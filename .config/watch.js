'use strict';

/**
 * Config responsible for building Handsontable `dist/` files with enabled watching mode:
 *  - handsontable.js
 *  - handsontable.css
 */
const configFactory = require('./base');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.devtool = 'source-map';
    c.output.filename = PACKAGE_FILENAME + '.js';
    // Exclude all external dependencies from 'base' bundle (handsontable.js and handsontable.css)
    c.externals = {
      numbro: {
        root: 'numbro',
        commonjs2: 'numbro',
        commonjs: 'numbro',
        amd: 'numbro',
      },
      moment: {
        root: 'moment',
        commonjs2: 'moment',
        commonjs: 'moment',
        amd: 'moment',
      },
      pikaday: {
        root: 'Pikaday',
        commonjs2: 'pikaday',
        commonjs: 'pikaday',
        amd: 'pikaday',
      },
      'hot-formula-parser': {
        root: 'formulaParser',
        commonjs2: 'hot-formula-parser',
        commonjs: 'hot-formula-parser',
        amd: 'hot-formula-parser',
      }
    };
    c.module.rules.unshift({
      test: [
         // Disable loading css files from pikaday module
        /pikaday\/css/,
      ],
      loader: path.resolve(__dirname, 'loader/empty-loader.js'),
    });
    c.plugins.push(
      new ExtractTextPlugin(PACKAGE_FILENAME + '.css')
    );
  });

  return config;
}
