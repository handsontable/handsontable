/**
 * Measures the minified and gzip sizes added by each optional Handsontable module
 * on top of `handsontable/base`. Writes results to:
 *   docs/content/guides/tools-and-building/modules/module-sizes.json
 *
 * The JSON is read at docs build time by the vite-module-sizes plugin to inject
 * the build weight tables into the Modules guide.
 *
 * Usage (from the repo root, after a production release):
 *   npm run build --prefix handsontable
 *   npm run measure:module-sizes --prefix handsontable
 *
 * Requires: esbuild (already a dev dependency via the monorepo)
 */

import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOT_TMP = resolve(__dirname, '..', 'tmp');
const DIST = resolve(__dirname, '..', 'dist');
const TMP_DIR = '/tmp/hot-module-sizes';
const DOCS_MODULES_DIR = resolve(
  __dirname, '..', '..', 'docs', 'content', 'guides', 'tools-and-building', 'modules'
);
const JSON_OUT = resolve(DOCS_MODULES_DIR, 'module-sizes.json');
const MODULES_MD = resolve(DOCS_MODULES_DIR, 'modules.md');
const MD_START = '<!-- module-sizes:start -->';
const MD_END = '<!-- module-sizes:end -->';

mkdirSync(TMP_DIR, { recursive: true });

const SRC_DIR = resolve(__dirname, '..', 'src');

/**
 * Reads an index.ts barrel file and returns all imported class names that pass
 * the given filter. Handles both single-line and multi-line import blocks.
 *
 * @param {string} indexPath Absolute path to the index.ts barrel file.
 * @param {Function} filter Predicate to include a name.
 * @returns {string[]} Sorted list of matching names.
 */
function parseImportNames(indexPath, filter) {
  const content = readFileSync(indexPath, 'utf8');
  const names = [];

  for (const match of content.matchAll(/import\s*\{([^}]+)\}/gs)) {
    for (const part of match[1].split(',')) {
      const name = part.split(' as ')[0].trim();

      if (name && filter(name)) {
        names.push(name);
      }
    }
  }

  return [...new Set(names)].sort();
}

/**
 * Auto-detects cell type class names from src/cellTypes/index.ts.
 *
 * @returns {string[]} Sorted list of cell type class names.
 */
function detectCellTypes() {
  return parseImportNames(
    resolve(SRC_DIR, 'cellTypes', 'index.ts'),
    name => /^[A-Z]\w+CellType$/.test(name)
  );
}

/**
 * Auto-detects plugin class names from src/plugins/index.js.
 * Excludes the base class and internal non-plugin exports.
 *
 * @returns {string[]} Sorted list of plugin class names.
 */
function detectPlugins() {
  const EXCLUDE = new Set(['BasePlugin', 'DataProvider']);

  return parseImportNames(
    resolve(SRC_DIR, 'plugins', 'index.ts'),
    name => /^[A-Z]/.test(name) && !EXCLUDE.has(name)
  );
}

// eslint-disable-next-line jsdoc/require-returns-check -- process.exit() is not recognized as a terminal by jsdoc
/**
 * Locates the esbuild binary in the monorepo's pnpm node_modules.
 *
 * @returns {string} Absolute path to the esbuild binary.
 */
function findEsbuild() {
  const root = resolve(__dirname, '..', '..');
  const candidates = [
    join(root, 'node_modules', '.bin', 'esbuild'),
  ];

  for (const c of candidates) {
    try {
      execFileSync(c, ['--version'], { stdio: 'pipe' });

      return c;
    } catch {
      // not found, try next
    }
  }

  // Fall back to searching the pnpm store
  try {
    const result = execFileSync('find', [
      `${root}/node_modules/.pnpm`,
      '-name', 'esbuild',
      '-path', '*/esbuild/bin/esbuild',
    ], { encoding: 'utf8' }).split('\n').filter(Boolean)[0];

    if (result) {
      return result.trim();
    }
  } catch { /* ignore */ }

  console.error('Could not locate esbuild binary. Run: pnpm install');
  process.exit(1);
}

/**
 * Bundles the given entry code with esbuild and returns its minified + gzip sizes.
 *
 * @param {string} esbuild Path to the esbuild binary.
 * @param {string} entryCode ESM source code to bundle.
 * @returns {{ raw: number, gzip: number }} Byte sizes before and after gzip.
 */
function bundle(esbuild, entryCode) {
  const entryFile = join(TMP_DIR, `entry-${Date.now()}.mjs`);

  writeFileSync(entryFile, entryCode);

  const output = execFileSync(esbuild, [
    entryFile,
    '--bundle',
    '--minify',
    '--format=esm',
    '--log-level=error',
  ], { encoding: 'buffer' });

  const gzipped = gzipSync(output);

  return { raw: output.length, gzip: gzipped.length };
}

/**
 * Returns the size difference between two bundle measurements.
 *
 * @param {{ raw: number, gzip: number }} current Size of the bundle with the module.
 * @param {{ raw: number, gzip: number }} base Size of the base bundle.
 * @returns {{ raw: number, gzip: number }} Delta in bytes.
 */
function delta(current, base) {
  return { raw: current.raw - base.raw, gzip: current.gzip - base.gzip };
}

/**
 * Formats a byte count as a kB string with one decimal place.
 *
 * @param {number} bytes Raw byte count.
 * @returns {string} Formatted string, e.g. "141.2 kB".
 */
function kB(bytes) {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

/**
 * Builds the Markdown table content to be injected between the
 * module-sizes markers in modules.md.
 *
 * @param {{ version: string, measuredAt: string, base: object, cellTypes: object, plugins: object }} data
 *   Measurement data as written to module-sizes.json.
 * @returns {string} Markdown string (no leading/trailing blank lines).
 */
function buildMarkdownTables(data) {
  const lines = [];

  // eslint-disable-next-line max-len
  lines.push(`Measurements were made with esbuild using minification, against **Handsontable ${data.version}** (${data.measuredAt}).`);
  lines.push('');
  lines.push('**Base module sizes:**');
  lines.push('');
  lines.push('| Package | Minified | Gzip |');
  lines.push('| ------- | -------- | ---- |');
  lines.push(`| \`handsontable\` (full, no tree shaking) | ${kB(data.base.full.raw)} | ${kB(data.base.full.gzip)} |`);
  lines.push(`| \`handsontable/base\` | ${kB(data.base.base.raw)} | ${kB(data.base.base.gzip)} |`);
  lines.push('');
  lines.push('**Size added by each optional module (on top of `handsontable/base`):**');
  lines.push('');
  lines.push('::: details Cell type modules');
  lines.push('');
  lines.push('| Module | Minified | Gzip |');
  lines.push('| ------ | -------- | ---- |');

  for (const [name, d] of Object.entries(data.cellTypes)) {
    if (d.raw < 100) {
      lines.push(`| \`${name}\` | included in base | included in base |`);
    } else {
      lines.push(`| \`${name}\` | +${kB(d.raw)} | +${kB(d.gzip)} |`);
    }
  }

  lines.push('');
  lines.push(':::');
  lines.push('');
  lines.push('::: details Plugin modules');
  lines.push('');
  lines.push('| Module | Minified | Gzip |');
  lines.push('| ------ | -------- | ---- |');

  for (const [name, d] of Object.entries(data.plugins)) {
    lines.push(`| \`${name}\` | +${kB(d.raw)} | +${kB(d.gzip)} |`);
  }

  lines.push('');
  lines.push(':::');
  lines.push('');
  lines.push('::: tip');
  lines.push('');
  // eslint-disable-next-line max-len
  lines.push('The `Formulas` module requires the external [`hyperformula`](https://hyperformula.handsontable.com/) package. Its size is not included in the measurements above.');
  lines.push('');
  lines.push(':::');

  return lines.join('\n');
}

/**
 * Entry point: measures all module sizes and writes module-sizes.json.
 */
async function main() {
  const esbuild = findEsbuild();

  console.error('Building base bundle...');
  const base = bundle(esbuild,
    `import Handsontable from '${HOT_TMP}/base.mjs'; export default Handsontable;`
  );

  const fullRaw = readFileSync(join(DIST, 'handsontable.min.js')).length;
  const fullGzip = gzipSync(readFileSync(join(DIST, 'handsontable.min.js'))).length;

  const cellTypes = detectCellTypes();
  const plugins = detectPlugins();

  const cellTypeResults = {};
  const pluginResults = {};

  for (const ct of cellTypes) {
    console.error(`Measuring ${ct}...`);
    const size = bundle(esbuild, `
      import Handsontable from '${HOT_TMP}/base.mjs';
      import { registerCellType, ${ct} } from '${HOT_TMP}/cellTypes/index.mjs';
      registerCellType(${ct});
      export default Handsontable;
    `);

    cellTypeResults[ct] = delta(size, base);
  }

  for (const plugin of plugins) {
    console.error(`Measuring ${plugin}...`);
    const size = bundle(esbuild, `
      import Handsontable from '${HOT_TMP}/base.mjs';
      import { registerPlugin, ${plugin} } from '${HOT_TMP}/plugins/index.mjs';
      registerPlugin(${plugin});
      export default Handsontable;
    `);

    pluginResults[plugin] = delta(size, base);
  }

  // Read version from package.json
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  const version = pkg.version;

  const measuredAt = new Date().toISOString().slice(0, 10);

  // Write JSON output (machine-readable source of truth)
  const output = {
    version,
    measuredAt,
    base: {
      full: { raw: fullRaw, gzip: fullGzip },
      base: { raw: base.raw, gzip: base.gzip },
    },
    cellTypes: cellTypeResults,
    plugins: pluginResults,
  };

  writeFileSync(JSON_OUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.error(`\nWrote ${JSON_OUT}`);

  // Inject generated tables into modules.md between marker comments
  const tables = buildMarkdownTables(output);
  const mdContent = readFileSync(MODULES_MD, 'utf8');
  const startIdx = mdContent.indexOf(MD_START);
  const endIdx = mdContent.indexOf(MD_END);

  if (startIdx === -1 || endIdx === -1) {
    console.error(`Warning: markers not found in ${MODULES_MD} — skipping markdown update.`);
  } else {
    const updated = `${mdContent.slice(0, startIdx + MD_START.length)}\n${tables}\n${mdContent.slice(endIdx)}`;

    writeFileSync(MODULES_MD, updated, 'utf8');
    console.error(`Wrote ${MODULES_MD}`);
  }

  console.error('\nCommit both updated files to the repository.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
