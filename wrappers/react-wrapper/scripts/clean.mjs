/**
 * Cross-platform clean script for the React wrapper.
 * Replaces the bash-only `clean` npm script so it works on any OS (Linux, macOS, Windows).
 *
 * Removes:
 *  - ./es/
 *  - ./commonjs/
 *  - ./dist/
 *  - all *.d.ts files in the wrapper root
 */

import { readdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const dirs = ['es', 'commonjs', 'dist'];

const entries = await readdir(root);
const declarationFiles = entries.filter(e => e.endsWith('.d.ts')).map(e => join(root, e));

await Promise.all([
  ...dirs.map(dir => rm(join(root, dir), { recursive: true, force: true })),
  ...declarationFiles.map(file => rm(file, { force: true })),
]);

console.log('Clean complete.');
