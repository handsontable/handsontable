import { crc32 } from './crc32';
import { deflateRaw } from './streams';

/**
 * One file to place in the archive. `name` is the path inside the package (`xl/workbook.xml`).
 */
export interface ZipEntryInput {
  name: string;
  data: Uint8Array;
}

/**
 * An entry after compression, with the numbers its headers need.
 */
interface PreparedEntry {
  nameBytes: Uint8Array;
  data: Uint8Array;
  method: 0 | 8;
  crc: number;
  uncompressedSize: number;
  localOffset: number;
}

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const VERSION_20 = 20;
const FLAG_UTF8_NAMES = 0x0800;
// 1980-01-01 00:00:00, the DOS epoch, so two exports of the same workbook are byte-identical.
// Day 1, month 1, year 0 in the packed DOS date: (0 << 9) | (1 << 5) | 1.
const DOS_TIME = 0;
const DOS_DATE = 33;

/**
 * Appends little-endian integers and byte runs to a growing buffer.
 */
class ByteWriter {
  /**
   * Little-endian view over the output buffer.
   */
  #view: DataView;
  /**
   * The output buffer, sized up front by the caller.
   */
  #bytes: Uint8Array;
  /**
   * Bytes written so far.
   */
  #offset = 0;

  /**
   * Allocates `size` bytes.
   */
  constructor(size: number) {
    this.#bytes = new Uint8Array(size);
    this.#view = new DataView(this.#bytes.buffer);
  }

  /**
   * Writes an unsigned 16-bit integer.
   */
  u16(value: number): void {
    this.#view.setUint16(this.#offset, value, true);
    this.#offset += 2;
  }

  /**
   * Writes an unsigned 32-bit integer.
   */
  u32(value: number): void {
    // eslint-disable-next-line no-bitwise -- forces the CRC into the unsigned range DataView expects.
    this.#view.setUint32(this.#offset, value >>> 0, true);
    this.#offset += 4;
  }

  /**
   * Copies a byte run.
   */
  bytes(run: Uint8Array): void {
    this.#bytes.set(run, this.#offset);
    this.#offset += run.byteLength;
  }

  /**
   * Bytes written so far.
   */
  get offset(): number {
    return this.#offset;
  }

  /**
   * The finished buffer.
   */
  toUint8Array(): Uint8Array {
    return this.#bytes;
  }
}

/**
 * Packs entries into a ZIP archive. `compress` selects DEFLATE for every entry; `false` stores
 * them. The Web `CompressionStream` has no level parameter, so a numeric level maps to the
 * platform default.
 */
export async function writeZip(entries: ZipEntryInput[], compress: boolean): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const prepared: PreparedEntry[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    // eslint-disable-next-line no-await-in-loop
    const data = compress ? await deflateRaw(entry.data) : entry.data;
    const nameBytes = encoder.encode(entry.name);

    prepared.push({
      nameBytes,
      data,
      method: compress ? 8 : 0,
      crc: crc32(entry.data),
      uncompressedSize: entry.data.byteLength,
      localOffset,
    });
    localOffset += 30 + nameBytes.byteLength + data.byteLength;
  }

  const centralSize = prepared.reduce((sum, e) => sum + 46 + e.nameBytes.byteLength, 0);
  const writer = new ByteWriter(localOffset + centralSize + 22);

  prepared.forEach((entry) => {
    writer.u32(LOCAL_HEADER_SIGNATURE);
    writer.u16(VERSION_20);
    writer.u16(FLAG_UTF8_NAMES);
    writer.u16(entry.method);
    writer.u16(DOS_TIME);
    writer.u16(DOS_DATE);
    writer.u32(entry.crc);
    writer.u32(entry.data.byteLength);
    writer.u32(entry.uncompressedSize);
    writer.u16(entry.nameBytes.byteLength);
    writer.u16(0);
    writer.bytes(entry.nameBytes);
    writer.bytes(entry.data);
  });

  const centralOffset = writer.offset;

  prepared.forEach((entry) => {
    writer.u32(CENTRAL_HEADER_SIGNATURE);
    writer.u16(VERSION_20);
    writer.u16(VERSION_20);
    writer.u16(FLAG_UTF8_NAMES);
    writer.u16(entry.method);
    writer.u16(DOS_TIME);
    writer.u16(DOS_DATE);
    writer.u32(entry.crc);
    writer.u32(entry.data.byteLength);
    writer.u32(entry.uncompressedSize);
    writer.u16(entry.nameBytes.byteLength);
    writer.u16(0);
    writer.u16(0);
    writer.u16(0);
    writer.u16(0);
    writer.u32(0);
    writer.u32(entry.localOffset);
    writer.bytes(entry.nameBytes);
  });

  writer.u32(END_OF_CENTRAL_DIRECTORY_SIGNATURE);
  writer.u16(0);
  writer.u16(0);
  writer.u16(prepared.length);
  writer.u16(prepared.length);
  writer.u32(centralSize);
  writer.u32(centralOffset);
  writer.u16(0);

  return writer.toUint8Array();
}
