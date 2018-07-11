'use strict';

/**
 * Config responsible for building Handsontable `dist/` minified files:
 *  - handsontable.min.js
 *  - handsontable.min.css
 *  - handsontable.full.min.js
 *  - handsontable.full.min.css
 */
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const configFactory = require('./development');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  // Add uglifyJs plugin for each configuration
  config.forEach(function(c) {
    const isFullBuild = /\.full\.js$/.test(c.output.filename);

    c.devtool = false;
    c.output.filename = c.output.filename.replace(/\.js$/, '.min.js');

    // Remove all 'ExtractTextPlugin' instances
    c.plugins = c.plugins.filter(function(plugin) {
      return !(plugin instanceof ExtractTextPlugin);
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
      new ExtractTextPlugin(PACKAGE_FILENAME + (isFullBuild ? '.full' : '') + '.min.css'),
      new OptimizeCssAssetsPlugin({
        assetNameRegExp: isFullBuild ? /\.full\.min\.css$/ : /\.min\.css$/,
        cssProcessorOptions: { zindex: false },
      })
    );

    if (isFullBuild) {
      c.plugins.push(
        new CopyWebpackPlugin([
          { // moment
            from: {glob: 'node_modules/moment/@(moment.js|LICENSE)'}, to: 'moment', flatten: true
          },
          {
            from: {glob: 'node_modules/moment/locale/*.js'}, to: 'moment/locale', flatten: true
          },
          { // numbro
            from: {glob: 'node_modules/numbro/@(LICENSE-Numeraljs|LICENSE)'}, to: 'numbro', flatten: true
          },
          {
            from: {glob: 'node_modules/numbro/dist/@(numbro.js|languages.min.js)'}, to: 'numbro', flatten: true
          },
          {
            from: {glob: 'node_modules/numbro/dist/languages/*.js'}, to: 'numbro/languages', flatten: true
          },
          { // pikaday
            from: {glob: 'node_modules/pikaday/@(LICENSE|pikaday.js)'}, to: 'pikaday', flatten: true
          },
          {
            from: {glob: 'node_modules/pikaday/css/pikaday.css'}, to: 'pikaday', flatten: true
          },
        ])
      );
    }
  });

  return config;
}
