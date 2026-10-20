/**
 * Copies the demo and the built Handsontable assets into dist/.
 * Run after `npm --prefix handsontable run build:umd.min`.
 */
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const demoDir = dirname(fileURLToPath(import.meta.url));
const repo = join(demoDir, '../../../..');
const dist = join(demoDir, 'dist');
const vendor = join(dist, 'vendor');
const files = {
  'handsontable/dist/handsontable.full.min.js': 'handsontable.full.min.js',
  'handsontable/styles/handsontable.min.css': 'handsontable.min.css',
  'handsontable/styles/ht-theme-main.min.css': 'ht-theme-main.min.css',
};

await rm(dist, { recursive: true, force: true });
await mkdir(vendor, { recursive: true });

for (const [from, name] of Object.entries(files)) {
  await copyFile(join(repo, from), join(vendor, name));
}

for (const name of ['index.html', 'app.js', 'datasets.js']) {
  await copyFile(join(demoDir, name), join(dist, name));
}

await copyFile(
  join(repo, 'poc/nl-view/workersai/worker/src/pricing.js'),
  join(dist, 'pricing.js'),
);

console.log(`wrote ${dist}`);
