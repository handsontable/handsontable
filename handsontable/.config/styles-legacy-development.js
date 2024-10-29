const path = require('path');
const configFactory = require('./base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function (c) {
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

  return config;
}
