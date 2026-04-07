/**
 * Measures the minified and gzip sizes added by each optional Handsontable module
 * on top of `handsontable/base`. Outputs a Markdown table ready to paste into
 * docs/content/guides/tools-and-building/modules/modules.md.
 *
 * Usage (from the repo root):
 *   pnpm --filter handsontable run build
 *   node handsontable/scripts/measure-module-sizes.mjs
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

mkdirSync(TMP_DIR, { recursive: true });

// Locate esbuild binary in the pnpm store
function findEsbuild() {
  const root = resolve(__dirname, '..', '..');
  const candidates = [
    join(root, 'node_modules', '.bin', 'esbuild'),
    join(root, 'node_modules', '.pnpm', 'esbuild@0.25.12', 'node_modules', 'esbuild', 'bin', 'esbuild'),
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

    if (result) return result.trim();
  } catch { /* ignore */ }

  throw new Error('Could not locate esbuild binary. Run: pnpm install');
}

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

function kB(bytes) {
  return (bytes / 1000).toFixed(1);
}

function delta(current, base) {
  return { raw: current.raw - base.raw, gzip: current.gzip - base.gzip };
}

async function main() {
  const esbuild = findEsbuild();

  console.error('Building base bundle...');
  const base = bundle(esbuild,
    `import Handsontable from '${HOT_TMP}/base.mjs'; export default Handsontable;`
  );

  const fullRaw = readFileSync(join(DIST, 'handsontable.min.js')).length;
  const fullGzip = gzipSync(readFileSync(join(DIST, 'handsontable.min.js'))).length;

  // Cell types to measure
  const cellTypes = [
    'AutocompleteCellType',
    'CheckboxCellType',
    'DateCellType',
    'DropdownCellType',
    'HandsontableCellType',
    'MultiSelectCellType',
    'NumericCellType',
    'PasswordCellType',
    'SelectCellType',
    'TextCellType',
    'TimeCellType',
  ];

  // Plugins to measure
  const plugins = [
    'AutoColumnSize',
    'AutoRowSize',
    'Autofill',
    'BindRowsWithHeaders',
    'CollapsibleColumns',
    'ColumnSorting',
    'ColumnSummary',
    'Comments',
    'ContextMenu',
    'CopyPaste',
    'CustomBorders',
    'DragToScroll',
    'DropdownMenu',
    'ExportFile',
    'Filters',
    'Formulas',
    'HiddenColumns',
    'HiddenRows',
    'ManualColumnFreeze',
    'ManualColumnMove',
    'ManualColumnResize',
    'ManualRowMove',
    'ManualRowResize',
    'MergeCells',
    'MultiColumnSorting',
    'MultipleSelectionHandles',
    'NestedHeaders',
    'NestedRows',
    'Search',
    'StretchColumns',
    'TouchScroll',
    'TrimRows',
    'UndoRedo',
  ];

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

  // Output Markdown
  const lines = [];

  lines.push(`<!-- Build weight measured against Handsontable ${version} -->`);
  lines.push('');
  lines.push('**Base module sizes:**');
  lines.push('');
  lines.push('| Package | Minified | Gzip |');
  lines.push('| ------- | -------- | ---- |');
  lines.push(`| \`handsontable\` (full, no tree shaking) | ${kB(fullRaw)} kB | ${kB(fullGzip)} kB |`);
  lines.push(`| \`handsontable/base\` | ${kB(base.raw)} kB | ${kB(base.gzip)} kB |`);
  lines.push('');
  lines.push('**Size added by each optional module (on top of `handsontable/base`):**');
  lines.push('');
  lines.push('::: details Cell type modules');
  lines.push('');
  lines.push('| Module | Minified | Gzip |');
  lines.push('| ------ | -------- | ---- |');
  for (const [name, d] of Object.entries(cellTypeResults)) {
    if (d.raw < 100) {
      lines.push(`| \`${name}\` | included in base | included in base |`);
    } else {
      lines.push(`| \`${name}\` | +${kB(d.raw)} kB | +${kB(d.gzip)} kB |`);
    }
  }
  lines.push('');
  lines.push(':::');
  lines.push('');
  lines.push('::: details Plugin modules');
  lines.push('');
  lines.push('| Module | Minified | Gzip |');
  lines.push('| ------ | -------- | ---- |');
  for (const [name, d] of Object.entries(pluginResults)) {
    lines.push(`| \`${name}\` | +${kB(d.raw)} kB | +${kB(d.gzip)} kB |`);
  }
  lines.push('');
  lines.push(':::');
  lines.push('');
  lines.push('::: tip');
  lines.push('');
  lines.push('The `Formulas` module requires the external [`hyperformula`](https://hyperformula.handsontable.com/) package. Its size is not included in the measurements above.');
  lines.push('');
  lines.push(':::');

  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
