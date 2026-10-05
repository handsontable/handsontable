import { throwWithCause } from '../../../../../helpers/errors';
import { MAX_INFLATED_ENTRY_BYTES, MAX_INFLATED_TOTAL_BYTES, throwLimitExceeded } from '../../../limits';
import { crc32 } from './crc32';
import { CENTRAL_HEADER_SIZE, END_RECORD_SIZE, LOCAL_HEADER_SIZE } from './layout';
import { STREAM_FAILURE_PREFIX, inflateRawText } from './streams';

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
  /**
   * The entry names in central-directory order. No production code calls it: the unit tests use it
   * to walk an archive and to rewrite its parts.
   */
  names(): string[];
  has(name: string): boolean;
  text(name: string): Promise<string>;
  /**
   * Charges the budget for a part the caller is about to tokenize AGAIN, for another sheet. The memo
   * makes the second read free to inflate, but not to parse: N sheets naming one part each tokenize
   * it once more, so the work is charged as if each had its own copy.
   */
  chargeReread(name: string, byteLength: number): void;
  release(): void;
}

/**
 * One central-directory record, the authoritative source of an entry's sizes and method.
 */
interface CentralEntry {
  /**
   * The entry's name as the central directory spells it.
   */
  name: string;
  method: number;
  /**
   * The CRC-32 of the entry's uncompressed bytes, which the read checks what it produced against.
   */
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
}

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const MAX_COMMENT_LENGTH = 0xFFFF;
const ZIP64_MARKER = 0xFFFFFFFF;
// General-purpose flag bits 0 (ZipCrypto) and 6 (strong encryption): the region behind either is
// ciphertext, not the entry's bytes, so such an entry is refused by name rather than inflated as
// corrupt data or, stored, read back as ciphertext.
const FLAG_ENCRYPTED = 0x0001;
const FLAG_STRONG_ENCRYPTION = 0x0040;

/**
 * The first eight bytes of an OLE Compound File. A legacy `.xls` is one, and so is an `.xlsx` that
 * Excel saved with a password to open: the encrypted package is stored inside a Compound File, not
 * a ZIP. Neither has an end-of-central-directory record, so the scan's own refusal was true and
 * told the user nothing about what to do.
 */
const COMPOUND_FILE_SIGNATURE = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];

/**
 * Whether the bytes start with the Compound File signature.
 */
function isCompoundFile(bytes: Uint8Array): boolean {
  return bytes.byteLength >= COMPOUND_FILE_SIGNATURE.length
    && COMPOUND_FILE_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

/**
 * Folds a part name for comparison. OPC compares part names as case-insensitive ASCII strings
 * (ECMA-376 Part 2, 6.2.2.3), so `xl/worksheets/Sheet1.xml` and `xl/worksheets/sheet1.xml` are one
 * part; only A-Z fold, every other character compares exactly.
 */
export function foldPartName(name: string): string {
  return /[A-Z]/.test(name) ? name.replace(/[A-Z]+/g, letters => letters.toLowerCase()) : name;
}

/**
 * Whether the signature at `offset` describes this archive's real end record: its comment runs
 * exactly to the end of the file, and the central directory it points at lies before it and starts
 * with a central header (or is empty).
 */
function isPlausibleEndRecord(view: DataView, offset: number): boolean {
  if (offset + END_RECORD_SIZE + view.getUint16(offset + 20, true) !== view.byteLength) {
    return false;
  }

  const count = view.getUint16(offset + 10, true);
  const size = view.getUint32(offset + 12, true);
  const start = view.getUint32(offset + 16, true);

  if (start + size > offset) {
    return false;
  }

  return count === 0 || (start + 4 <= offset && view.getUint32(start, true) === CENTRAL_HEADER_SIGNATURE);
}

/**
 * Finds the end-of-central-directory record, scanning backwards over a possible archive comment.
 *
 * The first signature the backwards scan meets is not necessarily the record: the comment is the
 * file's own bytes and may hold `PK\x05\x06` itself, which hid the real record and refused the file
 * as having no workbook part. The record is the EARLIEST plausible candidate - a comment follows its
 * record, so a signature inside it always sits later. Where no candidate is plausible, the one the
 * scan met first is returned, as before, and the directory check refuses it in its own words.
 */
function findEndRecord(view: DataView): number {
  const floor = Math.max(0, view.byteLength - END_RECORD_SIZE - MAX_COMMENT_LENGTH);
  let first = -1;
  let plausible = -1;

  for (let offset = view.byteLength - END_RECORD_SIZE; offset >= floor; offset--) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      first = first === -1 ? offset : first;
      plausible = isPlausibleEndRecord(view, offset) ? offset : plausible;
    }
  }

  if (plausible !== -1) {
    return plausible;
  }

  if (first !== -1) {
    return first;
  }

  throwWithCause('The file has no ZIP end-of-central-directory record.');
}

/**
 * Refuses a central-directory record this reader does not accept: an encrypted entry, a method other
 * than stored or DEFLATE, a ZIP64 size or offset, or a name already declared by an earlier record.
 */
function assertAcceptedEntry(
  name: string,
  flags: number,
  entry: CentralEntry,
  entries: Map<string, CentralEntry>,
): void {
  const { method, compressedSize, uncompressedSize, localOffset } = entry;

  // eslint-disable-next-line no-bitwise -- the flag word is a bit field.
  if ((flags & (FLAG_ENCRYPTED | FLAG_STRONG_ENCRYPTION)) !== 0) {
    throwWithCause(`The ZIP entry "${name}" is encrypted, which this reader does not accept.`);
  }

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
  // writes a duplicate, so refusing costs no real workbook anything. Names are compared FOLDED,
  // as every lookup is: two spellings of one part name are the same part declared twice.
  if (entries.has(foldPartName(name))) {
    // Refused through the limit thrower although the archive is malformed rather than too large:
    // the message names what this reader accepts, and `read.ts` re-throws a tagged error as it
    // stands instead of wrapping it in "The workbook could not be parsed by the native engine".
    throwLimitExceeded(`The ZIP entry "${name}" is declared twice, which this reader does not accept.`);
  }
}

/**
 * Reads every central-directory record into a map keyed by the FOLDED name (`foldPartName`).
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

    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const crc = view.getUint32(offset + 16, true);
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
    const entry = { name, method, crc, compressedSize, uncompressedSize, localOffset };

    assertAcceptedEntry(name, flags, entry, entries);
    entries.set(foldPartName(name), entry);
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

  if (isCompoundFile(bytes)) {
    throwWithCause('the file is a legacy Excel 97-2003 workbook (.xls) or a password-protected workbook, '
      + 'which the built-in engine does not read. Save it as an unprotected .xlsx.');
  }

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
   * Refuses an entry that brings the archive's inflated total past its budget, naming the entry.
   */
  function refuseTotal(name: string): never {
    return throwLimitExceeded(`The archive entry "${name}" brings the inflated total above the `
      + `${MAX_INFLATED_TOTAL_BYTES}-byte limit this reader accepts.`);
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
      return { maxBytes: remaining, refuse: () => refuseTotal(name) };
    }

    return {
      maxBytes: declared,
      refuse: () => throwLimitExceeded(`The ZIP entry "${name}" inflates above the `
        + `${declared}-byte limit this reader accepts.`),
    };
  }

  /**
   * Refuses an entry whose produced bytes do not match the CRC-32 its central record declares. A
   * flipped byte in a stored part otherwise read as a sheet with a wrong cell, where `unzip -t` and
   * Python's `testzip()` both flag the file.
   */
  function assertChecksum(entry: CentralEntry, checksum: number): void {
    if (checksum !== entry.crc) {
      throwWithCause(`The ZIP entry "${entry.name}" fails its CRC-32 check; the archive is corrupt.`);
    }
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
   * Reads one entry as text, charging the budget for the bytes it really produced, and returns the
   * text with that byte count so `text()` can charge the decoded string on top of it only as far as
   * the string outweighs the bytes.
   *
   * A STORED entry is its own inflated form, so a well-formed ZIP declares its two sizes equal and
   * one that does not is refused: the reader returns `compressedSize` bytes for it, so a record
   * declaring one uncompressed byte beside a thirty-megabyte compressed size was charged a single
   * byte for thirty megabytes of output, and the whole archive budget was bypassed by it.
   *
   * A DEFLATE entry is bounded by the smallest of three ceilings: its own declared size, the
   * per-entry cap, and what the total budget still allows. `inflateCeiling()` hands the stream the
   * refusal that goes with the ceiling it picked, so a part stopped by the budget is refused in the
   * budget's own words. The ceiling is enforced as the output streams, not before it exists: the
   * stream writes the input in `STREAM_WRITE_CHUNK_BYTES` slices, so what can exist past the
   * ceiling before the cancel lands is one slice's output at most (about 16 MB at DEFLATE's
   * 1032:1), never the whole entry.
   */
  async function entryText(name: string): Promise<{ text: string; byteLength: number }> {
    const entry = entries.get(foldPartName(name));

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
      assertChecksum(entry, crc32(data));

      return { text: decoder.decode(data), byteLength: data.byteLength };
    }

    const { maxBytes, refuse } = inflateCeiling(name, entry);
    let checksum = 0;
    let inflated: Awaited<ReturnType<typeof inflateRawText>>;

    try {
      // The string is bounded by what the total budget still allows, the quantity `text()` charges
      // it against, so the stream stops where that charge would refuse it.
      inflated = await inflateRawText(data, maxBytes, refuse, (chunk) => {
        checksum = crc32(chunk, checksum);
      }, {
        maxBytes: MAX_INFLATED_TOTAL_BYTES - inflatedTotal,
        // The charge `text()` would make, made now: it refuses in the same words.
        refuse: (stringBytes) => {
          chargeInflated(name, stringBytes);

          return refuseTotal(name);
        },
      });
    } catch (error) {
      const { message } = error as Error;

      // A stream failure names the entry here: only the reader knows which part was being read.
      if (typeof message === 'string' && message.startsWith(STREAM_FAILURE_PREFIX)) {
        throwWithCause(`The archive entry "${name}" could not be processed: `
          + `${message.slice(STREAM_FAILURE_PREFIX.length)}`);
      }

      throw error;
    }

    chargeInflated(name, inflated.byteLength);
    assertChecksum(entry, checksum);

    return inflated;
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
   * An entry is charged ONCE, as the larger of its produced bytes and its decoded string - never
   * the two summed. Nothing holds both: a DEFLATE part is decoded chunk by chunk as it inflates, so
   * its bytes are never materialized, and a stored part's bytes are a view over the input the
   * caller already holds. Summing them billed an ASCII part three times its size for memory worth
   * two at most, and refused the engine's own 120 000 x 20 export (104 MB of XML, charged 312 MB).
   * The bytes are still charged first, by `entryText()`, while the part is produced; the string's
   * excess over them is charged here, before the memo retains it.
   *
   * EVERY declared field is in the key, the two sizes and the CRC-32 included, because the fast path
   * sits in front of the checks `entryText()` makes on them. Keying on the region alone let a crafted directory
   * list one well-formed record and one lying record over the same bytes: the honest one read
   * first, and the liar - a 600 MB claim, or a stored entry whose two sizes disagree - then took the
   * cached string and skipped the refusal it had earned. A region is still decoded once, since
   * records that agree on all four fields share a key.
   */
  async function text(name: string): Promise<string> {
    const entry = entries.get(foldPartName(name));
    const key = entry === undefined
      ? name
      : `${entry.method}:${entry.localOffset}:${entry.compressedSize}:${entry.uncompressedSize}:${entry.crc}`;
    const cached = texts.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const { text: decoded, byteLength } = await entryText(name);
    const stringExcess = (decoded.length * 2) - byteLength;

    if (stringExcess > 0) {
      chargeInflated(name, stringExcess);
    }

    texts.set(key, decoded);

    return decoded;
  }

  /**
   * Charges a repeated tokenize of an already-decoded part, in the words of the read that asks it.
   */
  function chargeReread(name: string, byteLength: number): void {
    inflatedTotal += byteLength;

    if (inflatedTotal > MAX_INFLATED_TOTAL_BYTES) {
      throwLimitExceeded(`The archive entry "${name}" is read again for another sheet, bringing the inflated `
        + `total to ${inflatedTotal} bytes, above the ${MAX_INFLATED_TOTAL_BYTES}-byte limit this reader accepts.`);
    }
  }

  return {
    names: () => Array.from(entries.values(), entry => entry.name),
    has: name => entries.has(foldPartName(name)),
    text,
    chargeReread,
    release: () => texts.clear(),
  };
}
