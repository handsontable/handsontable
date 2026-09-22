import { throwWithCause } from '../../../../../helpers/errors';
import { MAX_INFLATED_ENTRY_BYTES, MAX_INFLATED_TOTAL_BYTES, throwLimitExceeded } from '../../../limits';
import { CENTRAL_HEADER_SIZE, END_RECORD_SIZE, LOCAL_HEADER_SIZE } from './layout';
import { inflateRaw } from './streams';

/**
 * A read-only view of an opened archive. Entries are inflated on demand, one at a time, and each
 * entry is inflated at most once: `text()` memoizes its result for the archive's lifetime, so N
 * sheets pointing at one part cost one inflate rather than N. `release()` drops that cache.
 */
export interface ZipArchive {
  names(): string[];
  has(name: string): boolean;
  text(name: string): Promise<string>;
  release(): void;
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
const MAX_COMMENT_LENGTH = 0xFFFF;
const ZIP64_MARKER = 0xFFFFFFFF;

/**
 * Finds the end-of-central-directory record, scanning backwards over a possible archive comment.
 */
function findEndRecord(view: DataView): number {
  const floor = Math.max(0, view.byteLength - END_RECORD_SIZE - MAX_COMMENT_LENGTH);

  for (let offset = view.byteLength - END_RECORD_SIZE; offset >= floor; offset--) {
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
    if (offset + CENTRAL_HEADER_SIZE > endRecord || view.getUint32(offset, true) !== CENTRAL_HEADER_SIGNATURE) {
      throwWithCause(`The ZIP central directory record ${i} is malformed.`);
    }

    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);

    if (offset + CENTRAL_HEADER_SIZE + nameLength + extraLength + commentLength > endRecord) {
      throwWithCause(`The ZIP central directory record ${i} is malformed.`);
    }

    const nameStart = offset + CENTRAL_HEADER_SIZE;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));

    if (method !== 0 && method !== 8) {
      throwWithCause(`The ZIP entry "${name}" uses compression method ${method}; `
        + 'only stored and DEFLATE are accepted.');
    }

    if (compressedSize === ZIP64_MARKER || uncompressedSize === ZIP64_MARKER || localOffset === ZIP64_MARKER) {
      throwWithCause(`The ZIP entry "${name}" uses ZIP64 sizes, which this reader does not accept.`);
    }

    entries.set(name, { method, compressedSize, uncompressedSize, localOffset });
    offset += CENTRAL_HEADER_SIZE + nameLength + extraLength + commentLength;
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

  if (bytes.byteLength < END_RECORD_SIZE) {
    throwWithCause('The file has no ZIP end-of-central-directory record.');
  }

  const entries = readCentralDirectory(bytes, view);
  const decoder = new TextDecoder('utf-8', { ignoreBOM: false });
  const texts = new Map<string, string>();
  let inflatedTotal = 0;

  /**
   * Charges an entry's inflated size against the archive-wide budget. The per-entry cap bounds one
   * part and the input cap bounds the compressed file; neither bounds the sum, so a handful of
   * parts each just under the per-entry cap, or one part amplified a thousandfold out of a few
   * hundred kilobytes, stayed inside every declared limit. The charge runs on the size the central
   * directory declares (clamped to the per-entry cap, which is also the ceiling the inflate itself
   * is given), so an entry past the budget is refused before a byte of it is materialized.
   */
  function chargeInflated(name: string, byteLength: number): void {
    inflatedTotal += byteLength;

    if (inflatedTotal > MAX_INFLATED_TOTAL_BYTES) {
      throwLimitExceeded(`The archive entry "${name}" brings the inflated total to ${inflatedTotal} bytes, `
        + `above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit this reader accepts.`);
    }
  }

  /**
   * Slices and inflates one entry's bytes.
   */
  async function entryBytes(name: string): Promise<Uint8Array> {
    const entry = entries.get(name);

    if (entry === undefined) {
      throwWithCause(`The archive has no entry named "${name}".`);
    }

    if (entry.uncompressedSize > MAX_INFLATED_ENTRY_BYTES) {
      throwLimitExceeded(`The ZIP entry "${name}" declares ${entry.uncompressedSize} bytes, `
        + `above the ${MAX_INFLATED_ENTRY_BYTES}-byte limit this reader accepts.`);
    }

    const inflatedSize = Math.min(entry.uncompressedSize, MAX_INFLATED_ENTRY_BYTES);

    chargeInflated(name, inflatedSize);

    const { localOffset } = entry;

    if (localOffset + LOCAL_HEADER_SIZE > bytes.byteLength
      || view.getUint32(localOffset, true) !== LOCAL_HEADER_SIGNATURE) {
      throwWithCause(`The ZIP entry "${name}" has a malformed local header.`);
    }

    const nameLength = view.getUint16(localOffset + 26, true);
    const extraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + LOCAL_HEADER_SIZE + nameLength + extraLength;
    const end = start + entry.compressedSize;

    if (end > bytes.byteLength) {
      throwWithCause(`The ZIP entry "${name}" runs past the end of the file.`);
    }

    const data = bytes.subarray(start, end);

    // The central directory is the authoritative source for this entry (the module comment above),
    // so the inflate cap is the SMALLER of the entry's own declared size and the reader's ceiling —
    // never the ceiling alone, or an entry declaring a small size could still inflate past it.
    return entry.method === 8 ? inflateRaw(data, inflatedSize) : data;
  }

  /**
   * Decodes one entry as text, inflating it only the first time it is asked for. The cache is
   * bounded by the same total-bytes budget that bounds the inflating, so it cannot itself grow past
   * what the archive was allowed to cost.
   */
  async function text(name: string): Promise<string> {
    const cached = texts.get(name);

    if (cached !== undefined) {
      return cached;
    }

    const decoded = decoder.decode(await entryBytes(name));

    texts.set(name, decoded);

    return decoded;
  }

  return {
    names: () => Array.from(entries.keys()),
    has: name => entries.has(name),
    text,
    release: () => texts.clear(),
  };
}
