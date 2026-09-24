const rspack = require('@rspack/core');

const PLUGIN_NAME = 'AssertAsciiOutputPlugin';

/**
 * Fails the build when an emitted script contains a byte above 0x7F.
 *
 * A page served without a UTF-8 charset decodes a script as windows-1252, so a raw UTF-8 byte in
 * a bundle changes the strings and regular expressions it holds (DEV-111). `createSwcJsMinimizer()`
 * sets `asciiOnly`, but that covers only the minimizer it builds: a tagged template (which
 * `asciiOnly` cannot escape), a raw character coming in from a dependency, or a config that falls
 * back to Rspack's default minimizer would all ship silently. This check runs on the final output
 * instead, at the `REPORT` stage, after minification and after copied assets are added.
 *
 * @param {object} [options] Plugin configuration.
 * @param {RegExp} [options.test=/\.js$/] Which asset names to check.
 * @returns {object} Rspack plugin instance.
 */
module.exports = function assertAsciiOutput({ test = /\.js$/ } = {}) {
  return {
    name: PLUGIN_NAME,
    apply(compiler) {
      compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
        compilation.hooks.processAssets.tap({
          name: PLUGIN_NAME,
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
        }, (assets) => {
          Object.keys(assets).filter(name => test.test(name)).forEach((name) => {
            const buffer = compilation.getAsset(name).source.buffer();
            const offset = buffer.findIndex(byte => byte > 0x7F);

            if (offset !== -1) {
              const context = buffer.subarray(Math.max(0, offset - 60), offset + 20).toString('utf8');

              compilation.errors.push(new rspack.WebpackError(
                `${name} contains a non-ASCII byte at offset ${offset}, near: ${JSON.stringify(context)}. ` +
                'Pages that are not served as UTF-8 decode it wrongly. See the Build section of ' +
                'handsontable/AGENTS.md.'
              ));
            }
          });
        });
      });
    },
  };
};

module.exports.PLUGIN_NAME = PLUGIN_NAME;
