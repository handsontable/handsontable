const configFactory = require('./base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const glob = require("glob");
const path = require('path');

module.exports.create = function create(envArgs) {
  const configDev = configFactory.create(envArgs);
  const configProd = configFactory.create(envArgs);

  const entry = glob.sync('./src/styles/themes/*.scss').reduce((obj, el) => {
    obj[path.parse(el).name] = el;

    return obj
  }, {});

  configDev.forEach(function (c) {
    c.devtool = false;

    c.entry = entry;

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

    c.plugins.push(
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin({
        filename: '../styles/ht-theme-[name].css',
      }),
    );
  });


  configProd.forEach(function (c) {
    c.devtool = false;

    c.mode = 'production';

    c.entry = entry;

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

    c.plugins.push(
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin({
        filename: '../styles/ht-theme-[name].min.css',
      }),
    );
  });

  return [].concat(configDev, configProd);
}
