const { webcrypto } = require('crypto');

// Guarded on `subtle`, not on `crypto`: jsdom 20 and later define a `crypto` with
// `getRandomValues` only, and a guard on `crypto` alone left `crypto.subtle` (the sheet-password
// hash) undefined there. Jest 27's jsdom 16 has no `crypto` at all, so the whole object is installed.
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
} else if (!globalThis.crypto.subtle) {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: webcrypto.subtle,
    writable: false,
    configurable: true,
  });
}

const { CompressionStream, DecompressionStream } = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');

// Jest 27's node environment copies a fixed allow-list of Node globals into the sandbox, and the
// Web compression streams are not on it; its jsdom environment has neither them nor `TextEncoder`
// / `TextDecoder`. The native xlsx adapter deflates and inflates through the streams and encodes
// every part through the encoder, so each of the four is installed here when it is missing. Node
// 22 supports 'deflate-raw'. They are `writable` (and `configurable`) so a test can stub one by
// plain assignment and put it back, instead of redefining the property.
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
