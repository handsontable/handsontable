/**
 * SWC-based file-per-file transpiler. Replaces Babel CLI for build:commonjs and build:es.
 *
 * Usage:
 *   node scripts/swc-transpile.mjs --format commonjs --out-dir tmp
 *   node scripts/swc-transpile.mjs --format esm --out-dir tmp --out-ext .mjs
 *
 * What it does:
 * 1. Finds all .js files in src/ (excluding __tests__, test/, dist/)
 * 2. Transpiles each file with SWC (matching browser-targets.js)
 * 3. Strips CSS/SCSS import statements
 * 4. For ESM: rewrites local import paths to add the .mjs extension
 * 5. Inlines process.env.HOT_* variables
 * 6. Writes output to --out-dir preserving directory structure
 */
import { transformFileSync } from '@swc/core';
import { writeFileSync, mkdirSync, existsSync, lstatSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');

// Parse CLI args
const args = process.argv.slice(2);
const format = args[args.indexOf('--format') + 1] || 'commonjs'; // 'commonjs' or 'esm'
const outDir = resolve(ROOT, args[args.indexOf('--out-dir') + 1] || 'tmp');
const outExt = args.includes('--out-ext') ? args[args.indexOf('--out-ext') + 1] : '.js';

const IGNORE_PATTERNS = [/__tests__/, /\/test\//, /\/dist\//];
const CSS_IMPORT_RE =
  /^(?:import\s+['"][^'"]*\.(?:css|scss)['"];?\s*$)|(?:require\(['"][^'"]*\.(?:css|scss)['"]\);?\s*$)/gm;

// For ESM: rewrite local imports to add .mjs extension
// eslint-disable-next-line max-len
const LOCAL_IMPORT_RE = /(?<keyword>(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?)(?<quote>['"])(?<path>\.\.?\/[^'"]*?)(?<ext>\.(?:js|mjs))?\k<quote>/g;

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
    // If it already has an extension, leave it
    if (extname(importPath)) {
      return match;
    }

    const absPath = resolve(dirname(filePath), importPath);

    let newPath;

    // Check if it resolves to a file (e.g. ./plugins.js exists)
    if (existsSync(`${absPath}.js`)) {
      newPath = `${importPath}.${ext}`;
    // Check if it's a directory with an index file
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
 *
 * @param {string} code Source code.
 * @returns {string} Code with inlined env values.
 */
function inlineEnvVars(code) {
  return code.replace(/process\.env\.(\w+)/g, (match, varName) => {
    const value = process.env[varName];

    if (value !== undefined) {
      return JSON.stringify(value);
    }

    return match;
  });
}

// Main
const start = performance.now();
const files = collectFiles(SRC);

const isESM = format === 'esm';

const swcOptions = {
  jsc: {
    parser: {
      syntax: 'ecmascript',
      jsx: true,
    },
    target: 'es2020',
  },
  module: isESM ? { type: 'es6' } : { type: 'commonjs', strict: false, noInterop: false },
  sourceMaps: false,
};

let count = 0;

files.forEach((filePath) => {
  const relPath = relative(SRC, filePath);
  const outPath = resolve(outDir, relPath.replace(/\.js$/, outExt));

  // Transpile with SWC
  const result = transformFileSync(filePath, swcOptions);
  let { code } = result;

  // Strip CSS/SCSS imports
  code = code.replace(CSS_IMPORT_RE, '');

  // Inline environment variables
  code = inlineEnvVars(code);

  // For ESM: add .mjs extension to local imports
  if (isESM) {
    code = addImportExtensions(code, filePath, 'mjs');
  }

  // Write output
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, code);
  count += 1;
});

const elapsed = Math.round(performance.now() - start);

// eslint-disable-next-line no-console
console.log(`Transpiled ${count} files (${format}${outExt !== '.js' ? `, ${outExt}` : ''}) in ${elapsed}ms`);
