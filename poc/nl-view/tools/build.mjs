/**
 * Copies the demo and the built Handsontable assets into dist/.
 * Run after `npm --prefix handsontable run build:umd` (min build preferred).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(root, 'demo');
const dist = path.join(root, 'dist');
const hot = path.resolve(root, '../../../handsontable');

const jsName = firstExisting(hot, ['dist/handsontable.min.js', 'dist/handsontable.js']);
const baseCss = firstExisting(hot, ['styles/handsontable.min.css', 'styles/handsontable.css']);
const themeCss = firstExisting(hot, ['styles/ht-theme-main.min.css', 'styles/ht-theme-main.css']);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'vendor'), { recursive: true });

fs.readdirSync(demo).forEach((name) => {
  const from = path.join(demo, name);

  if (fs.statSync(from).isFile()) {
    fs.copyFileSync(from, path.join(dist, name));
  }
});

fs.copyFileSync(path.join(hot, jsName), path.join(dist, 'vendor/handsontable.js'));
fs.copyFileSync(path.join(hot, baseCss), path.join(dist, 'vendor/handsontable.css'));
fs.copyFileSync(path.join(hot, themeCss), path.join(dist, 'vendor/ht-theme-main.css'));

const bytes = fs.statSync(path.join(dist, 'vendor/handsontable.js')).size;

console.log(JSON.stringify({ jsName, baseCss, themeCss, bytes }, null, 2));

/**
 * @param {string} base
 * @param {string[]} candidates
 * @returns {string}
 */
function firstExisting(base, candidates) {
  const found = candidates.find(candidate => fs.existsSync(path.join(base, candidate)));

  if (!found) {
    throw new Error(`Missing Handsontable asset. Looked for ${candidates.join(', ')} under ${base}`);
  }

  return found;
}
