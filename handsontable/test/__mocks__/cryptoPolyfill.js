/**
 * Crypto polyfill for jsdom environments that lack globalThis.crypto.
 */
const { webcrypto } = require('crypto');

/**
 * Sets up the Web Crypto API polyfill for jsdom test environments.
 * Call this in test bootstrap files before Handsontable instances are created.
 */
function initCryptoPolyfill() {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      writable: false,
      configurable: true,
    });
  }
}

module.exports = {
  initCryptoPolyfill,
};
