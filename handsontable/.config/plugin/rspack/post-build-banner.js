const fs = require('fs');
const path = require('path');

/**
 * Rspack plugin that prepends a license banner to emitted JS files AFTER all processing
 * (including minification). This is needed because Rspack's BannerPlugin runs at the
 * ADDITIONS stage which is BEFORE the OPTIMIZE_SIZE stage where minimizers run,
 * causing the banner to be corrupted by the SWC minifier.
 *
 * Only applies the banner to files matching the provided test pattern, so third-party
 * files copied by CopyRspackPlugin are not affected.
 *
 * @param {string} bannerText The license text (will be wrapped in a comment block).
 * @param {RegExp} test Pattern to match filenames that should receive the banner.
 * @returns {object} Rspack plugin instance.
 */
module.exports = function postBuildBanner(bannerText, test) {
  const comment = `/*!\n * ${bannerText.replace(/\n/g, '\n * ')}\n */\n`;

  return {
    apply(compiler) {
      compiler.hooks.afterEmit.tap('PostBuildBannerPlugin', (compilation) => {
        const outputPath = compilation.outputOptions.path;

        Object.keys(compilation.assets).forEach((assetName) => {
          if (!assetName.endsWith('.js')) {
            return;
          }

          if (test && !test.test(assetName)) {
            return;
          }

          const filePath = path.join(outputPath, assetName);

          if (!fs.existsSync(filePath)) {
            return;
          }

          fs.writeFileSync(filePath, comment + fs.readFileSync(filePath, 'utf8'));
        });
      });
    }
  };
};
