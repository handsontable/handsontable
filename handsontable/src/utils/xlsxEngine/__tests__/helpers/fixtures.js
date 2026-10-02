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
