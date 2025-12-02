const path = require('path');
const configFactory = require('./base');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const SCSSToESModulePlugin = require('./plugin/webpack/scss-to-es-module-plugin');

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
      // Plugin to write simple ES module file
      // This compiles SCSS directly and writes a simple ES module without webpack wrapper
      new SCSSToESModulePlugin({
        scssPath: path.resolve(__dirname, '../src/styles/handsontable.scss'),
        outputPath: path.resolve(__dirname, '../src/themes'),
        outputFilename: 'styles.js',
      })
    );
  });

  return config;
}

