/**
 * @jest-environment node
 */
import { deflateRaw, inflateRaw } from '../adapters/native/zip/streams';
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
