const { RawSource } = require('webpack-sources');
const fs = require('fs');
const path = require('path');

class InjectCssPlugin {
  constructor(options = {}) {
    this.cssPath = options.cssPath;
    this.id = options.id || 'handsontable-styles';
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('InjectCssPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'InjectCssPlugin',
          // Use a later stage to ensure CSS files are written first
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE
        },
        (assets) => {
          // Only process JavaScript files
          Object.keys(assets).forEach((assetName) => {
            if (assetName.endsWith('.js')) {
              const cssPath = this.cssPath;

              // Check if CSS file exists
              let actualCssPath = cssPath;

              if (!fs.existsSync(cssPath)) {
                // Try non-minified version as fallback
                const fallbackPath = cssPath.replace('.min.css', '.css');

                if (fs.existsSync(fallbackPath)) {
                  actualCssPath = fallbackPath;
                }
              }

              this.injectCss(assets, assetName, actualCssPath);
            }
          });
        }
      );
    });
  }

  injectCss(assets, assetName, cssPath) {
    // Read CSS content
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Escape CSS content for JavaScript string
    const escapedCss = cssContent
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // Create injection code
    const injectionCode = `
(function() {
  if (typeof document !== 'undefined') {
    var styleId = '${this.id}';
    var existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      var style = document.createElement('style');
      style.id = styleId;
      style.type = 'text/css';
      style.textContent = \`${escapedCss}\`;
      
      var head = document.head || document.getElementsByTagName('head')[0];
      if (head) {
        head.appendChild(style);
      }
    }
  }
})();
`;

    // Get current source
    const currentSource = assets[assetName].source();

    // Prepend injection code
    const newSource = injectionCode + currentSource;

    assets[assetName] = new RawSource(newSource);
  }
}

module.exports = InjectCssPlugin;

