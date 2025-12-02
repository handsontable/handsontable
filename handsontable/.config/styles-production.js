const configFactory = require('./styles-development');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function (c) {
    c.mode = 'production';

    c.optimization = {
      minimize: true,
      minimizer: [
        new CssMinimizerPlugin(),
      ],
    };

    // Update the output filename to .min.css
    c.plugins = c.plugins.filter(plugin => !(plugin instanceof MiniCssExtractPlugin));
    c.plugins.push(
      new MiniCssExtractPlugin({
        filename: '../styles/handsontable.min.css',
      })
    );
  });

  return config;
}

