/**
 * @jest-environment node
 */
import { WritableStreamDefaultWriter } from 'node:stream/web';
import { deflateRaw, inflateRaw, inflateRawText, STREAM_WRITE_CHUNK_BYTES } from '../adapters/native/zip/streams';
import { nativeAdapter } from '../adapters/native';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';

/**
 * Runs `fn` with `name` removed from the global object, then puts it back.
 *
 * @param {string} name The global to remove.
 * @param {Function} fn The body to run.
 * @returns {Promise<*>}
 */
async function withoutGlobal(name, fn) {
  const saved = globalThis[name];

  delete globalThis[name];

  try {
    return await fn();
  } finally {
    globalThis[name] = saved;
  }
}

describe('native zip streams without the Compression Streams API', () => {
  it('should refuse to deflate with a message naming CompressionStream and both ways out', async() => {
    // jsdom, Vitest's jsdom environment and Jest's default environment have neither global, and
    // this used to surface as a bare `ReferenceError` from inside the zip writer.
    await withoutGlobal('CompressionStream', async() => {
      // The guard runs before the promise is built, so this throws synchronously; inside the
      // async zip writer the same throw surfaces as a rejection (the export case below).
      expect(() => deflateRaw(new Uint8Array([1, 2, 3]))).toThrow(
        'CompressionStream is not available here, and the built-in xlsx engine needs the Web '
        + 'Compression Streams API. Run Handsontable in a browser or on Node 18+, or inject ExcelJS '
        + 'through the `engines` option.'
      );
    });
  });

  it('should refuse to inflate with a message naming DecompressionStream and both ways out', async() => {
    await withoutGlobal('DecompressionStream', async() => {
      expect(() => inflateRaw(new Uint8Array([1, 2, 3]), 1024)).toThrow(
        'DecompressionStream is not available here, and the built-in xlsx engine needs the Web '
        + 'Compression Streams API. Run Handsontable in a browser or on Node 18+, or inject ExcelJS '
        + 'through the `engines` option.'
      );
    });
  });

  it('should surface the same message from a native export', async() => {
    const snapshot = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Sheet1');

    sheet.cell(1, 1).value = 'text';
    snapshot.sheets.push(sheet.toSnapshot());
    snapshot.compression = 6;

    await withoutGlobal('CompressionStream', async() => {
      await expect(nativeAdapter.write(snapshot, undefined, new DroppedFeatures()))
        .rejects.toThrow(/the built-in xlsx engine needs the Web Compression Streams API/);
    });
  });

  it('should still round-trip bytes when both globals are present', async() => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 5, 5, 5, 5]);

    expect(Array.from(await inflateRaw(await deflateRaw(bytes), 1024))).toEqual(Array.from(bytes));
  });
});

/**
 * Bytes that DEFLATE cannot shrink, so the compressed form is about as long as the input and the
 * inflate below has several write slices to make.
 *
 * @param {number} length How many bytes to produce.
 * @returns {Uint8Array}
 */
function incompressible(length) {
  const bytes = new Uint8Array(length);
  let state = 0x2545F491;

  for (let i = 0; i < length; i++) {
    // A xorshift32 step: deterministic, and dense enough that DEFLATE finds nothing to reuse.
    /* eslint-disable no-bitwise */
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    bytes[i] = state & 0xFF;
    /* eslint-enable no-bitwise */
  }

  return bytes;
}

/**
 * Records every chunk handed to a stream writer while `fn` runs.
 *
 * @param {Function} fn The body to run.
 * @returns {Promise<Array<number>>} The byte length of each write, in order.
 */
async function writtenChunkLengths(fn) {
  const spy = jest.spyOn(WritableStreamDefaultWriter.prototype, 'write');

  try {
    await fn();

    return spy.mock.calls.map(([chunk]) => chunk.byteLength);
  } finally {
    spy.mockRestore();
  }
}

describe('native zip streams: the input is written in bounded slices', () => {
  // Node's DecompressionStream honors its writable highWaterMark, so the browser failure — the
  // whole entry inflated inside one transform() call, every output buffer enqueued before the read
  // loop's cap can cancel — cannot be observed under Jest. What CAN be pinned is the shape of the
  // writes, which is what bounds the browser's queue: one slice's output at most.
  it('should hand the transform the input in slices of at most STREAM_WRITE_CHUNK_BYTES', async() => {
    const input = incompressible(100 * 1024);
    const deflated = await deflateRaw(input);

    expect(deflated.byteLength).toBeGreaterThan(STREAM_WRITE_CHUNK_BYTES * 3);

    let inflated;
    const lengths = await writtenChunkLengths(async() => {
      inflated = await inflateRaw(deflated, input.byteLength);
    });

    expect(lengths.length).toBe(Math.ceil(deflated.byteLength / STREAM_WRITE_CHUNK_BYTES));
    lengths.forEach(length => expect(length).toBeLessThanOrEqual(STREAM_WRITE_CHUNK_BYTES));
    expect(lengths.reduce((sum, length) => sum + length, 0)).toBe(deflated.byteLength);
    expect(Array.from(inflated)).toEqual(Array.from(input));
  });

  it('should slice the text path the same way and decode across slice boundaries', async() => {
    // Three-byte characters chosen from incompressible bytes, so the compressed form spans several
    // slices and a character is bound to straddle a slice boundary.
    const seed = incompressible(80_000);
    const text = Array.from(
      seed.subarray(0, 40_000),
      // eslint-disable-next-line no-bitwise -- 0x4E00..0x6DFF, inside the CJK block (three UTF-8 bytes each).
      (byte, i) => String.fromCodePoint(0x4E00 + ((byte & 0x1F) * 256) + seed[40_000 + i])
    ).join('');
    const encoded = new TextEncoder().encode(text);
    const deflated = await deflateRaw(encoded);

    expect(deflated.byteLength).toBeGreaterThan(STREAM_WRITE_CHUNK_BYTES * 3);

    let result;
    const lengths = await writtenChunkLengths(async() => {
      result = await inflateRawText(deflated, encoded.byteLength);
    });

    expect(lengths.length).toBe(Math.ceil(deflated.byteLength / STREAM_WRITE_CHUNK_BYTES));
    expect(result.text).toBe(text);
    expect(result.byteLength).toBe(encoded.byteLength);
  });

  it('should still reject corrupt input with the archive-entry message', async() => {
    const corrupt = incompressible((STREAM_WRITE_CHUNK_BYTES * 2) + 17);

    // Node rejects with an EMPTY message (the reason is only in `code`), so the sentence used to end
    // at the colon: a reason must follow it.
    await expect(inflateRaw(corrupt, 1024 * 1024)).rejects.toThrow(/^The archive entry could not be processed: \S/);
    await expect(inflateRaw(corrupt, 1024 * 1024)).rejects.toMatchObject({ cause: { handsontable: true } });
  });

  it('should stop a text inflate once the decoded string outweighs its text limit', async() => {
    const deflated = await deflateRaw(new TextEncoder().encode('a'.repeat(STREAM_WRITE_CHUNK_BYTES * 8)));
    const refusal = (stringBytes) => { throw new Error(`text limit at ${stringBytes}`); };

    // The bytes fit their own ceiling; the string, two bytes per unit, passes the text limit.
    await expect(inflateRawText(deflated, Number.MAX_SAFE_INTEGER, undefined, undefined, {
      maxBytes: STREAM_WRITE_CHUNK_BYTES * 4, refuse: refusal,
    })).rejects.toThrow(/text limit at \d+$/);
    // Under the limit it reads to the end.
    await expect(inflateRawText(deflated, Number.MAX_SAFE_INTEGER, undefined, undefined, {
      maxBytes: STREAM_WRITE_CHUNK_BYTES * 16, refuse: refusal,
    })).resolves.toMatchObject({ byteLength: STREAM_WRITE_CHUNK_BYTES * 8 });
  });

  it('should still raise the caller\'s refusal when the output passes the cap mid-stream', async() => {
    const deflated = await deflateRaw(new Uint8Array(STREAM_WRITE_CHUNK_BYTES * 64));
    const refuse = jest.fn(() => {
      throw Object.assign(new Error('caller refusal'), { cause: { handsontable: true, limit: true } });
    });

    await expect(inflateRawText(deflated, 1000, refuse)).rejects.toThrow('caller refusal');
    expect(refuse).toHaveBeenCalledTimes(1);
  });
});
