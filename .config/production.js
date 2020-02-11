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
        new CopyWebpackPlugin([
          { // hot-formula-parser
            from: {glob: 'node_modules/hot-formula-parser/LICENSE'}, to: 'hot-formula-parser', flatten: true
          },
          {
            from: {glob: 'node_modules/hot-formula-parser/dist/formula-parser.js'}, to: 'hot-formula-parser', flatten: true
          },
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
