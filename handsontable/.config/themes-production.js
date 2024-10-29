const configFactory = require('./themes-development');
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

    c.plugins = c.plugins.filter(plugin => !(plugin instanceof MiniCssExtractPlugin));
    c.plugins.push(
      new MiniCssExtractPlugin({
        filename: '../styles/ht-theme-[name].min.css',
      }),
    );
  });

  return config;
}
