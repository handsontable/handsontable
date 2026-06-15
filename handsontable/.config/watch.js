/**
 * Config responsible for building Handsontable `dist/` files with enabled watching mode:
 *  - handsontable.js
 */
const path = require('path');
const configFactory = require('./base');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.cache = true;
    c.devtool = 'cheap-module-source-map';
    c.output.filename = PACKAGE_FILENAME + '.js';
    // Exclude all external dependencies from 'base' bundle (handsontable.js)
    c.externals = {};
  });

  return config;
}
