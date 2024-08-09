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
      'ht-theme-main-light': [
        './src/styles/themes/main-light/icons/index.scss',
        './src/styles/themes/main-light/index.scss'
      ],
      'ht-theme-main-light-no-icons': './src/styles/themes/main-light/index.scss'
    };

    c.module = {
      rules: [
        {
          test: /\.scss$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            { loader: 'sass-loader' },
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
        filename: '../styles/[name].css',
      }),
    );
  });


  configProd.forEach(function (c) {
    c.devtool = false;

    c.mode = 'production';

    c.entry = {
      'ht-theme-main-light.min': [
        './src/styles/themes/main-light/icons/index.scss',
        './src/styles/themes/main-light/index.scss'
      ],
      'ht-theme-main-light-no-icons.min': './src/styles/themes/main-light/index.scss'
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
          test: /\.scss$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            { loader: 'sass-loader' },
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
        filename: '../styles/[name].css',
      }),
    );
  });

  return [].concat(configDev, configProd);
}
