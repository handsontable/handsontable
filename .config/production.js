/**
 * Config responsible for building Handsontable `dist/` minified files:
 *  - handsontable.min.js
 *  - handsontable.min.css
 *  - handsontable.full.min.js
 *  - handsontable.full.min.css
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
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

    c.optimization = {
      minimize: true,
    };
    // Remove all 'MiniCssExtractPlugin' instances
    c.plugins = c.plugins.filter(function(plugin) {
      return !(plugin instanceof MiniCssExtractPlugin);
    });

    c.plugins.push(
      new MiniCssExtractPlugin({
          filename: `${PACKAGE_FILENAME}${isFullBuild ? '.full' : ''}.min.css`,
      }
        ),
      new OptimizeCssAssetsPlugin({
        assetNameRegExp: isFullBuild ? /\.full\.min\.css$/ : /\.min\.css$/,
        cssProcessorOptions: { zindex: false },
      })
    );

    if (isFullBuild) {
      c.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            { // moment
              from: 'node_modules/moment/@(moment.js|LICENSE)',
              to: 'moment',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/moment/locale/*.js',
              to: 'moment/locale',
              flatten: true,
              force: true,
            },
            { // numbro
              from: 'node_modules/numbro/@(LICENSE-Numeraljs|LICENSE)',
              to: 'numbro',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/numbro/dist/@(numbro.js|languages.min.js)',
              to: 'numbro',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/numbro/dist/languages/*.js',
              to: 'numbro/languages',
              flatten: true,
              force: true,
            },
            { // pikaday
              from: 'node_modules/pikaday/@(LICENSE|pikaday.js)',
              to: 'pikaday',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/pikaday/css/pikaday.css',
              to: 'pikaday',
              flatten: true,
              force: true,
            },
            { // dompurify
              from: 'node_modules/dompurify/@(LICENSE)',
              to: 'dompurify',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/dompurify/dist/@(purify.js|purify.js.map)',
              to: 'dompurify',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/hyperformula/dist/hyperformula.full.min.js',
              to: 'hyperformula',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/hyperformula/dist/languages/*.js',
              to: 'hyperformula/languages',
              flatten: true,
              force: true,
            },
            {
              from: 'node_modules/hyperformula/LICENSE.txt',
              to: 'hyperformula',
              flatten: true,
              force: true,
            },
          ]
        })
      );
    }
  });

  return config;
}
