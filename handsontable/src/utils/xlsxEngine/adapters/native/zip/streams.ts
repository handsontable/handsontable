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
   * The whole output of the stream, decoded as UTF-8.
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
 * Writes `bytes` to the transform one slice at a time, then closes the writable. Each write is
 * awaited before the next starts, so at most one slice is inside the transform at once; a cancel
 * from the read loop rejects the pending write, which the caller's `catch` absorbs.
 */
async function writeSliced(
  writer: WritableStreamDefaultWriter<BufferSource>,
  bytes: Uint8Array<ArrayBuffer>
): Promise<void> {
  for (let offset = 0; offset < bytes.byteLength; offset += STREAM_WRITE_CHUNK_BYTES) {
    // The next slice must not be queued before this one has been taken: a transform inflates a
    // whole written chunk at once, so the queue would hold every slice's output at the same time.
    // eslint-disable-next-line no-await-in-loop -- one slice in flight at a time, by design.
    await writer.write(bytes.subarray(offset, offset + STREAM_WRITE_CHUNK_BYTES));
  }

  await writer.close();
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
  refuse: () => never
): Promise<number> {
  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();
  let total = 0;
  let writeError: unknown = null;

  const writing = writeSliced(writer, asBufferSource(bytes))
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

    throwWithCause(`The archive entry could not be processed: ${(error as Error).message}`);
  }

  await writing;

  if (writeError !== null) {
    throwWithCause(`The archive entry could not be processed: ${(writeError as Error).message}`);
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
  maxBytes: number
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const total = await drain(bytes, transform, maxBytes, chunk => chunks.push(chunk), refuseAboveCeiling(maxBytes));
  const out = new Uint8Array(total);
  let offset = 0;

  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return out;
}

/**
 * Refuses the operation when the host has no Compression Streams API. jsdom, Vitest's jsdom
 * environment and Jest's default environment all lack both globals, and without this the engine
 * failed with a bare `ReferenceError` raised from inside this module.
 */
function assertStreamAvailable(globalName: 'CompressionStream' | 'DecompressionStream'): void {
  const available = globalName === 'CompressionStream'
    ? typeof CompressionStream !== 'undefined'
    : typeof DecompressionStream !== 'undefined';

  if (!available) {
    throwWithCause(`${globalName} is not available here, and the built-in xlsx engine needs the Web `
      + 'Compression Streams API. Run Handsontable in a browser or on Node 18+, or inject ExcelJS '
      + 'through the `engines` option.');
  }
}

/**
 * Compresses bytes with raw DEFLATE (no zlib header), the method ZIP entries use.
 */
export function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  assertStreamAvailable('CompressionStream');

  return pump(bytes, new CompressionStream('deflate-raw'), Number.POSITIVE_INFINITY);
}

/**
 * Decompresses raw DEFLATE bytes, refusing output above `maxBytes`.
 */
export function inflateRaw(bytes: Uint8Array, maxBytes: number): Promise<Uint8Array> {
  assertStreamAvailable('DecompressionStream');

  return pump(bytes, new DecompressionStream('deflate-raw'), maxBytes);
}

/**
 * Decompresses raw DEFLATE bytes straight into text, refusing output above `maxBytes`.
 *
 * Every part this reader inflates is XML, and collecting the bytes first costs the whole part three
 * times over: the chunk list, the joined copy, and the decoded string. Decoding each chunk as it
 * arrives - through ONE decoder in `stream: true` mode, so a multi-byte character split across a
 * chunk boundary still decodes correctly - drops the first two of those. A byte-order mark is still
 * stripped, because the decoder sees the stream's first bytes first.
 *
 * `refuse` raises the overshoot. A caller whose ceiling is the smaller of several limits passes the
 * sentence of the limit it chose, so the refusal never quotes a number that is nobody's cap.
 * `observe` sees every inflated chunk before it is decoded, which is how the ZIP reader checks an
 * entry's CRC-32 without ever holding its bytes.
 */
export async function inflateRawText(
  bytes: Uint8Array,
  maxBytes: number,
  refuse: () => never = refuseAboveCeiling(maxBytes),
  observe: (chunk: Uint8Array) => void = () => {}
): Promise<InflatedText> {
  assertStreamAvailable('DecompressionStream');

  const decoder = new TextDecoder('utf-8', { ignoreBOM: false });
  let text = '';
  const byteLength = await drain(bytes, new DecompressionStream('deflate-raw'), maxBytes, (chunk) => {
    observe(chunk);
    text += decoder.decode(chunk, { stream: true });
  }, refuse);

  return { text: text + decoder.decode(), byteLength };
}
