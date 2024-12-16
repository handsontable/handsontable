const configFactory = require('./styles-classic-development');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { getClosest } = require('./helper/path');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function (c) {
    c.mode = 'production';

    c.entry = {
      'handsontable.min': [
        './src/styles/classic/handsontable.css',
      ],
      'handsontable.full.min': [
        './src/styles/classic/handsontable.css',
        `${getClosest('node_modules/@handsontable/pikaday/')}css/pikaday.css`
      ]
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
