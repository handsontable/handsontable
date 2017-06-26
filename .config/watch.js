'use strict';

/**
 * Config responsible for building Handsontable `dist/` files with enabled watching mode:
 *  - handsontable.js
 *  - handsontable.css
 */
var path = require('path');
var webpack = require('webpack');
var configFactory = require('./base');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var env = process.env.NODE_ENV;
var PACKAGE_NAME = configFactory.PACKAGE_NAME;

module.exports.PACKAGE_NAME = PACKAGE_NAME;

module.exports.create = function create(envArgs) {
  var config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.devtool = '#cheap-module-eval-source-map';
    c.output.filename = PACKAGE_NAME + '.js';
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
      new ExtractTextPlugin(PACKAGE_NAME + '.css')
    );
  });

  return config;
}
