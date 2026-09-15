/**
 * Cross-platform clean script for the React wrapper.
 * Replaces the bash-only `clean` npm script so it works on any OS (Linux, macOS, Windows).
 *
 * Removes:
 *  - ./es/
 *  - ./commonjs/
 *  - ./dist/
 *  - ./types/
 *  - all *.d.ts files in the wrapper root
 */

import { readdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// `types/` is the staging directory `prepare-types.mjs` compiles into before flattening the
// declarations up to the package root. Leaving it behind would let a stale declaration — one
// emitted for a since-renamed source file — be flattened into the next package unchanged.
const dirs = ['es', 'commonjs', 'dist', 'types'];

const entries = await readdir(root);
const declarationFiles = entries.filter(e => e.endsWith('.d.ts')).map(e => join(root, e));

await Promise.all([
  ...dirs.map(dir => rm(join(root, dir), { recursive: true, force: true })),
  ...declarationFiles.map(file => rm(file, { force: true })),
]);

console.log('Clean complete.');
