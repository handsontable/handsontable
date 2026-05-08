/**
 * Crypto polyfill for jsdom environments that lack globalThis.crypto.
 * Call initCryptoPolyfill() in test bootstrap files before Handsontable instances are created.
 */

export function initCryptoPolyfill() {
  if (!globalThis.crypto) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webcrypto } = require('crypto');

    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      writable: false,
      configurable: true,
    });
  }
}
