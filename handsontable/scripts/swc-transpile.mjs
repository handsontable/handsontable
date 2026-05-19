/**
 * SWC-based file-per-file transpiler. Replaces Babel CLI for build:commonjs, build:es,
 * and build:languages.es.
 *
 * Usage:
 *   node scripts/swc-transpile.mjs --format commonjs --out-dir tmp
 *   node scripts/swc-transpile.mjs --format esm --out-dir tmp --out-ext .mjs
 *   node scripts/swc-transpile.mjs --format esm --out-dir languages --out-ext .mjs \
 *        --src-dir src/i18n/languages --lang-registration
 *
 * What it does:
 * 1. Finds all .js files in --src-dir (default: src/) excluding __tests__, test/, dist/
 * 2. Transpiles each file with SWC (matching browser-targets.js)
 * 3. Strips CSS/SCSS import statements
 * 4. For ESM: rewrites local import paths to add the target extension
 * 5. Inlines process.env.HOT_* variables
 * 6. With --lang-registration: injects Handsontable language dictionary registration
 * 7. Writes output to --out-dir preserving directory structure
 */
import { transformFileSync } from '@swc/core';
import { writeFileSync, mkdirSync, existsSync, lstatSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const currentDir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(currentDir, '..');

// Parse CLI args. `indexOf` returns -1 when the flag is absent, so reading
// `args[-1 + 1]` (i.e. `args[0]`) silently substitutes an unrelated argument
// for a missing value. Guard on -1 before indexing.
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf(name);

  return idx !== -1 ? args[idx + 1] : fallback;
};
const format = getArg('--format', 'commonjs');
const outDir = resolve(ROOT, getArg('--out-dir', 'tmp'));
const outExt = getArg('--out-ext', '.js');
const srcDir = resolve(ROOT, getArg('--src-dir', 'src'));
const langRegistration = args.includes('--lang-registration');

const IGNORE_PATTERNS = [/__tests__/, /[/\\]test[/\\]/, /[/\\]dist[/\\]/];
// Matches a whole line that is either `import '…css';` (ESM side-effect) or
// `require('…css');` (CJS side-effect). Both alternatives share the `^…\s*$`
// anchors so partial mid-line matches like `var _x = require('…css');` cannot
// be stripped and leave invalid fragments behind.
const CSS_IMPORT_RE =
  /^(?:import\s+['"][^'"]*\.(?:css|scss)['"];?|require\(['"][^'"]*\.(?:css|scss)['"]\);?)\s*$/gm;

// For ESM: rewrite local imports to add .mjs extension.
// The optional clause group uses a lazy `??` quantifier so bare side-effect
// imports (e.g. `import './init';`) match on their own line instead of the
// greedy form spanning across lines to find `from` on a following named
// import, which silently leaves the side-effect path extensionless.
// Multi-line destructured imports (`import {\n  a,\n} from '...'`) still
// resolve via backtracking: the zero-case fails against `{`, so the engine
// expands the optional group on the next attempt.
// eslint-disable-next-line max-len
const LOCAL_IMPORT_RE = /(?<keyword>(?:import|export)\s+(?:[\s\S]*?\s+from\s+)??)(?<quote>['"])(?<path>\.\.?\/[^'"]*?)(?<ext>\.(?:js|mjs))?\k<quote>/g;

/**
 * Collect all .js source files, excluding test/dist directories.
 *
 * @param {string} dir Directory to scan.
 * @returns {string[]} Array of absolute file paths.
 */
function collectFiles(dir) {
  const results = [];

  readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = join(dir, entry.name);
    const relPath = relative(ROOT, fullPath);

    if (IGNORE_PATTERNS.some(p => p.test(relPath))) {
      return;
    }

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  });

  return results;
}

/**
 * Rewrite local import/export paths to add the target extension.
 * Mirrors the logic of the Babel add-import-extension.js plugin.
 *
 * @param {string} code Transpiled source code.
 * @param {string} filePath Absolute path of the source file (for resolving relative imports).
 * @param {string} ext Target extension (e.g. 'mjs').
 * @returns {string} Code with rewritten import paths.
 */
function addImportExtensions(code, filePath, ext) {
  return code.replace(LOCAL_IMPORT_RE, (match, keyword, quote, importPath) => {
    if (extname(importPath)) {
      return match;
    }

    const absPath = resolve(dirname(filePath), importPath);

    let newPath;

    if (existsSync(`${absPath}.js`)) {
      newPath = `${importPath}.${ext}`;
    } else if (existsSync(absPath) && lstatSync(absPath).isDirectory()) {
      newPath = `${importPath}/index.${ext}`;
    } else {
      newPath = `${importPath}.${ext}`;
    }

    return `${keyword}${quote}${newPath}${quote}`;
  });
}

/**
 * Inline process.env.HOT_* variables with their actual values.
 * Only HOT_-prefixed variables are replaced to match DefinePlugin behavior
 * and prevent leaking CI/build machine env vars into published artifacts.
 *
 * @param {string} code Source code.
 * @returns {string} Code with inlined env values.
 */
function inlineEnvVars(code) {
  return code.replace(/process\.env\.(HOT_\w+)/g, (match, varName) => {
    const value = process.env[varName];

    if (value !== undefined) {
      return JSON.stringify(value);
    }

    return match;
  });
}

/**
 * Apply language registration transformations for ESM language files.
 * Mirrors the Babel add-language-registration.js plugin:
 * 1. Replace `import * as C from '../constants'` with Handsontable import + dictionaryKeys
 * 2. Insert `Handsontable.languages.registerLanguageDictionary(dictionary)` before default export
 *
 * @param {string} code Source code.
 * @returns {string} Transformed code.
 */
function applyLanguageRegistration(code) {
  const hotName = process.env.HOT_FILENAME || 'handsontable';

  // Replace: import * as C from '../constants' (or '../constants.mjs')
  // With: import Handsontable from 'handsontable'; const C = Handsontable.languages.dictionaryKeys;
  code = code.replace(
    /import\s+\*\s+as\s+C\s+from\s+['"][^'"]*constants[^'"]*['"];?/,
    `import Handsontable from '${hotName}';\n\nconst C = Handsontable.languages.dictionaryKeys;`
  );

  // Before: export default dictionary;
  // Insert: Handsontable.languages.registerLanguageDictionary(dictionary);
  code = code.replace(
    /(export\s+default\s+dictionary\s*;?)/,
    'Handsontable.languages.registerLanguageDictionary(dictionary);\n\n$1'
  );

  return code;
}

// Main
const start = performance.now();
const files = collectFiles(srcDir);
const isESM = format === 'esm';

const swcOptions = {
  jsc: {
    parser: {
      syntax: 'ecmascript',
      jsx: true,
    },
    // Target ES2021 (before private class fields in ES2022) so both public and private
    // class fields get transpiled to constructor assignments. This is required because
    // Angular's Zone.js patches constructors and breaks native field initialization order.
    // Consumer bundlers (webpack, Rspack, Vite) handle final browser targeting.
    target: 'es2021',
    transform: {
      useDefineForClassFields: false,
    },
  },
  module: isESM ? { type: 'es6' } : { type: 'commonjs', strict: false, noInterop: false },
  sourceMaps: false,
};

let count = 0;

files.forEach((filePath) => {
  const relPath = relative(srcDir, filePath);
  const outPath = resolve(outDir, relPath.replace(/\.js$/, outExt));

  const result = transformFileSync(filePath, swcOptions);
  let { code } = result;

  // Strip CSS/SCSS imports
  code = code.replace(CSS_IMPORT_RE, '');

  // Inline environment variables
  code = inlineEnvVars(code);

  // For ESM: add target extension to local imports
  if (isESM) {
    code = addImportExtensions(code, filePath, outExt.replace('.', ''));
  }

  // Language registration: rewrite constants import and inject registerLanguageDictionary
  if (langRegistration) {
    code = applyLanguageRegistration(code);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, code);
  count += 1;
});

const elapsed = Math.round(performance.now() - start);

// eslint-disable-next-line no-console
console.log(`Transpiled ${count} files (${format}${outExt !== '.js' ? `, ${outExt}` : ''}) in ${elapsed}ms`);
