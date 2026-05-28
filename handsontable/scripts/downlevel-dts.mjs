#!/usr/bin/env node
/**
 * Post-processes tmp/**\/*.d.ts to replace TypeScript lib types added after
 * TS 5.1 with TS 5.1-compatible equivalents.
 *
 * Run after `build:types`. Idempotent.
 *
 * The published .d.ts must be consumable by TypeScript 5.1+.
 * The dev compiler may be a newer TS version — only the output is downleveled.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const tmpDir = join(projectRoot, 'tmp');

/**
 * Replacement table: types emitted by TS >= 5.2 / 5.6 that TS 5.1 doesn't know.
 * Processed in order — more specific patterns (with generics) come first.
 *
 * @type {Array<Array>}
 */
const REPLACEMENTS = [
  // TS 5.6 — generic iterator types (collapse multi-tparam form to single-tparam supertype)
  [/\bIteratorObject<\s*([^,>]+)\s*(?:,[^>]+)?>/g, 'IterableIterator<$1>'],
  [/\bAsyncIteratorObject<\s*([^,>]+)\s*(?:,[^>]+)?>/g, 'AsyncIterableIterator<$1>'],
  // TS 5.6 — named built-in iterator types (subtypes of IterableIterator<T>)
  [/\bArrayIterator\b/g, 'IterableIterator'],
  [/\bMapIterator\b/g, 'IterableIterator'],
  [/\bSetIterator\b/g, 'IterableIterator'],
  [/\bStringIterator\b/g, 'IterableIterator'],
  [/\bBuiltinIteratorReturn\b/g, 'any'],
  // TS 5.2 — constraint type for WeakMap / WeakSet keys (was `object` before 5.2)
  [/\bWeakKey\b/g, 'object'],
  // TS 5.2 — using-statement dispose types (speculative; extend if CI catches more)
  [/\bDisposable\b/g, '{ [Symbol.dispose](): void }'],
  [/\bAsyncDisposable\b/g, '{ [Symbol.asyncDispose](): PromiseLike<void> }'],
];

/**
 * Recursively yields all *.d.ts file paths under `dir`, skipping *.d.ts.map.
 *
 * @param {string} dir - Directory to walk.
 * @returns {AsyncGenerator<string>}
 */
async function* walkDts(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* walkDts(fullPath);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.d.ts.map')
    ) {
      yield fullPath;
    }
  }
}

let filesRewrote = 0;
let totalReplacements = 0;

try {
  for await (const filePath of walkDts(tmpDir)) {
    const original = await readFile(filePath, 'utf8');
    let updated = original;
    let fileReplacements = 0;

    for (const [regex, replacement] of REPLACEMENTS) {
      const matches = updated.match(regex);

      if (matches) {
        fileReplacements += matches.length;
        updated = updated.replace(regex, replacement);
      }
    }

    if (updated !== original) {
      await writeFile(filePath, updated, 'utf8');
      filesRewrote += 1;
      totalReplacements += fileReplacements;
    }
  }

  console.log(`downlevel-dts: rewrote ${filesRewrote} files (${totalReplacements} replacements)`);
} catch (err) {
  console.error(`downlevel-dts: error — ${err.message}`);
  process.exit(1);
}
