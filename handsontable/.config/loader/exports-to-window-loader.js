const loaderUtils = require('loader-utils');
const FOOTER = '/*** EXPORTS FROM exports-to-window-loader ***/\n';
const alreadyExported = {};

module.exports = function(content, sourceMap) {
  if (this.cacheable) {
    this.cacheable();
  }

  const query = loaderUtils.getOptions(this) || {};
  const exports = [];
  const keys = Object.keys(query.globals);

  keys.forEach(function(key) {
    if (!alreadyExported[key]) {
      alreadyExported[key] = true;

      exports.push(`window['${key}'] = require('${query.globals[key]}')${(query.defaultExport ? '.default' : '')};`);
    }
  });

  if (exports.length) {
    content += `\n\n${FOOTER}${exports.join('\n')}`;
  }

  return content;
};
