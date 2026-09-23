import { throwWithCause } from '../../../../../helpers/errors';
import { MAX_INFLATED_ENTRY_BYTES, MAX_INFLATED_TOTAL_BYTES, throwLimitExceeded } from '../../../limits';
import { CENTRAL_HEADER_SIZE, END_RECORD_SIZE, LOCAL_HEADER_SIZE } from './layout';
import { inflateRawText } from './streams';

/**
 * A read-only view of an opened archive. Entries are inflated on demand, one at a time, and each
 * REGION is inflated at most once: `text()` memoizes its result for the archive's lifetime, keyed
 * by the local region an entry points at rather than by its name, so N sheets pointing at one part
 * - and N differently named records aliasing one local record - cost one inflate rather than N.
 * `release()` drops that cache, and deliberately leaves the archive-wide inflated-byte budget
 * standing: the budget models what ONE read of this archive was allowed to cost, so a second pass
 * over a released archive re-charges every part it reads again and may refuse a file it has just
 * read. Nothing does that today - `readWorkbook` releases once, in a `finally`, as its last act.
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

    // A name may appear once. The map would keep the LAST record, while several other ZIP readers
    // (and some Office tooling) resolve the FIRST — so a crafted archive holding two `sheet1.xml`
    // entries reads differently here than in whatever inspected the file upstream. Excel never
    // writes a duplicate, so refusing costs no real workbook anything.
    if (entries.has(name)) {
      // Refused through the limit thrower although the archive is malformed rather than too large:
      // the message names what this reader accepts, and `read.ts` re-throws a tagged error as it
      // stands instead of wrapping it in "The workbook could not be parsed by the native engine".
      throwLimitExceeded(`The ZIP entry "${name}" is declared twice, which this reader does not accept.`);
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
   * Charges bytes against the archive-wide budget. The per-entry cap bounds one part and the input
   * cap bounds the compressed file; neither bounds the sum, so a handful of parts each just under
   * the per-entry cap, or one part amplified a thousandfold out of a few hundred kilobytes, stayed
   * inside every declared limit.
   *
   * What is charged is always what was PRODUCED - never what the central directory declared. A
   * declaration is the file's own claim: charging it let a stored entry returning its compressed
   * bytes be billed one byte while it yielded thirty megabytes, and it refused a readable file whose
   * declaration lied high. The declared size still bounds the work, as the inflate's ceiling.
   */
  function chargeInflated(name: string, byteLength: number): void {
    inflatedTotal += byteLength;

    if (inflatedTotal > MAX_INFLATED_TOTAL_BYTES) {
      throwLimitExceeded(`The archive entry "${name}" brings the inflated total to ${inflatedTotal} bytes, `
        + `above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit this reader accepts.`);
    }
  }

  /**
   * The ceiling one DEFLATE entry's output may not pass, with the refusal that belongs to it.
   *
   * Three limits bound the work before a byte exists - the entry's own declared size, the per-entry
   * cap, and what the archive budget still allows - and the smallest of them is where the stream
   * stops. The refusal has to follow the same choice. It used to be raised by the stream alone,
   * which quoted whatever number it stopped at, so a part declaring 400 MB (inside the per-entry
   * cap) that really inflated past the remaining budget was refused with a byte count that is no
   * declared limit of this reader's and that named no entry. Each ceiling now owns its sentence.
   */
  function inflateCeiling(name: string, entry: CentralEntry): { maxBytes: number; refuse: () => never } {
    const declared = Math.min(entry.uncompressedSize, MAX_INFLATED_ENTRY_BYTES);
    const remaining = MAX_INFLATED_TOTAL_BYTES - inflatedTotal;

    if (remaining < declared) {
      return {
        maxBytes: remaining,
        refuse: () => throwLimitExceeded(`The archive entry "${name}" brings the inflated total above the `
          + `${MAX_INFLATED_TOTAL_BYTES}-byte limit this reader accepts.`),
      };
    }

    return {
      maxBytes: declared,
      refuse: () => throwLimitExceeded(`The ZIP entry "${name}" inflates above the `
        + `${declared}-byte limit this reader accepts.`),
    };
  }

  /**
   * Locates one entry's stored bytes, refusing an entry whose header does not describe them.
   */
  function entrySlice(name: string, entry: CentralEntry): Uint8Array {
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

    return bytes.subarray(start, end);
  }

  /**
   * Reads one entry as text, charging the budget for the bytes it really produced.
   *
   * A STORED entry is its own inflated form, so a well-formed ZIP declares its two sizes equal and
   * one that does not is refused: the reader returns `compressedSize` bytes for it, so a record
   * declaring one uncompressed byte beside a thirty-megabyte compressed size was charged a single
   * byte for thirty megabytes of output, and the whole archive budget was bypassed by it.
   *
   * A DEFLATE entry is bounded BEFORE its bytes exist, by the smallest of three ceilings: its own
   * declared size, the per-entry cap, and what the total budget still allows. `inflateCeiling()`
   * hands the stream the refusal that goes with the ceiling it picked, so a part stopped by the
   * budget is refused in the budget's own words.
   */
  async function entryText(name: string): Promise<string> {
    const entry = entries.get(name);

    if (entry === undefined) {
      throwWithCause(`The archive has no entry named "${name}".`);
    }

    if (entry.uncompressedSize > MAX_INFLATED_ENTRY_BYTES) {
      throwLimitExceeded(`The ZIP entry "${name}" declares ${entry.uncompressedSize} bytes, `
        + `above the ${MAX_INFLATED_ENTRY_BYTES}-byte limit this reader accepts.`);
    }

    const data = entrySlice(name, entry);

    if (entry.method === 0) {
      if (entry.compressedSize !== entry.uncompressedSize) {
        throwWithCause(`The stored ZIP entry "${name}" declares ${entry.compressedSize} compressed bytes `
          + `and ${entry.uncompressedSize} uncompressed bytes; a stored entry's two sizes must agree.`);
      }

      chargeInflated(name, data.byteLength);

      return decoder.decode(data);
    }

    const { maxBytes, refuse } = inflateCeiling(name, entry);
    const inflated = await inflateRawText(data, maxBytes, refuse);

    chargeInflated(name, inflated.byteLength);

    return inflated.text;
  }

  /**
   * Decodes one entry as text, reading it only the first time its REGION is asked for.
   *
   * The memo is keyed by the local record an entry points at, not by the entry's name: a central
   * directory may list any number of differently named records against one local offset, and a
   * name-keyed memo then held one decoded copy per name - 128 names over a 32 MB region killed the
   * process outright. The cached string is charged against the same budget as the bytes it came
   * from (UTF-16 code units, two bytes each - the worst case; V8 stores a Latin-1 string in one),
   * so the cache can never hold more than the archive was allowed to cost however it was obtained.
   *
   * EVERY declared field is in the key, the two sizes included, because the fast path sits in front
   * of the checks `entryText()` makes on them. Keying on the region alone let a crafted directory
   * list one well-formed record and one lying record over the same bytes: the honest one read
   * first, and the liar - a 600 MB claim, or a stored entry whose two sizes disagree - then took the
   * cached string and skipped the refusal it had earned. A region is still decoded once, since
   * records that agree on all four fields share a key.
   */
  async function text(name: string): Promise<string> {
    const entry = entries.get(name);
    const key = entry === undefined
      ? name
      : `${entry.method}:${entry.localOffset}:${entry.compressedSize}:${entry.uncompressedSize}`;
    const cached = texts.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const decoded = await entryText(name);

    chargeInflated(name, decoded.length * 2);
    texts.set(key, decoded);

    return decoded;
  }

  return {
    names: () => Array.from(entries.keys()),
    has: name => entries.has(name),
    text,
    release: () => texts.clear(),
  };
}
