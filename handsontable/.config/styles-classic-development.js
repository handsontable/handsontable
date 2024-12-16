const path = require('path');
const configFactory = require('./base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const { getClosest } = require('./helper/path');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function (c) {
    c.devtool = false;

    c.entry = {
      handsontable: [
        './src/styles/classic/handsontable.css',
      ],
      'handsontable.full': [
        './src/styles/classic/handsontable.css',
        `${getClosest('node_modules/@handsontable/pikaday/')}css/pikaday.css`
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
