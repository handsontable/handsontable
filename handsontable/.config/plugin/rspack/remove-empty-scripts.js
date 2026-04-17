const fs = require('fs');
const path = require('path');

/**
 * Rspack plugin that removes empty JS files generated when CSS-only entries are compiled.
 * Replacement for webpack-remove-empty-scripts.
 *
 * @returns {object} Rspack plugin instance.
 */
module.exports = function removeEmptyScripts() {
  return {
    apply(compiler) {
      compiler.hooks.afterEmit.tap('RemoveEmptyScriptsPlugin', (compilation) => {
        const outputPath = compilation.outputOptions.path;

        Object.keys(compilation.assets).forEach((assetName) => {
          if (!assetName.endsWith('.js') && !assetName.endsWith('.mjs')) {
            return;
          }

          const filePath = path.join(outputPath, assetName);

          if (!fs.existsSync(filePath)) {
            return;
          }

          const content = fs.readFileSync(filePath, 'utf8');

          if (isEmptyScript(content)) {
            fs.unlinkSync(filePath);

            // Also remove source maps
            const mapPath = `${filePath}.map`;

            if (fs.existsSync(mapPath)) {
              fs.unlinkSync(mapPath);
            }
          }
        });
      });
    }
  };
};

/**
 * Detect if a JS file is "empty" -- only contains boilerplate from CSS extraction.
 *
 * @param {string} source The JS source code.
 * @returns {boolean} True if the script is effectively empty.
 */
function isEmptyScript(source) {
  return source.includes('// extracted by css-extract-rspack-plugin') ||
    source.includes('// extracted by mini-css-extract-plugin');
}
