/**
 * Config responsible for building Handsontable `dist/` minified files:
 *  - handsontable.min.js
 *  - handsontable.min.css
 *  - handsontable.full.min.js
 *  - handsontable.full.min.css
 */
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var path = require('path');
var webpack = require('webpack');
var configFactory = require('./development');

var env = process.env.NODE_ENV;
var PACKAGE_NAME = configFactory.PACKAGE_NAME;

module.exports.PACKAGE_NAME = PACKAGE_NAME;

module.exports.create = function create() {
  var config = configFactory.create();

  // Add uglifyJs plugin for each configuration
  config.forEach(function(c) {
    var isFullBuild = /\.full\.js$/.test(c.output.filename);

    c.devtool = false;
    c.output.filename = c.output.filename.replace(/\.js$/, '.min.js');

    // Remove all 'ExtractTextPlugin' instances
    c.plugins = c.plugins.filter(function(plugin) {
      return !(plugin instanceof ExtractTextPlugin);
    });

    c.resolveLoader = {
      alias: {
        'exports-to-window-loader': path.join(__dirname, './loader/exports-to-window-loader.js'),
      },
    };

    c.module.rules.unshift({
      test: /numbro/,
      use: [
        {
          loader: 'exports-to-window-loader',
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
          loader: 'exports-to-window-loader',
          options: {
            moment: 'moment',
          }
        }
      ]
    });

    c.plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
          screw_ie8: true,
        },
        mangle: {
          screw_ie8: true,
        },
        output: {
          comments: /^!|@preserve|@license|@cc_on/i,
          screw_ie8: true,
        },
      }),
      new ExtractTextPlugin(PACKAGE_NAME + (isFullBuild ? '.full' : '') + '.min.css'),
      new OptimizeCssAssetsPlugin({
        assetNameRegExp: isFullBuild ? /\.full\.min\.css$/ : /\.min\.css$/,
      })
    );
  });

  return config;
}
