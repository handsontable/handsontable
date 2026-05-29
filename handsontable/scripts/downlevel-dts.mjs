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
 * Simple regex replacement table: types emitted by TS >= 5.2 / 5.6 that TS 5.1
 * doesn't know. Processed in order.
 *
 * Generic types whose first type parameter may itself contain angle brackets
 * (e.g. IteratorObject<Map<K,V>,...>) are handled separately by
 * replaceGenericType() below — [^,>]+ can't match balanced nested generics.
 *
 * @type {Array<Array>}
 */
const REPLACEMENTS = [
  // TS 5.6 — named built-in iterator types (subtypes of IterableIterator<T>)
  [/\bArrayIterator\b/g, 'IterableIterator'],
  [/\bMapIterator\b/g, 'IterableIterator'],
  [/\bSetIterator\b/g, 'IterableIterator'],
  [/\bStringIterator\b/g, 'IterableIterator'],
  [/\bBuiltinIteratorReturn\b/g, 'any'],
  // TS 5.2 — constraint type for WeakMap / WeakSet keys (was `object` before 5.2)
  [/\bWeakKey\b/g, 'object'],
  // TS 5.2 — using-statement dispose types (speculative; extend if CI catches more).
  // Symbol.dispose / Symbol.asyncDispose are also TS 5.2+, so we replace with
  // `object` rather than a struct that references those symbols.
  [/\bDisposable\b/g, 'object'],
  [/\bAsyncDisposable\b/g, 'object'],
];

/**
 * Generic types where the first type parameter must be preserved but additional
 * parameters must be dropped. Handled with bracket-balancing rather than regex
 * so that nested generics like `IteratorObject<Map<K, V>, undefined>` are parsed
 * correctly.
 *
 * Each entry is [sourceTypeName, replacementTypeName].
 *
 * @type {Array<Array>}
 */
const GENERIC_REPLACEMENTS = [
  // TS 5.6 — collapse multi-tparam iterator objects to single-tparam supertype
  ['IteratorObject', 'IterableIterator'],
  ['AsyncIteratorObject', 'AsyncIterableIterator'],
];

/**
 * Replaces every occurrence of `typeName<T1[, ...]>` with `replacement<T1>`,
 * where T1 may itself contain nested angle-bracketed generics. Uses bracket
 * depth counting instead of a regex character class so that inputs like
 * `IteratorObject<Map<K, V>, undefined>` are handled correctly.
 *
 * @param {string} str - Source string.
 * @param {string} typeName - Identifier to find (e.g. 'IteratorObject').
 * @param {string} replacement - Replacement identifier (e.g. 'IterableIterator').
 * @returns {{ result: string, count: number }}
 */
function replaceGenericType(str, typeName, replacement) {
  const prefix = `${typeName}<`;
  let result = str;
  let count = 0;
  let searchFrom = 0;

  for (;;) {
    const idx = result.indexOf(prefix, searchFrom);

    if (idx === -1) {
      break;
    }

    // Enforce word boundary: the char immediately before must not be \w.
    if (idx > 0 && /\w/.test(result[idx - 1])) {
      searchFrom = idx + 1;
      continue;
    }

    const paramStart = idx + prefix.length;

    // Walk forward to find where the first type parameter ends (depth-aware).
    let depth = 1;
    let firstParamEnd = paramStart;

    while (firstParamEnd < result.length && depth > 0) {
      const ch = result[firstParamEnd];

      if (ch === '<') {
        depth += 1;
      } else if (ch === '>') {
        depth -= 1;

        if (depth === 0) {
          break; // closing '>' of whole TypeName<...>
        }
      } else if (ch === ',' && depth === 1) {
        break; // comma separating first from second type param
      }

      firstParamEnd += 1;
    }

    const firstParam = result.slice(paramStart, firstParamEnd).trim();

    // Walk forward from paramStart to find the closing '>' of the whole expression.
    let closeDepth = 1;
    let closePos = paramStart;

    while (closePos < result.length && closeDepth > 0) {
      const ch = result[closePos];

      if (ch === '<') {
        closeDepth += 1;
      } else if (ch === '>') {
        closeDepth -= 1;
      }

      closePos += 1;
    }

    const newToken = `${replacement}<${firstParam}>`;

    result = result.slice(0, idx) + newToken + result.slice(closePos);
    count += 1;
    searchFrom = idx + newToken.length;
  }

  return { result, count };
}

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

const EXPORT_STAR_AS_RE = /\bexport\s+\*\s+as\b/;

/**
 * Recursively yields all *.mjs and *.js file paths under `dir`.
 *
 * @param {string} dir - Directory to walk.
 * @returns {AsyncGenerator<string>}
 */
async function* walkEsm(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* walkEsm(fullPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.mjs') || entry.name.endsWith('.js'))
    ) {
      yield fullPath;
    }
  }
}

// Regression guard: fail if "export * as" appears in ESM runtime output.
// This syntax crashes Parcel v1 silently. The fix belongs in the source file,
// not here — this check only detects regressions.
const violations = [];

for await (const filePath of walkEsm(tmpDir)) {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (EXPORT_STAR_AS_RE.test(lines[i])) {
      violations.push(`  ${filePath}:${i + 1}: ${lines[i].trim()}`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    'downlevel-dts: FATAL — "export * as" found in ESM output.\n' +
    'This syntax crashes Parcel v1 consumers. Fix the source file by replacing:\n' +
    "  export * as X from 'y';\n" +
    'with:\n' +
    "  import * as X from 'y';\n" +
    '  export { X };\n\n' +
    'Offending locations:\n' +
    violations.join('\n')
  );
  process.exit(1);
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

    for (const [typeName, replacement] of GENERIC_REPLACEMENTS) {
      const { result, count } = replaceGenericType(updated, typeName, replacement);

      if (count > 0) {
        updated = result;
        fileReplacements += count;
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
