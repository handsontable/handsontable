/**
 * Cross-platform script to generate TypeScript declaration files for the React wrapper.
 * Replaces the bash-only `prepare:types` npm script so it works on any OS (Linux, macOS, Windows).
 *
 * Logic:
 *  1. Clear the `types/` staging directory and run `tsc` to generate declarations into it.
 *  2. Move the generated files to the wrapper root:
 *     - If `types/src/` exists, move its contents up and remove `types/`.
 *     - If `types/` exists (no `src/` sub-dir), move its contents up and remove `types/`.
 *  3. Fail if nothing usable was emitted, rather than shipping a `types` field that names a
 *     file the tarball does not contain (the `@handsontable/vue3` failure mode, DEV-2732).
 */

import { exec } from 'node:child_process';
import { access, readdir, rename, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const typesDir = join(root, 'types');
const typesSrcDir = join(typesDir, 'src');

const exists = async(path) => access(path).then(() => true, () => false);

// Step 1: always regenerate, from a clean staging directory. There is deliberately no "skip
// when `types/` already exists" shortcut: `clean` did not remove that directory until
// recently, so the skip could flatten a stale declaration — one emitted for a since-renamed
// source file — into the package unchanged.
await rm(typesDir, { recursive: true, force: true });

console.log('Running tsc to generate declaration files...');

try {
  await execAsync(
    'pnpm exec tsc -p tsconfig.json --emitDeclarationOnly --declaration --declarationDir ./types',
    { cwd: root, maxBuffer: 64 * 1024 * 1024 }
  );
} catch {
  // This swallow is load-bearing, unlike the Vue 3 wrapper's equivalent, which throws.
  // This package pins `typescript@3.8.2`, which cannot parse the declarations it has to read:
  // `handsontable/tmp` uses inline type modifiers (`import { type X }`, TS 4.5) and
  // `@types/react`'s `ts5.0` tree uses syntax newer still, so `tsc` reports ~40 parse errors
  // from those files on every run while still emitting every declaration for `src/`. Removing
  // the swallow would turn `npm run build` red here permanently. Remove it — and adopt the Vue 3
  // script's `throw` — once this package's TypeScript is upgraded. The checks below are what
  // stands in for it in the meantime: they fail on the outcome (nothing emitted) rather than on
  // the exit code, so the DEV-2732 shape cannot ship silently.
}

// Step 2: determine which directory to move and flatten into the wrapper root.
let sourceDir = null;

if (await exists(typesSrcDir)) {
  sourceDir = typesSrcDir;
} else if (await exists(typesDir)) {
  sourceDir = typesDir;
}

if (!sourceDir) {
  throw new Error(
    'tsc emitted no declaration directory. The package would publish a `types` field ' +
    'pointing at a file that does not exist.'
  );
}

const entries = await readdir(sourceDir);

if (entries.length === 0) {
  throw new Error(`tsc emitted no declaration files into ${sourceDir}.`);
}

// Move every file/directory from sourceDir to the wrapper root, then remove types/.
await Promise.all(entries.map(entry => rename(join(sourceDir, entry), join(root, entry))));
await rm(typesDir, { recursive: true, force: true });

if (!await exists(join(root, 'index.d.ts'))) {
  throw new Error(
    'No `index.d.ts` at the package root after flattening. The `types` field in ' +
    'package.json points at it, so publishing now would ship a broken types pointer.'
  );
}

console.log('TypeScript declarations prepared successfully.');
