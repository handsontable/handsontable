const { webcrypto } = require('crypto');

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
}

const { CompressionStream, DecompressionStream } = require('node:stream/web');

// Jest 27's node environment copies a fixed allow-list of Node globals into the sandbox, and the
// Web compression streams are not on it. The native xlsx adapter deflates and inflates through
// them, so they are installed here the way `crypto` is above. Node 22 supports 'deflate-raw'.
[['CompressionStream', CompressionStream], ['DecompressionStream', DecompressionStream]].forEach(([name, value]) => {
  if (!globalThis[name]) {
    Object.defineProperty(globalThis, name, {
      value,
      writable: false,
      configurable: true,
    });
  }
});
