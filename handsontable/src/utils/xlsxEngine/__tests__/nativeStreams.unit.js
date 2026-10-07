/**
 * @jest-environment node
 */
import { WritableStreamDefaultWriter } from 'node:stream/web';
import * as streams from '../adapters/native/zip/streams';
import { deflateRaw, inflateRaw, inflateRawText, STREAM_WRITE_CHUNK_BYTES } from '../adapters/native/zip/streams';
import { readZip } from '../adapters/native/zip/reader';
import { MAX_INFLATED_TOTAL_BYTES } from '../limits';
import { loadFixture } from './helpers/fixtures';
import { nativeAdapter } from '../adapters/native';
import { DroppedFeatures } from '../capabilities';
import { createWorkbookSnapshot } from '../model';
import { SheetBuilder } from '../builder';

/**
 * Runs `fn` with every global in `names` removed from the global object, then puts them back.
 *
 * @param {string|string[]} names The globals to remove.
 * @param {Function} fn The body to run.
 * @returns {Promise<*>}
 */
async function withoutGlobal(names, fn) {
  const list = Array.isArray(names) ? names : [names];
  const saved = list.map(name => globalThis[name]);

  list.forEach((name) => {
    delete globalThis[name];
  });

  try {
    return await fn();
  } finally {
    list.forEach((name, i) => {
      globalThis[name] = saved[i];
    });
  }
}

/**
 * The refusal the engine raises when the host lacks `missing`.
 *
 * @param {string} missing The missing globals, as the message lists them.
 * @returns {string}
 */
function missingGlobalsMessage(missing) {
  return `The built-in xlsx engine needs ${missing}, which this environment does not define. In a test `
    + 'environment such as jsdom, assign CompressionStream and DecompressionStream from `node:stream/web` '
    + 'and TextEncoder and TextDecoder from `node:util` to the global object, or inject ExcelJS through the '
    + '`engines` option.';
}

/**
 * A one-sheet snapshot to export.
 *
 * @returns {object}
 */
function oneSheetSnapshot() {
  const snapshot = createWorkbookSnapshot();
  const sheet = new SheetBuilder('Sheet1');

  sheet.cell(1, 1).value = 'text';
  snapshot.sheets.push(sheet.toSnapshot());
  snapshot.compression = 6;

  return snapshot;
}

describe('native engine without the globals it needs', () => {
  it('should refuse to deflate with a message naming CompressionStream and both ways out', async() => {
    await withoutGlobal('CompressionStream', async() => {
      // The guard runs before the promise is built, so this throws synchronously.
      expect(() => deflateRaw(new Uint8Array([1, 2, 3]))).toThrow(missingGlobalsMessage('CompressionStream'));
    });
  });

  it('should refuse to inflate with a message naming DecompressionStream and both ways out', async() => {
    await withoutGlobal('DecompressionStream', async() => {
      expect(() => inflateRaw(new Uint8Array([1, 2, 3]), 1024)).toThrow(missingGlobalsMessage('DecompressionStream'));
    });
  });

  it('should refuse an export up front when TextEncoder is missing, before it reaches a ReferenceError', async() => {
    // jsdom has neither text codec, and the export reached `new TextEncoder()` before any stream, so
    // it ended in `ReferenceError: TextEncoder is not defined`.
    await withoutGlobal('TextEncoder', async() => {
      await expect(nativeAdapter.write(oneSheetSnapshot(), undefined, new DroppedFeatures()))
        .rejects.toThrow(missingGlobalsMessage('TextEncoder'));
    });
  });

  it('should refuse an import up front when TextDecoder is missing', async() => {
    const bytes = await nativeAdapter.write(oneSheetSnapshot(), undefined, new DroppedFeatures());
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    await withoutGlobal('TextDecoder', async() => {
      await expect(nativeAdapter.read(buffer, undefined, new DroppedFeatures()))
        .rejects.toThrow(missingGlobalsMessage('TextDecoder'));
    });
  });

  it('should name every missing global at once, on both entry points', async() => {
    const all = ['CompressionStream', 'DecompressionStream', 'TextEncoder', 'TextDecoder'];
    const message = missingGlobalsMessage('CompressionStream, DecompressionStream, TextEncoder, TextDecoder');

    await withoutGlobal(all, async() => {
      await expect(nativeAdapter.write(oneSheetSnapshot(), undefined, new DroppedFeatures()))
        .rejects.toThrow(message);
      await expect(nativeAdapter.read(new ArrayBuffer(4), undefined, new DroppedFeatures()))
        .rejects.toThrow(message);
    });
  });

  it('should surface the stream message from a native export', async() => {
    await withoutGlobal('CompressionStream', async() => {
      await expect(nativeAdapter.write(oneSheetSnapshot(), undefined, new DroppedFeatures()))
        .rejects.toThrow(missingGlobalsMessage('CompressionStream'));
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

  it('should charge the decoded string at two bytes per UTF-16 unit', async() => {
    // The 64 KiB and 256 KiB limits above sit on either side of one 128 KiB string at one byte per
    // unit and at two, so they cannot tell the two charges apart; Firefox peaked near +1 GB on the
    // one-byte charge.
    const deflated = await deflateRaw(new TextEncoder().encode('a'.repeat(1000)));
    const refusal = (stringBytes) => { throw new Error(`text limit at ${stringBytes}`); };

    // 1000 units weigh 2000 bytes: over a 1500-byte limit, and exactly at a 2000-byte one.
    await expect(inflateRawText(deflated, Number.MAX_SAFE_INTEGER, undefined, undefined, {
      maxBytes: 1500, refuse: refusal,
    })).rejects.toThrow(/text limit at 2000$/);
    await expect(inflateRawText(deflated, Number.MAX_SAFE_INTEGER, undefined, undefined, {
      maxBytes: 2000, refuse: refusal,
    })).resolves.toMatchObject({ byteLength: 1000 });
  });

  it('should hand the archive reader\'s remaining budget to the inflate as its text limit', async() => {
    const spy = jest.spyOn(streams, 'inflateRawText');

    try {
      const archive = await readZip(loadFixture('values'));

      await archive.text(archive.names().find(name => name.endsWith('.xml')));

      expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls[0][4].maxBytes).toBe(MAX_INFLATED_TOTAL_BYTES);
    } finally {
      spy.mockRestore();
    }
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

describe('the Jest crypto setup', () => {
  it('should install crypto.subtle on a crypto object that has getRandomValues only', () => {
    // jsdom 20 and later define `crypto` without `subtle`; a guard on `crypto` alone skipped the
    // install there, and the sheet-password hash then failed as if the page were insecure.
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    const partial = { getRandomValues: array => array };

    Object.defineProperty(globalThis, 'crypto', { value: partial, writable: false, configurable: true });

    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require -- the setup file runs on load.
        require('../../../../test/cryptoSetup');
      });

      expect(globalThis.crypto).toBe(partial);
      expect(typeof globalThis.crypto.subtle.digest).toBe('function');
    } finally {
      Object.defineProperty(globalThis, 'crypto', saved);
    }
  });
});
