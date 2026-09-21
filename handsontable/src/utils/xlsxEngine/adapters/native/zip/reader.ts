import { throwWithCause } from '../../../../../helpers/errors';
import { MAX_INFLATED_ENTRY_BYTES } from '../../../limits';
import { inflateRaw } from './streams';

/**
 * A read-only view of an opened archive. Entries are inflated on demand, one at a time.
 */
export interface ZipArchive {
  names(): string[];
  has(name: string): boolean;
  text(name: string): Promise<string>;
}

/**
 * One central-directory record, the authoritative source of an entry's sizes and method.
 */
interface CentralEntry {
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
}

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const END_RECORD_MIN_SIZE = 22;
const MAX_COMMENT_LENGTH = 0xFFFF;
const ZIP64_MARKER = 0xFFFFFFFF;

/**
 * Finds the end-of-central-directory record, scanning backwards over a possible archive comment.
 */
function findEndRecord(view: DataView): number {
  const floor = Math.max(0, view.byteLength - END_RECORD_MIN_SIZE - MAX_COMMENT_LENGTH);

  for (let offset = view.byteLength - END_RECORD_MIN_SIZE; offset >= floor; offset--) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throwWithCause('The file has no ZIP end-of-central-directory record.');
}

/**
 * Reads every central-directory record into a name-keyed map.
 */
function readCentralDirectory(bytes: Uint8Array, view: DataView): Map<string, CentralEntry> {
  const endRecord = findEndRecord(view);
  const count = view.getUint16(endRecord + 10, true);
  const size = view.getUint32(endRecord + 12, true);
  let offset = view.getUint32(endRecord + 16, true);

  if (offset === ZIP64_MARKER || size === ZIP64_MARKER || offset + size > endRecord) {
    throwWithCause('The ZIP central directory is out of bounds or uses ZIP64, which this reader does not accept.');
  }

  const decoder = new TextDecoder();
  const entries = new Map<string, CentralEntry>();

  for (let i = 0; i < count; i++) {
    if (offset + 46 > endRecord || view.getUint32(offset, true) !== CENTRAL_HEADER_SIGNATURE) {
      throwWithCause(`The ZIP central directory record ${i} is malformed.`);
    }

    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));

    if (method !== 0 && method !== 8) {
      throwWithCause(`The ZIP entry "${name}" uses compression method ${method}; `
        + 'only stored and DEFLATE are accepted.');
    }

    if (compressedSize === ZIP64_MARKER || uncompressedSize === ZIP64_MARKER || localOffset === ZIP64_MARKER) {
      throwWithCause(`The ZIP entry "${name}" uses ZIP64 sizes, which this reader does not accept.`);
    }

    entries.set(name, { method, compressedSize, uncompressedSize, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

/**
 * Opens a ZIP archive held in memory. Sizes and methods come from the central directory, so a
 * local header carrying a data descriptor (sizes written after the data) is read correctly.
 */
export async function readZip(buffer: ArrayBuffer): Promise<ZipArchive> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (bytes.byteLength < END_RECORD_MIN_SIZE) {
    throwWithCause('The file has no ZIP end-of-central-directory record.');
  }

  const entries = readCentralDirectory(bytes, view);
  const decoder = new TextDecoder('utf-8', { ignoreBOM: false });

  /**
   * Slices and inflates one entry's bytes.
   */
  async function entryBytes(name: string): Promise<Uint8Array> {
    const entry = entries.get(name);

    if (entry === undefined) {
      throwWithCause(`The archive has no entry named "${name}".`);
    }

    if (entry.uncompressedSize > MAX_INFLATED_ENTRY_BYTES) {
      throwWithCause(`The ZIP entry "${name}" declares ${entry.uncompressedSize} bytes, `
        + `above the ${MAX_INFLATED_ENTRY_BYTES}-byte limit this reader accepts.`);
    }

    const { localOffset } = entry;

    if (localOffset + 30 > bytes.byteLength || view.getUint32(localOffset, true) !== LOCAL_HEADER_SIGNATURE) {
      throwWithCause(`The ZIP entry "${name}" has a malformed local header.`);
    }

    const nameLength = view.getUint16(localOffset + 26, true);
    const extraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + nameLength + extraLength;
    const end = start + entry.compressedSize;

    if (end > bytes.byteLength) {
      throwWithCause(`The ZIP entry "${name}" runs past the end of the file.`);
    }

    const data = bytes.subarray(start, end);

    return entry.method === 8 ? inflateRaw(data, MAX_INFLATED_ENTRY_BYTES) : data;
  }

  return {
    names: () => Array.from(entries.keys()),
    has: name => entries.has(name),
    text: async(name) => {
      const text = decoder.decode(await entryBytes(name));

      return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    },
  };
}
