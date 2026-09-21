/* eslint-disable no-bitwise -- CRC-32 is bit arithmetic by definition. */

/**
 * Lookup table for the reflected CRC-32 polynomial `0xEDB88320` used by ZIP.
 */
const CRC_TABLE = new Uint32Array(256);

for (let n = 0; n < 256; n++) {
  let c = n;

  for (let k = 0; k < 8; k++) {
    c = (c & 1) === 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  }

  CRC_TABLE[n] = c >>> 0;
}

/**
 * Computes the CRC-32 checksum of a byte array, as written into ZIP local and central headers.
 */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/* eslint-enable no-bitwise */
