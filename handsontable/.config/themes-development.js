const configFactory = require('./base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const glob = require('glob');
const path = require('path');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  const entry = glob.sync('./src/styles/themes/*.scss').reduce((obj, el) => {
    obj[path.parse(el).name] = el;

    return obj
  }, {});

  config.forEach(function (c) {
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

  return config;
}
