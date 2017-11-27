'use strict';

/**
 * Config responsible for building minified Handsontable `dist/languages/` files.
 */
const path = require('path');
const webpack  = require('webpack');
const configFactory = require('./languages-development');
const OUTPUT_LANGUAGES_DIRECTORY = 'dist/languages';

module.exports.create = function create() {
  const configs = configFactory.create();

  // Add uglifyJs plugin for each configuration
  configs.forEach(function(config) {
    config.output.path = path.resolve(__dirname, '../', OUTPUT_LANGUAGES_DIRECTORY);
    config.output.filename = '[name].min.js';

    config.plugins = [
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          pure_getters: true,
          warnings: false,
          screw_ie8: true,
        },
        mangle: {
          screw_ie8: true,
        },
        output: {
          comments: /^!|@preserve|@license|@cc_on/i,
          screw_ie8: true,
        },
      })
    ];
  });

  return [].concat(configs);
};
