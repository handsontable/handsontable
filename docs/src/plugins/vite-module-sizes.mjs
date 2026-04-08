/**
 * Vite plugin that reads module-sizes.json and injects build weight tables into
 * the Modules guide. Runs with enforce:'pre' so the injected VuePress-compatible
 * syntax is processed by vuepressPreprocessor afterwards.
 *
 * Usage in modules.md:
 *   <!-- module-sizes -->
 *
 * The placeholder is replaced with the generated tables at build time.
 * To regenerate the JSON (after a release), run from the repo root:
 *   pnpm --filter handsontable run build
 *   pnpm --filter handsontable run measure:module-sizes
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(
  __dirname,
  '../../content/guides/tools-and-building/modules/module-sizes.json'
);
const PLACEHOLDER = '<!-- module-sizes -->';

function kB(bytes) {
  return (bytes / 1000).toFixed(1);
}

function generateMarkdown(data) {
  const lines = [];

  lines.push(`Measurements were made with esbuild using minification, against **Handsontable ${data.version}** (measured ${data.measuredAt}).`);
  lines.push('');
  lines.push('**Base module sizes:**');
  lines.push('');
  lines.push('| Package | Minified | Gzip |');
  lines.push('| ------- | -------- | ---- |');
  lines.push(`| \`handsontable\` (full, no tree shaking) | ${kB(data.base.full.raw)} kB | ${kB(data.base.full.gzip)} kB |`);
  lines.push(`| \`handsontable/base\` | ${kB(data.base.base.raw)} kB | ${kB(data.base.base.gzip)} kB |`);
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

  for (const [name, d] of Object.entries(data.plugins)) {
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

  return lines.join('\n');
}

export function moduleSizesPlugin() {
  return {
    name: 'vite-module-sizes',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('modules.md')) return null;
      if (!code.includes(PLACEHOLDER)) return null;
      if (!existsSync(JSON_PATH)) {
        console.warn(`[vite-module-sizes] ${JSON_PATH} not found — placeholder left as-is.`);
        return null;
      }

      const data = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));

      return { code: code.replace(PLACEHOLDER, generateMarkdown(data)), map: null };
    },
  };
}
