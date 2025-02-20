const loaderUtils = require('loader-utils');
const FOOTER = '/*** EXPORTS FROM exports-to-window-loader-esm ***/\n';
const alreadyExported = {};

module.exports = function(content, sourceMap) {
  if (this.cacheable) {
    this.cacheable();
  }

  const query = loaderUtils.getOptions(this) || {};
  const moduleToExport = query.globals.moduleToExport;
  const moduleName = query.globals.moduleName;

  if (!alreadyExported[moduleName]) {
    alreadyExported[moduleName] = true;

    const exports = `
      import { ${moduleToExport} as moduleToExport } from '${moduleName}';

      window['${moduleToExport}'] = moduleToExport;
    `;
    content += `\n\n${FOOTER}${exports}`;
  }

  return content;
};
