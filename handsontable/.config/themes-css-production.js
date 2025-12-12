const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const glob = require('glob');
const path = require('path');
const configFactory = require('./base');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  const entry = glob.sync('./src/themes/css/**/*.css').reduce((obj, el) => {
    obj[path.parse(el).name] = el;

    return obj;
  }, {});

  config.forEach(function (c) {
    c.mode = 'production';
    c.devtool = false;

    c.entry = entry;

    c.module = {
      rules: [
        {
          test: /\.css$/,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
          ]
        }
      ],
    };

    c.optimization = {
      minimize: true,
      minimizer: [
        new CssMinimizerPlugin(),
      ],
    };

    c.plugins.push(
      new RemoveEmptyScriptsPlugin(),
      new MiniCssExtractPlugin({
        filename: '../styles/[name].min.css',
      }),
    );
  });

  return config;
}
