'use strict';

/**
 * Config responsible for building Handsontable `dist/` files:
 *  - handsontable.js
 *  - handsontable.css
 *  - handsontable.full.js
 *  - handsontable.full.css
 */
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const configFactory = require('./base');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;

module.exports.create = function create(envArgs) {
  const configBase = configFactory.create(envArgs);
  const configFull = configFactory.create(envArgs);

  configBase.forEach(function(c) {
    c.output.filename = PACKAGE_FILENAME + '.js';

    c.devtool = 'cheap-module-source-map';
    // Exclude all external dependencies from 'base' bundle (handsontable.js and handsontable.css files)
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

  configFull.forEach(function(c) {
    c.output.filename = PACKAGE_FILENAME + '.full.js';
    c.module.rules.unshift({
      test: /numbro/,
      use: [
        {
          loader: path.resolve(__dirname, 'loader/exports-to-window-loader.js'),
          options: {
            numbro: 'numbro',
          }
        }
      ]
    });
    c.module.rules.unshift({
      test: /moment/,
      use: [
        {
          loader: path.resolve(__dirname, 'loader/exports-to-window-loader.js'),
          options: {
            moment: 'moment',
          }
        }
      ]
    });

    c.plugins.push(
      new ExtractTextPlugin(PACKAGE_FILENAME + '.full.css')
    );
  });

  return [].concat(configBase, configFull);
}
