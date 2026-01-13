/**
 * Config responsible for building Handsontable theme UMD modules (minified):
 *  - dist/themes/*.min.js (theme files)
 *  - dist/themes/static/variables/*.min.js (variable files)
 */
const TerserPlugin = require('terser-webpack-plugin');
const configFactory = require('./themes-umd-development');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  // Enable minification for each configuration
  config.forEach(function(c) {
    c.devtool = false;
    c.output.filename = c.output.filename.replace(/\.js$/, '.min.js');

    c.mode = 'production';
    c.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    };
  });

  return config;
}

