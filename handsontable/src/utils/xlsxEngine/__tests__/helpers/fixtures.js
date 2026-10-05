/**
 * Reading the `.xlsx` fixtures, in ONE place. Both halves were hand-copied into four test files
 * (`nativeRead`, `nativeWrite`, `enginesParity` and `importFile.unit.js`) before this helper
 * existed.
 *
 * Coverage limit worth remembering while using it: every fixture beside this directory is written
 * by ExcelJS through `fixtures/generate.mjs`, so a fixture-based test proves the native reader
 * against ONE writer's OOXML dialect. `xlsxEngine/AGENTS.md` says so in its testing section.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readZip } from '../../adapters/native/zip/reader';
import { writeZip } from '../../adapters/native/zip/writer';

/**
 * Reads a fixture file into the `ArrayBuffer` an adapter's `read()` expects.
 *
 * @param {string} name The fixture name, without the extension.
 * @returns {ArrayBuffer}
 */
export function loadFixture(name) {
  const bytes = readFileSync(join(__dirname, '..', 'fixtures', `${name}.xlsx`));

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Converts a `Uint8Array` (what both adapters' `write()` returns, and what `writeZip` returns) into
 * the `ArrayBuffer` slice both adapters' `read()` and `readZip()` expect.
 *
 * @param {Uint8Array} bytes The bytes to detach.
 * @returns {ArrayBuffer}
 */
export function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Rewrites the XML parts of an archive and packs it again with the native ZIP writer - how a test
 * gives the readers a dialect no writer here produces (LibreOffice's `"true"`/`"false"` attribute
 * spelling, for one). `transform(partName, text)` returns the part's new text.
 *
 * @param {ArrayBuffer|Uint8Array} archive The archive to rewrite.
 * @param {Function} transform Rewrites one part.
 * @returns {Promise<ArrayBuffer>}
 */
export async function rewriteArchive(archive, transform) {
  const encoder = new TextEncoder();
  const zip = await readZip(archive instanceof Uint8Array ? toArrayBuffer(archive) : archive);
  const entries = [];

  for (const partName of zip.names()) {
    // eslint-disable-next-line no-await-in-loop -- one entry at a time, as the reader reads them.
    const text = await zip.text(partName);

    entries.push({ name: partName, data: encoder.encode(transform(partName, text)) });
  }

  return toArrayBuffer(await writeZip(entries, true));
}
