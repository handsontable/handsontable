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

    const isDefault = query.globals.defaultExport;
    let exportCode;

    if (isDefault) {
      exportCode = `
      import __exportDefault__ from '${moduleName}';

      window['${moduleToExport}'] = __exportDefault__;
      `;
    } else {
      exportCode = `
      import { ${moduleToExport} as moduleToExport } from '${moduleName}';

      window['${moduleToExport}'] = moduleToExport;
      `;
    }

    content += `\n\n${FOOTER}${exportCode}`;
  }

  return content;
};
