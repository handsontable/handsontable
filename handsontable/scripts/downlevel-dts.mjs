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
 * Recursively yields file paths under `dir` whose names satisfy `predicate`.
 *
 * @param {string} dir - Directory to walk.
 * @param {function(string): boolean} predicate - Returns true for file names to include.
 * @returns {AsyncGenerator<string>}
 */
async function* walkFiles(dir, predicate) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* walkFiles(fullPath, predicate);
    } else if (entry.isFile() && predicate(entry.name)) {
      yield fullPath;
    }
  }
}

/**
 * @param {string} name - File name to test.
 * @returns {boolean}
 */
const isDts = name => name.endsWith('.d.ts') && !name.endsWith('.d.ts.map');

/**
 * @param {string} name - File name to test.
 * @returns {boolean}
 */
const isEsm = name => name.endsWith('.mjs') || name.endsWith('.js');

/**
 * Patterns that must never appear in the ESM runtime output (`tmp/**\/*.mjs`,
 * `tmp/**\/*.js`). Each entry is checked line-by-line; a match causes the
 * script to exit with a non-zero code and print the offending file:line.
 *
 * To add a new guard, append an entry:
 *   { pattern: /your-regex/, message: 'human-readable description of the problem and fix' }
 *
 * @type {Array<{ pattern: RegExp, message: string }>}
 */
const ESM_FORBIDDEN = [
  {
    pattern: /\bexport\s+\*\s+as\b/,
    message:
      '"export * as" found in ESM output. ' +
      'This syntax crashes Parcel v1 consumers. Fix the source file by replacing:\n' +
      '  export * as X from \'y\';\n' +
      'with:\n' +
      '  import * as X from \'y\';\n' +
      '  export { X };',
  },
];

// Regression guard: scan ESM output for forbidden patterns.
// Fixes belong in source files — this check only detects regressions.
let esmGuardFailed = false;

for await (const filePath of walkFiles(tmpDir, isEsm)) {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');

  for (const { pattern, message } of ESM_FORBIDDEN) {
    const violations = [];

    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        violations.push(`  ${filePath}:${i + 1}: ${lines[i].trim()}`);
      }
    }

    if (violations.length > 0) {
      console.error(
        `downlevel-dts: FATAL — ${message}\n\n` +
        `Offending locations:\n${violations.join('\n')}`
      );
      esmGuardFailed = true;
    }
  }
}

if (esmGuardFailed) {
  process.exit(1);
}

let filesRewrote = 0;
let totalReplacements = 0;

try {
  for await (const filePath of walkFiles(tmpDir, isDts)) {
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
