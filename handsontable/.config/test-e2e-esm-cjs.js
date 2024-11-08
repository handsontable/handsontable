const configFactory = require('./test-e2e');
const path = require('path');

module.exports.create = function create(envArgs) {
  const config = configFactory.create(envArgs);

  config.forEach(function(c) {
    c.resolve.alias.handsontable = path.resolve(__dirname, '../dist/handsontable.js');
  });

  return [].concat(config);
}