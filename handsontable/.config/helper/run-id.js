const crypto = require('crypto');

// Must match the default in `rspack.config.js` so runs that omit `--theme`
// hash identically whether the caller is the rspack config or the Puppeteer
// script.
const DEFAULT_THEME = 'main';

/**
 * Derives a short, deterministic run ID from the active test pattern and theme.
 *
 * The ID is reused by the Rspack config to name the per-run bundle and HTML
 * runner, and by the Puppeteer script to know which HTML to open. Two runs
 * with the same pattern+theme share the same ID; runs with different inputs
 * get isolated artifacts and can execute in parallel without clobbering each
 * other.
 *
 * @param {object} args
 * @param {string} [args.testPathPattern] Value of `--testPathPattern`, if any.
 * @param {string} [args.theme] Value of `--theme`, if any.
 * @returns {string} 8-character hex hash.
 */
function computeRunId({ testPathPattern, theme } = {}) {
  const input = `${testPathPattern || ''}|${theme || DEFAULT_THEME}`;

  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 8);
}

/**
 * Reads `testPathPattern` and `theme` from the current npm env, normalizing
 * the lowercased variants npm may produce on some platforms.
 *
 * @returns {{testPathPattern: string, theme: string}}
 */
function readRunIdInputsFromEnv() {
  const testPathPattern =
    process.env.npm_config_testPathPattern || process.env.npm_config_testpathpattern || '';
  const theme = process.env.npm_config_theme || DEFAULT_THEME;

  return { testPathPattern, theme };
}

module.exports = {
  DEFAULT_THEME,
  computeRunId,
  readRunIdInputsFromEnv,
};
