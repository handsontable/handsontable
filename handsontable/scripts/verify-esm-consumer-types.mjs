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
 *
 * Only `node:` built-ins are imported: the prebuilt CI path runs this without the root `pnpm install`.
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const packageDir = path.join(projectRoot, 'tmp');
const fixture = path.join(projectRoot, '.config', 'emitted-types', 'theme-presets.ts');
const tscFromEnv = process.env.TSC;
const tscCli = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
// A `TSC` override is an executable (a `.bin` shim); the local fallback is the JS entry, which runs
// through the current Node binary so it also works on Windows, where a shim is not directly spawnable.
const command = tscFromEnv || process.execPath;
const baseArgs = tscFromEnv ? [] : [tscCli];

/**
 * Write an error line to stderr.
 *
 * @param {string} message The message.
 */
function reportError(message) {
  process.stderr.write(`ERROR: ${message}\n`);
}
const MODES = [
  { name: 'node16', module: 'node16', moduleResolution: 'node16' },
  { name: 'nodenext', module: 'nodenext', moduleResolution: 'nodenext' },
  // Bundlers read the same `import` condition, so they get the same `.d.mts` files.
  { name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
];

if (!existsSync(path.join(packageDir, 'package.json'))) {
  reportError('The composed package is missing: run `npm run postbuild:partial` first.');
  process.exit(1);
}

if (!tscFromEnv && !existsSync(tscCli)) {
  reportError(`The TypeScript compiler was not found at ${tscCli}: install dependencies or set TSC.`);
  process.exit(1);
}

/**
 * List the default-exporting preset declarations of the composed package (the self-contained copies), as the
 * specifiers a consumer imports them by.
 *
 * @returns {string[]} The `handsontable/themes/static/variables/...` specifiers.
 */
function listPresetSpecifiers() {
  const root = path.join(packageDir, 'themes', 'static', 'variables');

  return readdirSync(root, { recursive: true })
    .map(file => String(file).split(path.sep).join('/'))
    .filter(file => file.endsWith('.d.mts') && /\bexport\s+default\b/.test(readFileSync(path.join(root, file), 'utf8')))
    .map(file => `handsontable/themes/static/variables/${file.replace(/\.d\.mts$/, '')}`)
    .sort();
}

const fixtureSource = readFileSync(fixture, 'utf8');
const unimported = listPresetSpecifiers().filter(specifier => !fixtureSource.includes(`from '${specifier}'`));

if (unimported.length > 0) {
  reportError(`The fixture does not import these presets, so a regression would pass:\n${unimported.join('\n')}`);
  process.exit(1);
}

const workDir = mkdtempSync(path.join(tmpdir(), 'hot-esm-consumer-'));
let failed = false;
let spawnFailed = false;

try {
  const manifest = { name: 'esm-consumer', private: true, type: 'module' };

  writeFileSync(path.join(workDir, 'package.json'), JSON.stringify(manifest));
  cpSync(fixture, path.join(workDir, 'index.ts'));
  mkdirSync(path.join(workDir, 'node_modules'));
  symlinkSync(packageDir, path.join(workDir, 'node_modules', 'handsontable'), 'junction');

  MODES.forEach((mode) => {
    if (spawnFailed) {
      return;
    }

    const config = `tsconfig.${mode.name}.json`;

    writeFileSync(path.join(workDir, config), JSON.stringify({
      compilerOptions: {
        module: mode.module,
        moduleResolution: mode.moduleResolution,
        target: 'es2022',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
      },
      files: ['index.ts'],
    }));

    const result = spawnSync(command, [...baseArgs, '-p', config], {
      cwd: workDir,
      encoding: 'utf8',
      shell: tscFromEnv !== undefined && process.platform === 'win32',
    });

    if (result.status === 0) {
      process.stdout.write(`ESM consumer types (${mode.name}): ok\n`);
    } else {
      failed = true;

      if (result.error) {
        reportError(`Could not run ${tscFromEnv ? `TSC=${tscFromEnv}` : tscCli}: ${result.error.message}`);
        spawnFailed = true;

        return;
      }

      reportError(`ESM consumer types (${mode.name}) do not compile:\n${result.stdout || ''}${result.stderr || ''}`);
    }
  });
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
