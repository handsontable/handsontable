/**
 * Compiles an ES module consumer against the composed package in `tmp/`, under `node16` and
 * `nodenext`, resolving `handsontable` through the real `exports` map (a `node_modules` link to
 * `tmp/`, never a tsconfig `paths` map, which bypasses `exports` and proves nothing).
 *
 * This is the check that catches a `.d.mts` whose default export is typed wrong, for a theme preset or language
 * dictionary (`theme-presets.ts`) and for the `handsontable` and `handsontable/base` entry points
 * (`entry-points.ts`). `attw` and the `.d.ts` type-check both pass for a `.d.mts` wrapper that re-exports a
 * CommonJS-typed default (DEV-3421, DEV-3430), because the wrapper itself is well formed and only a default
 * import shows the damage.
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
const fixtureDir = path.join(projectRoot, '.config', 'emitted-types');
const fixture = path.join(fixtureDir, 'theme-presets.ts');
const reexportFixture = path.join(fixtureDir, 'theme-presets-reexport.ts');
const entryPointsFixture = path.join(fixtureDir, 'entry-points.ts');
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

/**
 * List the public `import` declarations whose `.d.ts` has a default export but whose `.d.mts` is still a thin
 * `export { default } from './x.js'` wrapper. Under `node16` such a default import is the CommonJS module namespace
 * (DEV-3421, DEV-3430). The list comes from the `exports` map, so a new default-exporting entry cannot be missed.
 *
 * @returns {string[]} The `exports` keys paired with the wrapper declaration they resolve to.
 */
function listNamespaceTypedDefaults() {
  const { exports: exportsMap = {} } = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  const found = [];

  Object.entries(exportsMap).forEach(([key, conditions]) => {
    const mtsFile = conditions?.import?.types;

    if (typeof mtsFile !== 'string' || !mtsFile.endsWith('.d.mts')) {
      return;
    }

    const dtsPath = path.join(packageDir, mtsFile.replace(/\.d\.mts$/, '.d.ts'));
    const mtsPath = path.join(packageDir, mtsFile);

    if (existsSync(dtsPath) && existsSync(mtsPath)
      && /\bexport\s+default\b/.test(readFileSync(dtsPath, 'utf8'))
      && /\bexport\s*\{\s*default\s*\}\s*from\b/.test(readFileSync(mtsPath, 'utf8'))) {
      found.push(`${key} -> ${mtsFile}`);
    }
  });

  return found;
}

const namespaceTypedDefaults = listNamespaceTypedDefaults();

if (namespaceTypedDefaults.length > 0) {
  reportError('These entry points default-export a class or object, but their .d.mts is a thin wrapper, so a default '
    + `import is typed as the module namespace under node16:\n${namespaceTypedDefaults.join('\n')}`);
  process.exit(1);
}

const fixtureSource = readFileSync(fixture, 'utf8');
const reexportSource = readFileSync(reexportFixture, 'utf8');
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whether a fixture imports the preset's default export under a name.
 *
 * @param {string} source The fixture source.
 * @param {string} specifier The preset specifier.
 * @returns {string|null} The local name the default import is bound to.
 */
function findImportName(source, specifier) {
  return source.match(new RegExp(`import\\s+(\\w+)\\s+from\\s+'${escapeRegExp(specifier)}'`))?.[1] ?? null;
}

/**
 * Whether the re-export fixture exports the imported name as an unannotated constant. An import alone writes
 * nothing into the emitted declaration, so only this line makes declaration emit name the preset's type.
 *
 * @param {string} name The local name of the imported preset.
 * @returns {boolean} `true` when `export const x = <name>;` is present.
 */
const isReexported = name => new RegExp(`export\\s+const\\s+\\w+\\s*=\\s*${name}\\s*;`).test(reexportSource);

const problems = listPresetSpecifiers().flatMap((specifier) => {
  const reexportName = findImportName(reexportSource, specifier);

  return [
    findImportName(fixtureSource, specifier) ? null : `theme-presets.ts does not import ${specifier}`,
    reexportName ? null : `theme-presets-reexport.ts does not import ${specifier}`,
    !reexportName || isReexported(reexportName)
      ? null
      : `theme-presets-reexport.ts imports ${specifier} but does not re-export it as an unannotated constant`,
  ].filter(Boolean);
});

if (problems.length > 0) {
  reportError(`The fixtures do not cover every preset, so a regression would pass:\n${problems.join('\n')}`);
  process.exit(1);
}

/**
 * The `handsontable/settingsSchema` entry loaded at runtime. Each check fails unless the schema
 * carries its generated options, which a module resolved to the wrong format (a CommonJS file
 * default-imported into ES modules) does not.
 */
const SETTINGS_SCHEMA_ASSERTION = 'if (!m.settingsSchema.properties.colHeaders) { throw new Error("no options"); }';
const RUNTIME_CHECKS = [
  {
    name: 'settingsSchema, import',
    args: ['--input-type=module', '-e',
      `const m = await import('handsontable/settingsSchema'); ${SETTINGS_SCHEMA_ASSERTION}`],
  },
  {
    name: 'settingsSchema, require',
    args: ['-e', `const m = require('handsontable/settingsSchema'); ${SETTINGS_SCHEMA_ASSERTION}`],
  },
];

const workDir = mkdtempSync(path.join(tmpdir(), 'hot-esm-consumer-'));
let failed = false;
let spawnFailed = false;

try {
  const manifest = { name: 'esm-consumer', private: true, type: 'module' };

  writeFileSync(path.join(workDir, 'package.json'), JSON.stringify(manifest));
  cpSync(fixture, path.join(workDir, 'index.ts'));
  cpSync(reexportFixture, path.join(workDir, 'reexport.ts'));
  cpSync(entryPointsFixture, path.join(workDir, 'entry-points.ts'));
  mkdirSync(path.join(workDir, 'node_modules'));
  symlinkSync(packageDir, path.join(workDir, 'node_modules', 'handsontable'), 'junction');

  // Each fixture is its own program. Declaration emit reuses an import that any file in the program
  // already has, so `reexport.ts` (no type imports) must not share a program with `index.ts` (DEV-3431).
  const PROGRAMS = [
    { file: 'index.ts', label: '', emitDeclarations: false },
    { file: 'reexport.ts', label: ', declaration emit', emitDeclarations: true },
    { file: 'entry-points.ts', label: ', entry points', emitDeclarations: false },
  ];

  MODES.flatMap(mode => PROGRAMS.map(program => ({ mode, program }))).forEach(({ mode, program }) => {
    if (spawnFailed) {
      return;
    }

    const name = `${mode.name}${program.label}`;
    const config = `tsconfig.${mode.name}.${program.file}.json`;

    writeFileSync(path.join(workDir, config), JSON.stringify({
      compilerOptions: {
        module: mode.module,
        moduleResolution: mode.moduleResolution,
        target: 'es2022',
        strict: true,
        ...(program.emitDeclarations
          ? { declaration: true, emitDeclarationOnly: true, outDir: 'out' }
          : { noEmit: true }),
        skipLibCheck: true,
        types: [],
      },
      files: [program.file],
    }));

    const result = spawnSync(command, [...baseArgs, '-p', config], {
      cwd: workDir,
      encoding: 'utf8',
      shell: tscFromEnv !== undefined && process.platform === 'win32',
    });

    if (result.status === 0) {
      process.stdout.write(`ESM consumer types (${name}): ok\n`);
    } else {
      failed = true;

      if (result.error) {
        reportError(`Could not run ${tscFromEnv ? `TSC=${tscFromEnv}` : tscCli}: ${result.error.message}`);
        spawnFailed = true;

        return;
      }

      reportError(`ESM consumer types (${name}) do not compile:\n${result.stdout || ''}${result.stderr || ''}`);
    }
  });

  // Types alone do not prove the module loads: an import specifier the build left without an
  // extension type-checks under every mode and fails at runtime (`./schema.generated` did). Load
  // the one entry point that runs in Node without a DOM, through the `exports` map, both ways.
  RUNTIME_CHECKS.forEach(({ name, args }) => {
    const result = spawnSync(process.execPath, args, { cwd: workDir, encoding: 'utf8' });

    if (result.status === 0) {
      process.stdout.write(`Runtime import (${name}): ok\n`);
    } else {
      failed = true;
      reportError(`Runtime import (${name}) fails:\n${result.stdout || ''}${result.stderr || ''}`);
    }
  });
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
