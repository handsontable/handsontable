/**
 * Config responsible for building Handsontable theme UMD modules (minified):
 *  - dist/themes/*.min.js (theme files)
 *  - dist/themes/static/variables/*.min.js (variable files)
 */
const rspack = require('@rspack/core');
const configFactory = require('./themes-umd-development');
const { getLicenseBody } = require('./helper/license');
const postBuildBanner = require('./plugin/rspack/post-build-banner');

const licenseBody = getLicenseBody();

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
        new rspack.SwcJsMinimizerRspackPlugin({
          extractComments: false,
          minimizerOptions: {
            format: {
              comments: false,
            },
          },
        }),
      ],
    };

    // Remove dev BannerPlugin (runs before minimization, gets corrupted by SWC)
    // and add a post-build banner that writes after all processing.
    c.plugins = c.plugins.filter(p => !(p instanceof rspack.BannerPlugin));
    c.plugins.push(postBuildBanner(licenseBody, /\.min\.js$/));
  });

  return config;
}
