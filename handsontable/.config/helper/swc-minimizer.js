const rspack = require('@rspack/core');

/**
 * Options for every SWC minifier that emits a file to `dist/`.
 *
 * `asciiOnly` keeps the output 7-bit. Without it, SWC decodes `\uXXXX` escapes above U+00FF into
 * raw UTF-8 characters, so a page served without a UTF-8 charset reads the bundle as windows-1252
 * and gets different strings and regular expressions. HyperFormula's lexer patterns in the full
 * bundle are one example: its sheet name, named expression, and function name patterns shrank,
 * and names with letters such as U+00F3 stopped parsing.
 */
const SWC_MINIFIER_OPTIONS = {
  format: {
    comments: false,
    asciiOnly: true,
  },
};

/**
 * Creates the SWC minimizer plugin used by the production (minified) build configs.
 *
 * @returns {rspack.SwcJsMinimizerRspackPlugin}
 */
function createSwcJsMinimizer() {
  return new rspack.SwcJsMinimizerRspackPlugin({
    extractComments: false,
    minimizerOptions: SWC_MINIFIER_OPTIONS,
  });
}

module.exports = { SWC_MINIFIER_OPTIONS, createSwcJsMinimizer };
