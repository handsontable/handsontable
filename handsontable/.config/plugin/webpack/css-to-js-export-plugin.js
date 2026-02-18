const path = require('path');
const fs = require('fs');

/**
 * After emit: reads the emitted CSS file and writes a JS file that exports the CSS as a string.
 * The CSS file is left in place (e.g. In styles/); the JS file is an extra output.
 *
 * @param {object} options Plugin configuration.
 * @param {string} options.cssFilename - CSS asset filename (relative to output.path).
 * @param {string} options.outputJsPath - Absolute path for the output JS file.
 * @param {string} [options.banner] - Comment to prepend to the JS file.
 * @returns {object} Webpack plugin instance.
 */
module.exports = function cssToJsExportPlugin(options) {
  const { cssFilename, outputJsPath, banner = '' } = options;

  return {
    apply(compiler) {
      compiler.hooks.afterEmit.tapAsync('CssToJsExportPlugin', (compilation, callback) => {
        const outputPath = compilation.outputOptions.path;
        const cssPath = path.join(outputPath, cssFilename);

        if (!fs.existsSync(cssPath)) {
          callback();

          return;
        }

        const css = fs.readFileSync(cssPath, 'utf8');
        const jsContent = [
          '/* eslint-disable max-len, quotes */\n',
          banner ? `${banner}\n\n` : '',
          `export default ${JSON.stringify(css)};\n`
        ].join('');

        fs.writeFileSync(outputJsPath, jsContent);

        callback();
      });
    }
  };
};
