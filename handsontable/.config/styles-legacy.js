const path = require('path');
const configFactory = require('./base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports.create = function create(envArgs) {
  const configDev = configFactory.create(envArgs);
  const configProd = configFactory.create(envArgs);

  configDev.forEach(function (c) {
    c.devtool = false;

    c.entry = {
      handsontable: [
        './src/styles/legacy/handsontable.css',
      ],
      'handsontable.full': [
        './src/styles/legacy/handsontable.full.css',
      ]
    };

    c.module = {
      rules: [
        {
          test: /\.css$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            { loader: path.resolve(__dirname, 'loader/sass-rtl-loader.js') }
          ]
        }
      ],
    };

    // Remove all 'MiniCssExtractPlugin' instances
    c.plugins = c.plugins.filter(function (plugin) {
      return !(plugin instanceof MiniCssExtractPlugin);
    });

    c.plugins.push(
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
    );
  });

  configProd.forEach(function (c) {
    c.devtool = false;

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

    c.module = {
      rules: [
        {
          test: /\.css$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            { loader: path.resolve(__dirname, 'loader/sass-rtl-loader.js') }
          ]
        }
      ],
    };

    // Remove all 'MiniCssExtractPlugin' instances
    c.plugins = c.plugins.filter(function (plugin) {
      return !(plugin instanceof MiniCssExtractPlugin);
    });

    c.plugins.push(
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
    );
  });

  return [].concat(configDev, configProd);
}
