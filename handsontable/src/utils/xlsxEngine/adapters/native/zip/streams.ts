import { throwWithCause } from '../../../../../helpers/errors';
import { throwLimitExceeded } from '../../../limits';

/**
 * How many input bytes one `writer.write()` hands the transform. The read loop's cap can only act
 * between output chunks, and a browser's DEFLATE transform inflates one written chunk entirely
 * inside one `transform()` call, enqueuing every output buffer before the loop reads the first, so
 * the whole entry was in memory before the cap ran. Writing the input in slices bounds the queue to
 * one slice's output (16 KB × the 1032:1 DEFLATE ceiling ≈ 16 MB) at most.
 */
export const STREAM_WRITE_CHUNK_BYTES = 16 * 1024;

/**
 * Whether a view sits over a plain `ArrayBuffer`, which is the only backing the stream writer's
 * `BufferSource` parameter accepts - a `SharedArrayBuffer` view is typed out of it.
 */
function isArrayBufferBacked(bytes: Uint8Array): bytes is Uint8Array<ArrayBuffer> {
  return bytes.buffer instanceof ArrayBuffer;
}

/**
 * The input as a view the stream writer accepts. Both production callers already hand over such a
 * view - the reader slices the caller's `ArrayBuffer` and the writer passes a fresh `TextEncoder`
 * buffer - so this is the input itself, and no byte is copied; a transform never mutates or
 * detaches what is written to it. Only a view over a `SharedArrayBuffer` (nothing in this engine
 * makes one) is copied, because that is the one backing the parameter's type excludes.
 */
function asBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (isArrayBufferBacked(bytes)) {
    return bytes;
  }

  const copy = new Uint8Array(bytes.byteLength);

  copy.set(bytes);

  return copy;
}

/**
 * The result of a streamed inflate: the decoded text, and the number of BYTES the stream produced.
 * The byte count is what the archive budget is charged, because it is what the entry really cost -
 * the declared size is the file's own claim and may be either a lie or absent.
 */
export interface InflatedText {
  /**
   * The whole output of the stream, decoded as UTF-8 or UTF-16 by its first bytes (`sniffXmlEncoding`).
   */
  text: string;
  /**
   * How many bytes the stream produced, which is what the archive budget is charged.
   */
  byteLength: number;
}

/**
 * The refusal a caller that names no better one gets when the stream runs past its ceiling. A
 * caller whose ceiling comes from a budget of its own hands over that budget's wording instead, so
 * a reader is told which declared limit was really reached rather than the number this stream
 * happened to stop at.
 */
function refuseAboveCeiling(maxBytes: number): () => never {
  return () => throwLimitExceeded(`The archive entry inflates above the ${maxBytes}-byte limit this reader accepts.`);
}

/**
 * Writes `bytes` to the transform one slice of `sliceBytes` at a time, then closes the writable.
 * Each write is awaited before the next starts, so at most one slice is inside the transform at
 * once; a cancel from the read loop rejects the pending write, which the caller's `catch` absorbs.
 */
async function writeSliced(
  writer: WritableStreamDefaultWriter<BufferSource>,
  bytes: Uint8Array<ArrayBuffer>,
  sliceBytes: number
): Promise<void> {
  for (let offset = 0; offset < bytes.byteLength; offset += sliceBytes) {
    // The next slice must not be queued before this one has been taken: a transform inflates a
    // whole written chunk at once, so the queue would hold every slice's output at the same time.
    // eslint-disable-next-line no-await-in-loop -- one slice in flight at a time, by design.
    await writer.write(bytes.subarray(offset, offset + sliceBytes));
  }

  await writer.close();
}

/**
 * The sentence every stream failure starts with. The archive reader replaces it with one that
 * names the entry (`entryText` in `reader.ts`).
 */
export const STREAM_FAILURE_PREFIX = 'The archive entry could not be processed: ';

/**
 * The reason a stream failure gives. Node rejects corrupt input with a `TypeError` whose `message`
 * is empty and whose `code` is `Z_DATA_ERROR`, so a refusal there ended at the colon; the browsers
 * fill the message in.
 */
function describeStreamError(error: unknown): string {
  const { message, code, name } = (error ?? {}) as { message?: unknown; code?: unknown; name?: unknown };

  if (typeof message === 'string' && message !== '') {
    return message;
  }

  if (typeof code === 'string' && code !== '') {
    return code;
  }

  return typeof name === 'string' && name !== '' ? name : 'unknown stream error';
}

/**
 * Pushes `bytes` through a transform stream and hands each output chunk to `onChunk`, refusing to
 * produce more than `maxBytes`. The write side is started and left running while the read loop
 * drains the readable, which is what keeps a transform with backpressure from deadlocking.
 *
 * The input goes in as `STREAM_WRITE_CHUNK_BYTES` slices, one in flight at a time, and that is
 * what makes `maxBytes` a bound on memory rather than only on the output handed to `onChunk`. The
 * cap is checked between output chunks, but a browser's DEFLATE transform inflates one written
 * chunk entirely inside one `transform()` call and enqueues every output buffer before the read
 * loop sees the first: written whole, a 65 KB entry of 64 MB of zeros put 64 MB on the queue
 * before the first read (measured in headless Chrome), and the cancel came too late. With sliced
 * writes the queue holds at most one slice's output, so the overshoot past `maxBytes` is bounded by
 * a slice times DEFLATE's 1032:1 ceiling - about 16 MB - instead of by the entry. Node's transform
 * honors its writable high-water mark, so Jest cannot observe the browser queue; the unit test pins
 * the shape of the writes instead.
 *
 * `sliceBytes` is the slice size. An inflate passes `STREAM_WRITE_CHUNK_BYTES`; a deflate passes
 * `Infinity`, which writes the input in one call. Compression output is never larger than its input
 * by more than DEFLATE's stored-block overhead, so the bound buys a deflate nothing, and every
 * awaited slice ends a zone.js turn: under Angular a sliced export ran one change detection per
 * 16 KiB of XML, 874 of them at 50,000 rows against one for ExcelJS.
 *
 * The caller decides what to do with a chunk: collecting them costs the whole output twice (the
 * chunk list and the joined copy), which a text reader avoids by decoding each chunk as it arrives.
 *
 * `refuse` is what the overshoot raises. The ceiling is often the smallest of several limits, and
 * only the caller knows which one it chose, so the sentence a user reads belongs to the caller
 * rather than to this loop.
 */
async function drain(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  maxBytes: number,
  onChunk: (chunk: Uint8Array) => void,
  refuse: () => never,
  sliceBytes: number = STREAM_WRITE_CHUNK_BYTES
): Promise<number> {
  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();
  let total = 0;
  let writeError: unknown = null;

  const writing = writeSliced(writer, asBufferSource(bytes), sliceBytes)
    .catch((error: unknown) => {
      writeError = error;
    });

  try {
    for (;;) {
      // The next chunk does not exist until this one has been delivered.
      // eslint-disable-next-line no-await-in-loop -- a stream is read one chunk at a time.
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      total += value.byteLength;

      if (total > maxBytes) {
        // The cap was hit, so this cancels the stream once and throws: the loop never comes round again.
        // eslint-disable-next-line no-await-in-loop -- see the comment above.
        await reader.cancel();
        refuse();
      }

      onChunk(value);
    }
  } catch (error) {
    if ((error as { cause?: { handsontable?: boolean } }).cause?.handsontable) {
      throw error;
    }

    throwWithCause(`${STREAM_FAILURE_PREFIX}${describeStreamError(error)}`);
  }

  await writing;

  if (writeError !== null) {
    throwWithCause(`${STREAM_FAILURE_PREFIX}${describeStreamError(writeError)}`);
  }

  return total;
}

/**
 * Collects a transform's whole output into one buffer. This holds the chunk list and the joined
 * copy at the same time, so a caller that only wants text should take the streaming path below.
 */
async function pump(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  maxBytes: number,
  sliceBytes: number = STREAM_WRITE_CHUNK_BYTES
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const total = await drain(
    bytes, transform, maxBytes, chunk => chunks.push(chunk), refuseAboveCeiling(maxBytes), sliceBytes,
  );
  const out = new Uint8Array(total);
  let offset = 0;

  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return out;
}

/**
 * The globals the built-in engine needs from its host: the Web Compression Streams for every ZIP
 * entry, and the text codecs for every part.
 */
const NATIVE_ENGINE_GLOBALS = ['CompressionStream', 'DecompressionStream', 'TextEncoder', 'TextDecoder'] as const;

/**
 * Whether the host defines one of the globals the engine needs.
 */
function hasGlobal(name: typeof NATIVE_ENGINE_GLOBALS[number]): boolean {
  return typeof (globalThis as Record<string, unknown>)[name] !== 'undefined';
}

/**
 * Refuses with a message that names the missing globals and the two ways to supply them.
 */
function throwMissingGlobals(missing: string[]): never {
  throwWithCause(`The built-in xlsx engine needs ${missing.join(', ')}, which this environment does `
    + 'not define. In a test environment such as jsdom, assign CompressionStream and DecompressionStream '
    + 'from `node:stream/web` and TextEncoder and TextDecoder from `node:util` to the global object, or '
    + 'inject ExcelJS through the `engines` option.');
}

/**
 * Refuses an engine call up front when the host lacks any global the engine needs. jsdom has
 * neither the streams nor the text codecs, and Jest's node environment hides the streams, so the
 * engine used to fail with a bare `ReferenceError` from whichever it reached first – the export at
 * `new TextEncoder()`, before any stream. Both adapter entry points call this before anything else.
 */
export function assertNativeEngineGlobals(): void {
  const missing = NATIVE_ENGINE_GLOBALS.filter(name => !hasGlobal(name));

  if (missing.length > 0) {
    throwMissingGlobals(missing);
  }
}

/**
 * Refuses a stream operation when the host lacks its stream. The entry points check every global
 * first (`assertNativeEngineGlobals`); this keeps the stream helpers safe for a direct caller.
 */
function assertStreamAvailable(globalName: 'CompressionStream' | 'DecompressionStream'): void {
  if (!hasGlobal(globalName)) {
    throwMissingGlobals([globalName]);
  }
}

/**
 * Compresses bytes with raw DEFLATE (no zlib header), the method ZIP entries use. The input goes
 * in as one write: the slice bound exists for the inflate side only (see `drain`).
 */
export function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  assertStreamAvailable('CompressionStream');

  return pump(bytes, new CompressionStream('deflate-raw'), Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
}

/**
 * Decompresses raw DEFLATE bytes, refusing output above `maxBytes`.
 */
export function inflateRaw(bytes: Uint8Array, maxBytes: number): Promise<Uint8Array> {
  assertStreamAvailable('DecompressionStream');

  return pump(bytes, new DecompressionStream('deflate-raw'), maxBytes);
}

/**
 * The encodings an XML part may be stored in. OPC (ECMA-376 Part 2) allows UTF-8 and UTF-16.
 */
export type XmlTextEncoding = 'utf-8' | 'utf-16le' | 'utf-16be';

/**
 * How many leading bytes `sniffXmlEncoding` needs to tell every encoding apart: a UTF-16 part
 * without a byte-order mark is known by its `<?` spelled over four bytes.
 */
const ENCODING_SNIFF_BYTES = 4;

/**
 * The encoding of an XML part, from its first bytes (XML 1.0, appendix F): `FF FE` is UTF-16LE and
 * `FE FF` is UTF-16BE, each with a byte-order mark; `3C 00 3F 00` and `00 3C 00 3F` are the same two
 * without one (`<?`, the XML declaration every such part starts with). Anything else is UTF-8. Every
 * part used to be decoded as UTF-8, so a UTF-16 workbook (the Windows Phone Office app saved them)
 * was refused as "malformed at offset 2".
 */
export function sniffXmlEncoding(bytes: Uint8Array): XmlTextEncoding {
  const [b0, b1, b2, b3] = bytes;

  if ((b0 === 0xFF && b1 === 0xFE) || (b0 === 0x3C && b1 === 0x00 && b2 === 0x3F && b3 === 0x00)) {
    return 'utf-16le';
  }

  if ((b0 === 0xFE && b1 === 0xFF) || (b0 === 0x00 && b1 === 0x3C && b2 === 0x00 && b3 === 0x3F)) {
    return 'utf-16be';
  }

  return 'utf-8';
}

/**
 * A streaming decoder for one XML part that picks its encoding from the part's first bytes. The
 * first chunk of a stream may be shorter than the sniff needs, so bytes are held back until four
 * have arrived (or the stream ends) and the decoder is created then. The byte-order mark is
 * stripped either way, because the decoder still sees the part's first bytes first.
 */
export class XmlTextDecoder {
  /**
   * The decoder, once the encoding is known.
   */
  #decoder: TextDecoder | null = null;
  /**
   * The bytes held back while fewer than `ENCODING_SNIFF_BYTES` have arrived.
   */
  #pending: Uint8Array = new Uint8Array(0);

  /**
   * Decodes the next chunk of the part, returning the text it completes.
   */
  write(chunk: Uint8Array): string {
    if (this.#decoder !== null) {
      return this.#decoder.decode(chunk, { stream: true });
    }

    const joined = new Uint8Array(this.#pending.byteLength + chunk.byteLength);

    joined.set(this.#pending);
    joined.set(chunk, this.#pending.byteLength);

    if (joined.byteLength < ENCODING_SNIFF_BYTES) {
      this.#pending = joined;

      return '';
    }

    this.#pending = new Uint8Array(0);

    return this.#start(joined).decode(joined, { stream: true });
  }

  /**
   * Ends the part, returning whatever text the held-back bytes still complete.
   */
  end(): string {
    const decoder = this.#decoder ?? this.#start(this.#pending);
    const tail = this.#pending;

    this.#pending = new Uint8Array(0);

    return decoder.decode(tail);
  }

  /**
   * Creates the decoder the part's first bytes call for.
   */
  #start(firstBytes: Uint8Array): TextDecoder {
    this.#decoder = new TextDecoder(sniffXmlEncoding(firstBytes), { ignoreBOM: false });

    return this.#decoder;
  }
}

/**
 * Decompresses raw DEFLATE bytes straight into text, refusing output above `maxBytes`.
 *
 * Every part this reader inflates is XML, and collecting the bytes first costs the whole part three
 * times over: the chunk list, the joined copy, and the decoded string. Decoding each chunk as it
 * arrives - through ONE decoder in `stream: true` mode, so a multi-byte character split across a
 * chunk boundary still decodes correctly - drops the first two of those. The decoder is an
 * `XmlTextDecoder`, so a UTF-16 part decodes as UTF-16 and its byte-order mark is stripped.
 *
 * `refuse` raises the overshoot. A caller whose ceiling is the smaller of several limits passes the
 * sentence of the limit it chose, so the refusal never quotes a number that is nobody's cap.
 * `observe` sees every inflated chunk before it is decoded, which is how the ZIP reader checks an
 * entry's CRC-32 without ever holding its bytes.
 *
 * `textLimit` bounds the decoded STRING as it grows, charged at two bytes per UTF-16 unit - the
 * weight the archive reader charges the finished string at. Without it a hostile part grew the
 * text to the whole remaining budget before the read refused it, and Firefox peaked at about
 * +1 GB on a part declaring 500 MiB (the bytes alone stay near +280 MB). With it the stream stops at
 * the moment the final charge would refuse the part, so the same files are refused, only sooner.
 */
export async function inflateRawText(
  bytes: Uint8Array,
  maxBytes: number,
  refuse: () => never = refuseAboveCeiling(maxBytes),
  observe: (chunk: Uint8Array) => void = () => {},
  textLimit?: { maxBytes: number; refuse: (stringBytes: number) => never },
): Promise<InflatedText> {
  assertStreamAvailable('DecompressionStream');

  const decoder = new XmlTextDecoder();
  let text = '';
  const byteLength = await drain(bytes, new DecompressionStream('deflate-raw'), maxBytes, (chunk) => {
    observe(chunk);
    text += decoder.write(chunk);

    if (textLimit !== undefined && text.length * 2 > textLimit.maxBytes) {
      textLimit.refuse(text.length * 2);
    }
  }, refuse);

  return { text: text + decoder.end(), byteLength };
}
