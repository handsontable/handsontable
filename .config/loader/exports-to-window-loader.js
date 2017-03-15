var loaderUtils = require('loader-utils');
var FOOTER = '/*** EXPORTS FROM exports-to-window-loader ***/\n';
var alreadyExported = {};

module.exports = function(content, sourceMap) {
	if (this.cacheable) {
    this.cacheable();
  }
	var query = loaderUtils.getOptions(this) || {};
	var exports = [];
	var keys = Object.keys(query);

  keys.forEach(function(key) {
    if (!alreadyExported[key]) {
      alreadyExported[key] = true;
      exports.push("window['" + key + "'] = require('" + query[key] + "');");
    }
  });

  if (exports.length) {
    content = content + '\n\n' + FOOTER + exports.join('\n');
  }

  return content;
}
