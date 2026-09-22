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
 * Pushes `bytes` through a transform stream and collects the output, refusing to collect more
 * than `maxBytes`. The write side is started and left running while the read loop drains the
 * readable, which is what keeps a transform with backpressure from deadlocking.
 */
async function pump(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  maxBytes: number
): Promise<Uint8Array> {
  const writer = transform.writable.getWriter();
  const reader = transform.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let writeError: unknown = null;

  const writing = writer.write(ownedCopy(bytes))
    .then(() => writer.close())
    .catch((error: unknown) => {
      writeError = error;
    });

  try {
    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      total += value.byteLength;

      if (total > maxBytes) {
        // eslint-disable-next-line no-await-in-loop
        await reader.cancel();
        throwLimitExceeded(`The archive entry inflates above the ${maxBytes}-byte limit this reader accepts.`);
      }

      chunks.push(value);
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
