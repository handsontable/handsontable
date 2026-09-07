/**
 * Cross-platform script to generate TypeScript declaration files for the Vue 3 wrapper.
 *
 * Uses `vue-tsc`, not plain `tsc`: the entry point imports `.vue` single-file components,
 * and `src/vue.d.ts` shims them as `DefineComponent<{}, {}, any>`. Plain `tsc` therefore
 * succeeds and emits an `index.d.ts` in which `HotTable` is `any` — declarations that
 * silence TS7016 while checking nothing. `vue-tsc` resolves the SFCs for real.
 *
 * Logic:
 *  1. Clear the `types/` staging directory so a declaration for a since-renamed source file
 *     cannot survive into the emit.
 *  2. Run `vue-tsc` to emit declarations into `types/`.
 *  3. Only once that succeeded, clear the flattened root `.d.ts` and move the fresh files up:
 *     - If `types/src/` exists, move its contents up and remove `types/`.
 *     - If `types/` exists (no `src/` sub-dir), move its contents up and remove `types/`.
 *  4. Fail loudly if the compiler errored or emitted nothing. A silent skip here is how
 *     the package shipped four releases advertising `types` with no declarations at all.
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

// Step 1: always regenerate, from a clean staging directory. A stale `types/` must never be
// flattened into the package, so there is deliberately no "skip when the directory already
// exists" shortcut. The flattened root `.d.ts` are swept in step 3 instead of here: this
// script is also its own entry point, so a failed standalone run must not strip the
// declarations the previous build left and hand back a packable tree in the very state
// DEV-2732 describes — `es/`, `commonjs/` and `dist/` present, `types` advertised, and no
// `index.d.ts` anywhere.
await rm(typesDir, { recursive: true, force: true });

console.log('Running vue-tsc to generate declaration files...');

try {
  await execAsync(
    'pnpm exec vue-tsc -p tsconfig.json --emitDeclarationOnly --declaration --declarationDir ./types',
    // vue-tsc's diagnostics are the whole point of a failure here, and Node's default 1 MB
    // pipe would abort the child with ENOBUFS before they arrive — the same trap the test
    // hooks avoid with TEST_RUN_MAX_BUFFER. See .ai/LOCAL-ENFORCEMENT.md.
    { cwd: root, maxBuffer: 64 * 1024 * 1024 }
  );

} catch (error) {
  // vue-tsc prints its diagnostics on stdout. An unhandled rejection would render them
  // through util.inspect, which cuts strings at 10000 characters, so write them out here.
  process.stdout.write(error.stdout ?? '');
  process.stderr.write(error.stderr ?? '');

  throw new Error('vue-tsc failed to emit the declaration files. See the diagnostics above.');
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
    'vue-tsc emitted no declaration directory. The package would publish a `types` field ' +
    'pointing at a file that does not exist.'
  );
}

const entries = await readdir(sourceDir);

if (entries.length === 0) {
  throw new Error(`vue-tsc emitted no declaration files into ${sourceDir}.`);
}

// Step 3: the emit succeeded, so replacing the previous one is safe now. Sweeping the root
// `.d.ts` is not optional — the move below only overwrites what vue-tsc re-emitted, so
// without this a renamed source file leaves its old declaration behind at the package root.
const staleDeclarations = (await readdir(root)).filter(entry => entry.endsWith('.d.ts'));

await Promise.all(staleDeclarations.map(entry => rm(join(root, entry), { force: true })));

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
