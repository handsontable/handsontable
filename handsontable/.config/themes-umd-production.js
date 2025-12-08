/**
 * Config responsible for building Handsontable theme UMD modules (minified):
 *  - dist/themes/themeBuilder.min.js
 *  - dist/themes/mainTheme.min.js
 *  - dist/themes/horizonTheme.min.js
 *  - dist/themes/classicTheme.min.js
 *  - dist/themes/mainIcons.min.js
 *  - dist/themes/horizonIcons.min.js
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

