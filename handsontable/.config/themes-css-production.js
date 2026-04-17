const rspack = require('@rspack/core');
const glob = require('glob');
const path = require('path');
const configFactory = require('./base');
const removeEmptyScripts = require('./plugin/rspack/remove-empty-scripts');
const { BROWSERS_LIST } = require('../../browser-targets.js');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  const entry = glob.sync('./src/themes/static/css/**/*.css').reduce((obj, el) => {
    obj[path.parse(el).name] = el;

    return obj;
  }, {});

  config.forEach(function (c) {
    c.mode = 'production';
    c.devtool = false;

    c.entry = entry;
    // Redirect stub JS files to a temp directory so they don't overwrite dist/ bundles
    c.output.path = path.resolve(__dirname, '../tmp_styles');
    c.output.filename = '[name].stub.js';

    c.module = {
      rules: [
        {
          test: /\.css$/,
          use: [
            { loader: rspack.CssExtractRspackPlugin.loader },
            { loader: 'css-loader' },
          ]
        }
      ],
    };

    c.optimization = {
      minimize: true,
      minimizer: [
        new rspack.LightningCssMinimizerRspackPlugin({
          minimizerOptions: {
            targets: BROWSERS_LIST.map(b => b.toLowerCase()),
          },
        }),
      ],
    };

    c.plugins.push(
      removeEmptyScripts(),
      new rspack.CssExtractRspackPlugin({
        filename: '../styles/[name].min.css',
      }),
    );
  });

  return config;
}
