import { throwWithCause } from '../../../../../helpers/errors';

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
        throwWithCause(`The archive entry inflates above the ${maxBytes}-byte limit this reader accepts.`);
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
 * Compresses bytes with raw DEFLATE (no zlib header), the method ZIP entries use.
 */
export function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  return pump(bytes, new CompressionStream('deflate-raw'), Number.POSITIVE_INFINITY);
}

/**
 * Decompresses raw DEFLATE bytes, refusing output above `maxBytes`.
 */
export function inflateRaw(bytes: Uint8Array, maxBytes: number): Promise<Uint8Array> {
  return pump(bytes, new DecompressionStream('deflate-raw'), maxBytes);
}
