/**
 * Cross-platform script to generate TypeScript declaration files for the React wrapper.
 * Replaces the bash-only `prepare:types` npm script so it works on any OS (Linux, macOS, Windows).
 *
 * Logic:
 *  1. If the `types/` output directory is missing, run `tsc` to generate declarations.
 *  2. Move the generated files to the wrapper root:
 *     - If `types/src/` exists, move its contents up and remove `types/`.
 *     - If `types/` exists (no `src/` sub-dir), move its contents up and remove `types/`.
 *  3. If neither directory was found after compilation, print a warning and exit cleanly.
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

// Step 1: generate declarations when the output directory is absent.
if (!await exists(typesDir)) {
  console.log('Running tsc to generate declaration files...');
  try {
    await execAsync(
      'pnpm exec tsc -p tsconfig.json --emitDeclarationOnly --declaration --declarationDir ./types',
      { cwd: root }
    );
  } catch {
    // tsc may exit with a non-zero code even when it still emits files (type errors in
    // dependencies, strict checks, etc.).  We intentionally continue so the move step can
    // pick up whatever was written to disk – mirroring the original `|| true` behaviour.
  }
}

// Step 2: determine which directory to move and flatten into the wrapper root.
let sourceDir = null;

if (await exists(typesSrcDir)) {
  sourceDir = typesSrcDir;
} else if (await exists(typesDir)) {
  sourceDir = typesDir;
}

if (!sourceDir) {
  console.log('No generated declaration directory found, skipping prepare:types');
  process.exit(0);
}

// Move every file/directory from sourceDir to the wrapper root, then remove types/.
const entries = await readdir(sourceDir);

await Promise.all(entries.map(entry => rename(join(sourceDir, entry), join(root, entry))));
await rm(typesDir, { recursive: true, force: true });
console.log('TypeScript declarations prepared successfully.');
