const path = require('path');
const cssToJsExportPlugin = require('./plugin/rspack/css-to-js-export-plugin');

/**
 * Adds cssToJsExportPlugin to each webpack config. Use in styles-development and styles-production
 * so that the emitted CSS is also exported as a JS module (handsontableStyles.js).
 *
 * @param {object[]} configs - Array of webpack config objects.
 * @param {object} options - Plugin options.
 * @param {string} options.cssFilename - CSS asset filename (relative to output.path).
 * @param {string} [options.outputJsPath] - Absolute path for the output JS file. Defaults to ../src/styles/handsontableStyles.js.
 * @param {string} [options.banner] - Comment to prepend to the JS file.
 */
function addCssToJsExport(configs, options) {
  const outputJsPath = options.outputJsPath ?? path.resolve(__dirname, '../src/styles/handsontableStyles.js');

  configs.forEach((c) => {
    const pluginInstance = new cssToJsExportPlugin({
      cssFilename: options.cssFilename,
      outputJsPath,
      banner: options.banner ?? '',
    });
    pluginInstance.__isCssToJsExport = true;
    c.plugins.push(pluginInstance);
  });
}

module.exports = addCssToJsExport;
