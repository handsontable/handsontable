/**
 * Config responsible for building Handsontable `dist/` minified files:
 *  - handsontable.min.js
 *  - handsontable.full.min.js
 */
const rspack = require('@rspack/core');
const configFactory = require('./development');
const { getClosest } = require('./helper/path');
const { getLicenseBody } = require('./helper/license');
const postBuildBanner = require('./plugin/rspack/post-build-banner');

const licenseBody = getLicenseBody();

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  // Enable minification for each configuration
  config.forEach(function(c) {
    const isFullBuild = /\.full\.js$/.test(c.output.filename);
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

    // Remove the dev BannerPlugin (runs before minimization, gets corrupted by SWC)
    // and add a post-build banner that writes to the file after all processing.
    c.plugins = c.plugins.filter(p => !(p instanceof rspack.BannerPlugin));
    c.plugins.push(postBuildBanner(licenseBody, /handsontable\.(full\.)?min\.js$/));

    if (isFullBuild) {
      c.plugins.push(
        new rspack.CopyRspackPlugin({
          patterns: [
            {
              from: `${getClosest('node_modules/hyperformula/')}dist/hyperformula.full.min.js`,
              to: 'hyperformula/[name][ext]',
              force: true,
            },
            {
              from: `${getClosest('node_modules/hyperformula/')}dist/languages/*.js`,
              to: 'hyperformula/languages/[name][ext]',
              force: true,
            },
            {
              from: `${getClosest('node_modules/hyperformula/')}LICENSE.txt`,
              to: 'hyperformula/[name][ext]',
              force: true,
            },
          ]
        })
      );
    }
  });

  return config;
}
