/**
 * Minimal ZIP archive builder that produces uncompressed (STORE method) ZIP files.
 *
 * Generates valid ZIP archives without external compression libraries.
 * Excel and other OOXML consumers accept uncompressed ZIP archives.
 *
 * @private
 */
export class ZipBuilder {
  #files = [];

  /**
   * Add a file to the archive.
   *
   * @param {string} path The file path within the archive.
   * @param {string} content The UTF-8 text content of the file.
   */
  addFile(path, content) {
    const encoder = new TextEncoder();

    this.#files.push({
      path,
      data: encoder.encode(content),
    });
  }

  /**
   * Build the ZIP archive and return it as a Uint8Array.
   *
   * @returns {Uint8Array}
   */
  build() {
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    this.#files.forEach((file) => {
      const pathBytes = new TextEncoder().encode(file.path);
      const localHeader = this.#buildLocalFileHeader(pathBytes, file.data);

      localHeaders.push(localHeader);
      localHeaders.push(pathBytes);
      localHeaders.push(file.data);

      const centralHeader = this.#buildCentralDirectoryHeader(pathBytes, file.data, offset);

      centralHeaders.push(centralHeader);
      centralHeaders.push(pathBytes);

      offset += localHeader.byteLength + pathBytes.byteLength + file.data.byteLength;
    });

    const centralDirOffset = offset;
    let centralDirSize = 0;

    centralHeaders.forEach((header) => {
      centralDirSize += header.byteLength;
    });

    const endRecord = this.#buildEndOfCentralDirectory(
      this.#files.length,
      centralDirSize,
      centralDirOffset
    );

    const totalSize = offset + centralDirSize + endRecord.byteLength;
    const result = new Uint8Array(totalSize);
    let pos = 0;

    localHeaders.forEach((chunk) => {
      result.set(chunk, pos);
      pos += chunk.byteLength;
    });

    centralHeaders.forEach((chunk) => {
      result.set(chunk, pos);
      pos += chunk.byteLength;
    });

    result.set(endRecord, pos);

    return result;
  }

  /**
   * Compute CRC-32 checksum for the given data.
   *
   * @param {Uint8Array} data The data to compute the checksum for.
   * @returns {number}
   */
  /* eslint-disable no-bitwise */
  #crc32(data) {
    let crc = 0xFFFFFFFF;

    for (let i = 0; i < data.length; i += 1) {
      crc ^= data[i];

      for (let j = 0; j < 8; j += 1) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc >>>= 1;
        }
      }
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  /* eslint-enable no-bitwise */

  /**
   * Build a local file header.
   *
   * @param {Uint8Array} pathBytes The file name as bytes.
   * @param {Uint8Array} data The file data.
   * @returns {Uint8Array}
   */
  #buildLocalFileHeader(pathBytes, data) {
    const header = new Uint8Array(30);
    const view = new DataView(header.buffer);
    const crc = this.#crc32(data);

    view.setUint32(0, 0x04034B50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed to extract
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (STORE)
    view.setUint16(10, 0, true); // Last mod file time
    view.setUint16(12, 0, true); // Last mod file date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, data.byteLength, true); // Compressed size
    view.setUint32(22, data.byteLength, true); // Uncompressed size
    view.setUint16(26, pathBytes.byteLength, true); // File name length
    view.setUint16(28, 0, true); // Extra field length

    return header;
  }

  /**
   * Build a central directory file header.
   *
   * @param {Uint8Array} pathBytes The file name as bytes.
   * @param {Uint8Array} data The file data.
   * @param {number} localHeaderOffset Byte offset of the local file header.
   * @returns {Uint8Array}
   */
  #buildCentralDirectoryHeader(pathBytes, data, localHeaderOffset) {
    const header = new Uint8Array(46);
    const view = new DataView(header.buffer);
    const crc = this.#crc32(data);

    view.setUint32(0, 0x02014B50, true); // Central directory file header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed to extract
    view.setUint16(8, 0, true); // General purpose bit flag
    view.setUint16(10, 0, true); // Compression method (STORE)
    view.setUint16(12, 0, true); // Last mod file time
    view.setUint16(14, 0, true); // Last mod file date
    view.setUint32(16, crc, true); // CRC-32
    view.setUint32(20, data.byteLength, true); // Compressed size
    view.setUint32(24, data.byteLength, true); // Uncompressed size
    view.setUint16(28, pathBytes.byteLength, true); // File name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, localHeaderOffset, true); // Relative offset of local header

    return header;
  }

  /**
   * Build the end of central directory record.
   *
   * @param {number} entryCount Number of entries in the archive.
   * @param {number} centralDirSize Size of the central directory in bytes.
   * @param {number} centralDirOffset Offset of the central directory.
   * @returns {Uint8Array}
   */
  #buildEndOfCentralDirectory(entryCount, centralDirSize, centralDirOffset) {
    const record = new Uint8Array(22);
    const view = new DataView(record.buffer);

    view.setUint32(0, 0x06054B50, true); // End of central directory signature
    view.setUint16(4, 0, true); // Disk number
    view.setUint16(6, 0, true); // Disk number with central directory
    view.setUint16(8, entryCount, true); // Entries on this disk
    view.setUint16(10, entryCount, true); // Total entries
    view.setUint32(12, centralDirSize, true); // Size of central directory
    view.setUint32(16, centralDirOffset, true); // Offset of central directory
    view.setUint16(20, 0, true); // Comment length

    return record;
  }
}
