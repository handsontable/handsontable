/* eslint-disable no-bitwise */

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

const CRC32_TABLE = (() => {
  const table = [];

  for (let i = 0; i < 256; i += 1) {
    let crc = i;

    for (let j = 0; j < 8; j += 1) {
      if ((crc & 1) === 1) {
        crc = 0xEDB88320 ^ (crc >>> 1);
      } else {
        crc >>>= 1;
      }
    }

    table[i] = crc >>> 0;
  }

  return table;
})();

/**
 * Write a 16-bit little-endian integer to a DataView.
 *
 * @param {DataView} view Data view.
 * @param {number} offset Byte offset.
 * @param {number} value Number to write.
 */
function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

/**
 * Write a 32-bit little-endian integer to a DataView.
 *
 * @param {DataView} view Data view.
 * @param {number} offset Byte offset.
 * @param {number} value Number to write.
 */
function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

/**
 * Encode a string to UTF-8 bytes.
 *
 * @param {string} value String to encode.
 * @returns {Uint8Array}
 */
function encodeString(value) {
  if (typeof TextEncoder !== 'function') {
    if (typeof Buffer === 'function') {
      return Uint8Array.from(Buffer.from(value, 'utf-8'));
    }

    const bytes = [];

    for (let i = 0; i < value.length; i += 1) {
      let codePoint = value.codePointAt(i);

      if (codePoint > 0xFFFF) {
        i += 1;
      }

      if (codePoint <= 0x7F) {
        bytes.push(codePoint);
      } else if (codePoint <= 0x7FF) {
        bytes.push(0xC0 | (codePoint >> 6));
        bytes.push(0x80 | (codePoint & 0x3F));
      } else if (codePoint <= 0xFFFF) {
        bytes.push(0xE0 | (codePoint >> 12));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
        bytes.push(0x80 | (codePoint & 0x3F));
      } else {
        codePoint -= 0x10000;
        bytes.push(0xF0 | ((codePoint >> 18) & 0x07));
        bytes.push(0x80 | ((codePoint >> 12) & 0x3F));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
        bytes.push(0x80 | (codePoint & 0x3F));
      }
    }

    return new Uint8Array(bytes);
  }

  return new TextEncoder().encode(value);
}

/**
 * Normalize input data to `Uint8Array`.
 *
 * @param {string|Uint8Array|ArrayBuffer} data Input data.
 * @returns {Uint8Array}
 */
function toUint8Array(data) {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  return encodeString(`${data}`);
}

/**
 * Calculate CRC32 for a byte array.
 *
 * @param {Uint8Array} data File bytes.
 * @returns {number}
 */
function getCrc32(data) {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xFF];
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Concatenate chunks into one byte array.
 *
 * @param {Uint8Array[]} chunks Byte chunks.
 * @param {number} totalLength Sum of all chunks lengths.
 * @returns {Uint8Array}
 */
function concatChunks(chunks, totalLength) {
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];

    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

/**
 * Build an uncompressed ZIP archive from provided entries.
 *
 * @param {{name: string, data: (string|Uint8Array|ArrayBuffer)}[]} entries ZIP entries.
 * @returns {Uint8Array}
 */
export function createZipArchive(entries) {
  const localParts = [];
  const centralDirectoryParts = [];
  let localOffset = 0;
  let localPartsLength = 0;
  let centralDirectoryLength = 0;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const fileNameBytes = encodeString(entry.name);
    const fileDataBytes = toUint8Array(entry.data);
    const crc32 = getCrc32(fileDataBytes);
    const localHeader = new Uint8Array(30 + fileNameBytes.length + fileDataBytes.length);
    const localHeaderView = new DataView(localHeader.buffer);

    writeUint32(localHeaderView, 0, LOCAL_FILE_HEADER_SIGNATURE);
    writeUint16(localHeaderView, 4, 20);
    writeUint16(localHeaderView, 6, 0);
    writeUint16(localHeaderView, 8, 0);
    writeUint16(localHeaderView, 10, 0);
    writeUint16(localHeaderView, 12, 0);
    writeUint32(localHeaderView, 14, crc32);
    writeUint32(localHeaderView, 18, fileDataBytes.length);
    writeUint32(localHeaderView, 22, fileDataBytes.length);
    writeUint16(localHeaderView, 26, fileNameBytes.length);
    writeUint16(localHeaderView, 28, 0);
    localHeader.set(fileNameBytes, 30);
    localHeader.set(fileDataBytes, 30 + fileNameBytes.length);
    localParts.push(localHeader);
    localPartsLength += localHeader.length;

    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    const centralHeaderView = new DataView(centralHeader.buffer);

    writeUint32(centralHeaderView, 0, CENTRAL_DIRECTORY_HEADER_SIGNATURE);
    writeUint16(centralHeaderView, 4, 20);
    writeUint16(centralHeaderView, 6, 20);
    writeUint16(centralHeaderView, 8, 0);
    writeUint16(centralHeaderView, 10, 0);
    writeUint16(centralHeaderView, 12, 0);
    writeUint16(centralHeaderView, 14, 0);
    writeUint32(centralHeaderView, 16, crc32);
    writeUint32(centralHeaderView, 20, fileDataBytes.length);
    writeUint32(centralHeaderView, 24, fileDataBytes.length);
    writeUint16(centralHeaderView, 28, fileNameBytes.length);
    writeUint16(centralHeaderView, 30, 0);
    writeUint16(centralHeaderView, 32, 0);
    writeUint16(centralHeaderView, 34, 0);
    writeUint16(centralHeaderView, 36, 0);
    writeUint32(centralHeaderView, 38, 0);
    writeUint32(centralHeaderView, 42, localOffset);
    centralHeader.set(fileNameBytes, 46);
    centralDirectoryParts.push(centralHeader);
    centralDirectoryLength += centralHeader.length;
    localOffset += localHeader.length;
  }

  const endOfCentralDirectory = new Uint8Array(22);
  const endOfCentralDirectoryView = new DataView(endOfCentralDirectory.buffer);

  writeUint32(endOfCentralDirectoryView, 0, END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  writeUint16(endOfCentralDirectoryView, 4, 0);
  writeUint16(endOfCentralDirectoryView, 6, 0);
  writeUint16(endOfCentralDirectoryView, 8, entries.length);
  writeUint16(endOfCentralDirectoryView, 10, entries.length);
  writeUint32(endOfCentralDirectoryView, 12, centralDirectoryLength);
  writeUint32(endOfCentralDirectoryView, 16, localPartsLength);
  writeUint16(endOfCentralDirectoryView, 20, 0);

  return concatChunks(
    [...localParts, ...centralDirectoryParts, endOfCentralDirectory],
    localPartsLength + centralDirectoryLength + endOfCentralDirectory.length,
  );
}
