/**
 * Config responsible for building minified Handsontable `dist/languages/` files.
 */
const path = require('path');
const configFactory = require('./languages-development');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OUTPUT_LANGUAGES_DIRECTORY = 'dist/languages';

module.exports.create = function create() {
  const configs = configFactory.create();

  // Add uglifyJs plugin for each configuration
  configs.forEach(function(config) {
    config.output.path = path.resolve(__dirname, '../', OUTPUT_LANGUAGES_DIRECTORY);
    config.output.filename = '[name].min.js';
    config.mode = 'production';
    config.optimization = {
      minimizer: [
        new UglifyJsPlugin({
          parallel: true,
          uglifyOptions: {
            compressor: {
              pure_getters: true,
              warnings: false,
            },
            mangle: {},
            output: {
              comments: /^!|@preserve|@license|@cc_on/i,
            },
          }
        }),
      ]
    };
  });

  return [].concat(configs);
};
