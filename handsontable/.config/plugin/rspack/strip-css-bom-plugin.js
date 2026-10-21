const path = require('path');
const fs = require('fs');

/**
 * Strips a UTF-8 BOM from an emitted CSS asset.
 *
 * sass writes `@charset "UTF-8"` into the stylesheet because the themes contain a non-ASCII glyph.
 * From postcss 8.5.24 on, the minification chain turns that at-rule into a BOM instead, and it
 * lands after the preserved `/*!` license banner rather than at offset 0 — so neither the CSS
 * decoder (which strips only a leading BOM) nor Node's `utf8` read removes it. In that position it
 * is an ident code point in CSS, not whitespace, so it fuses with the selector that follows and
 * the first rule (`.ht-root-wrapper`) silently stops matching — in the stylesheet itself and in
 * the copy `css-to-js-export-plugin` inlines into the bundles.
 *
 * @param {object} options Plugin configuration.
 * @param {string} options.cssFilename - CSS asset filename (relative to output.path).
 * @returns {object} Rspack plugin instance.
 */
module.exports = function stripCssBomPlugin(options) {
  const { cssFilename } = options;

  return {
    apply(compiler) {
      compiler.hooks.afterEmit.tapAsync('StripCssBomPlugin', (compilation, callback) => {
        const cssPath = path.join(compilation.outputOptions.path, cssFilename);

        if (!fs.existsSync(cssPath)) {
          callback();

          return;
        }

        const css = fs.readFileSync(cssPath, 'utf8');
        const stripped = css.replace(/\uFEFF/g, '');

        if (stripped !== css) {
          fs.writeFileSync(cssPath, stripped);
        }

        callback();
      });
    }
  };
};
