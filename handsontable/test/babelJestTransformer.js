/**
 * babel-jest with a cache key that follows the environment variables the source inlines.
 *
 * `babel.config.js` runs `transform-inline-environment-variables`, so `process.env.HOT_VERSION`
 * and `process.env.HOT_RELEASE_DATE` are replaced by their values at transform time. babel-jest's
 * own cache key covers the source, the Babel config, `NODE_ENV` and `BABEL_ENV`, and nothing else,
 * so a transform cached under one value was reused under another: the license-message specs
 * failed on `installed version undefined` against a fresh clone's `18.1.0`, while `--no-cache`
 * passed. The key now mixes in the inlined variables. `HOT_BUILD_DATE` is deliberately left out:
 * `hot.config.js` stamps it with the current time on every run, and keying on it would transform
 * every file on every run for a value no spec asserts.
 */
const { createHash } = require('node:crypto');
const babelJest = require('babel-jest');

const INLINED_ENV_KEYS = ['HOT_VERSION', 'HOT_RELEASE_DATE', 'HOT_PACKAGE_NAME', 'HOT_FILENAME'];
const transformer = (babelJest.default ?? babelJest).createTransformer();

/**
 * Serializes the inlined variables, so two environments that differ in any of them get two keys.
 *
 * @returns {string}
 */
function inlinedEnvFingerprint() {
  return INLINED_ENV_KEYS.map(name => `${name}=${process.env[name] ?? ''}`).join('\n');
}

module.exports = {
  ...transformer,
  INLINED_ENV_KEYS,
  getCacheKey(...args) {
    return createHash('sha1')
      .update(transformer.getCacheKey(...args))
      .update('\n')
      .update(inlinedEnvFingerprint())
      .digest('hex');
  },
};
