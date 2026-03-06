const { RawSource } = require('webpack-sources');

class CssCharsetCleanupPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('CssCharsetCleanupPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'CssCharsetCleanupPlugin',
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
        },
        (assets) => {
          Object.keys(assets).forEach((assetName) => {
            if (assetName.endsWith('.css')) {
              const source = assets[assetName].source();

              if (source.includes('@charset')) {
                // Find all @charset declarations
                const charsetRegex = /@charset\s+["'][^"']+["']\s*;[\r\n]*/g;
                const matches = source.match(charsetRegex);

                if (matches && matches.length > 0) {
                  const firstCharset = matches[0].replace(/[\r\n]+$/, '');

                  let processedSource = source.replace(charsetRegex, '');

                  // Add the first found `@charset` entry at the beginning of the file.
                  processedSource = `${firstCharset}\n${processedSource}`;

                  assets[assetName] = new RawSource(processedSource);
                }
              }
            }
          });
        }
      );
    });
  }
}

module.exports = CssCharsetCleanupPlugin;
