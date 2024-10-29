const path = require('path');
const configFactory = require('./styles-legacy-development');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function (c) {
    c.mode = 'production';

    c.entry = {
      'handsontable.min': [
        './src/styles/legacy/handsontable.css',
      ],
      'handsontable.full.min': [
        './src/styles/legacy/handsontable.full.css',
      ],
    };

    c.optimization = {
      minimize: true,
      minimizer: [
        new CssMinimizerPlugin(),
      ],
    };
  });

  return config;
}
