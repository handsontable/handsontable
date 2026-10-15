/**
 * Compiles an ES module consumer against the composed package in `tmp/`, under `node16` and
 * `nodenext`, resolving `handsontable` through the real `exports` map (a `node_modules` link to
 * `tmp/`, never a tsconfig `paths` map, which bypasses `exports` and proves nothing).
 *
 * This is the check that catches a `.d.mts` whose default export is typed wrong. `attw` and the
 * `.d.ts` type-check both pass for a `.d.mts` wrapper that re-exports a CommonJS-typed default
 * (DEV-3421), because the wrapper itself is well formed and only a default import shows the damage.
 *
 * Needs the composed package: run `postbuild` (or `postbuild:partial`) first.
 * Set `TSC` to pick a compiler, e.g. the TS 5.1 the Emitted Types workflow installs.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { displayErrorMessage } from '../../scripts/utils/console.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const packageDir = path.join(projectRoot, 'tmp');
const fixture = path.join(projectRoot, '.config', 'emitted-types', 'theme-presets.ts');
const tsc = process.env.TSC || path.join(projectRoot, 'node_modules', '.bin', 'tsc');
const MODES = ['node16', 'nodenext'];

if (!existsSync(path.join(packageDir, 'package.json'))) {
  displayErrorMessage('The composed package is missing: run `npm run postbuild:partial` first.');
  process.exit(1);
}

const workDir = mkdtempSync(path.join(tmpdir(), 'hot-esm-consumer-'));
let failed = false;

try {
  const manifest = { name: 'esm-consumer', private: true, type: 'module' };

  writeFileSync(path.join(workDir, 'package.json'), JSON.stringify(manifest));
  cpSync(fixture, path.join(workDir, 'index.ts'));
  mkdirSync(path.join(workDir, 'node_modules'));
  symlinkSync(packageDir, path.join(workDir, 'node_modules', 'handsontable'), 'junction');

  MODES.forEach((mode) => {
    const config = `tsconfig.${mode}.json`;

    writeFileSync(path.join(workDir, config), JSON.stringify({
      compilerOptions: {
        module: mode,
        moduleResolution: mode,
        target: 'es2022',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
      },
      files: ['index.ts'],
    }));

    const result = spawnSync(tsc, ['-p', config], { cwd: workDir, encoding: 'utf8' });

    if (result.status === 0) {
      process.stdout.write(`ESM consumer types (${mode}): ok\n`);
    } else {
      failed = true;
      displayErrorMessage(`ESM consumer types (${mode}) do not compile:\n${result.stdout}${result.stderr}`);
    }
  });
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
