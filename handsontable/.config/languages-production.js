/**
 * Config responsible for building minified Handsontable `dist/languages/` files.
 */
const path = require('path');
const rspack = require('@rspack/core');
const configFactory = require('./languages-development');
const OUTPUT_LANGUAGES_DIRECTORY = 'dist/languages';

module.exports.create = function create() {
  const configs = configFactory.create();

  // Enable minification for each configuration
  configs.forEach(function(config) {
    config.output.path = path.resolve(__dirname, '../', OUTPUT_LANGUAGES_DIRECTORY);
    config.output.filename = '[name].min.js';
    config.mode = 'production';
    config.optimization = {
      minimize: true,
      sideEffects: false,
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
  });

  return [].concat(configs);
};
