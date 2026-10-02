const { webcrypto } = require('crypto');

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
}

const { CompressionStream, DecompressionStream } = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');

// Jest 27's node environment copies a fixed allow-list of Node globals into the sandbox, and the
// Web compression streams are not on it; its jsdom environment has neither them nor `TextEncoder`
// / `TextDecoder`. The native xlsx adapter deflates and inflates through the streams and encodes
// every part through the encoder, so all four are installed here the way `crypto` is above. Node 22
// supports 'deflate-raw'. They are `writable` (and `configurable`) so a test can stub one by plain
// assignment and put it back, instead of redefining the property.
[
  ['CompressionStream', CompressionStream],
  ['DecompressionStream', DecompressionStream],
  ['TextEncoder', TextEncoder],
  ['TextDecoder', TextDecoder],
].forEach(([name, value]) => {
  if (!globalThis[name]) {
    Object.defineProperty(globalThis, name, {
      value,
      writable: true,
      configurable: true,
    });
  }
});
