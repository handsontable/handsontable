/**
 * Cross-platform script to generate TypeScript declaration files for the Vue 3 wrapper.
 *
 * Uses `vue-tsc`, not plain `tsc`: the entry point imports `.vue` single-file components,
 * and `src/vue.d.ts` shims them as `DefineComponent<{}, {}, any>`. Plain `tsc` therefore
 * succeeds and emits an `index.d.ts` in which `HotTable` is `any` — declarations that
 * silence TS7016 while checking nothing. `vue-tsc` resolves the SFCs for real.
 *
 * Logic:
 *  1. Run `vue-tsc` to emit declarations into `types/`.
 *  2. Move the generated files to the wrapper root:
 *     - If `types/src/` exists, move its contents up and remove `types/`.
 *     - If `types/` exists (no `src/` sub-dir), move its contents up and remove `types/`.
 *  3. Fail loudly if the compiler errored or emitted nothing. A silent skip here is how
 *     the package shipped four releases advertising `types` with no declarations at all.
 */

import { exec } from 'child_process';
import { access, readdir, rename, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const typesDir = join(root, 'types');
const typesSrcDir = join(typesDir, 'src');

const exists = async(path) => access(path).then(() => true, () => false);

// Step 1: always regenerate. A stale `types/` must never be flattened into the package,
// so there is deliberately no "skip when the directory already exists" shortcut.
await rm(typesDir, { recursive: true, force: true });

console.log('Running vue-tsc to generate declaration files...');

await execAsync(
  'pnpm exec vue-tsc -p tsconfig.json --emitDeclarationOnly --declaration --declarationDir ./types',
  { cwd: root }
);

// Step 2: determine which directory to move and flatten into the wrapper root.
let sourceDir = null;

if (await exists(typesSrcDir)) {
  sourceDir = typesSrcDir;
} else if (await exists(typesDir)) {
  sourceDir = typesDir;
}

if (!sourceDir) {
  throw new Error(
    'vue-tsc emitted no declaration directory. The package would publish a `types` field ' +
    'pointing at a file that does not exist.'
  );
}

// Move every file/directory from sourceDir to the wrapper root, then remove types/.
const entries = await readdir(sourceDir);

if (entries.length === 0) {
  throw new Error(`vue-tsc emitted no declaration files into ${sourceDir}.`);
}

await Promise.all(entries.map(entry => rename(join(sourceDir, entry), join(root, entry))));
await rm(typesDir, { recursive: true, force: true });

if (!await exists(join(root, 'index.d.ts'))) {
  throw new Error(
    'No `index.d.ts` at the package root after flattening. The `types` field in ' +
    'package.json points at it, so publishing now would ship a broken types pointer.'
  );
}

console.log('TypeScript declarations prepared successfully.');
