import { throwWithCause } from '../../../../../helpers/errors';
import { throwLimitExceeded } from '../../../limits';

/**
 * Copies bytes into a fresh view over its own `ArrayBuffer`. The stream writer accepts only
 * `BufferSource` (a view over `ArrayBuffer`, not `ArrayBufferLike`), and handing the transform a
 * private copy keeps the caller's buffer out of the stream's ownership.
 */
function ownedCopy(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
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
  text: string;
  byteLength: number;
}

/**
 * Pushes `bytes` through a transform stream and hands each output chunk to `onChunk`, refusing to
 * produce more than `maxBytes`. The write side is started and left running while the read loop
 * drains the readable, which is what keeps a transform with backpressure from deadlocking.
 *
 * The caller decides what to do with a chunk: collecting them costs the whole output twice (the
 * chunk list and the joined copy), which a text reader avoids by decoding each chunk as it arrives.
 */
async function drain(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  maxBytes: number,
  onChunk: (chunk: Uint8Array) => void
): Promise<number> {
  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();
  let total = 0;
  let writeError: unknown = null;

  const writing = writer.write(ownedCopy(bytes))
    .then(() => writer.close())
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
        throwLimitExceeded(`The archive entry inflates above the ${maxBytes}-byte limit this reader accepts.`);
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
  const total = await drain(bytes, transform, maxBytes, chunk => chunks.push(chunk));
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
 */
export async function inflateRawText(bytes: Uint8Array, maxBytes: number): Promise<InflatedText> {
  assertStreamAvailable('DecompressionStream');

  const decoder = new TextDecoder('utf-8', { ignoreBOM: false });
  let text = '';
  const byteLength = await drain(bytes, new DecompressionStream('deflate-raw'), maxBytes, (chunk) => {
    text += decoder.decode(chunk, { stream: true });
  });

  return { text: text + decoder.decode(), byteLength };
}
