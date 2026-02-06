const configFactory = require('./base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  // Config for CSS extraction to handsontable/styles/
  config.forEach(function (c) {
    c.devtool = false;
    c.entry = {
      handsontable: './src/styles/handsontable.scss',
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
        filename: '../styles/handsontable.css',
      }),
    );
  });

  return config;
}

