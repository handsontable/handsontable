#!/usr/bin/env node
/**
 * Type-checks the docs examples a change touched, and fails only on the errors the change introduced.
 *
 * Scope: the JavaScript (`javascript/*.ts`), React (`react/*.tsx`) and Vue (`vue/*.vue`) examples under
 * `docs/content/`. Angular examples have their own checker (`docs/angular-type-check`).
 *
 * Rule: each changed file is compiled twice against the SAME current build of the core types and the
 * wrapper sources: once as it is now (head), once as it was at the base revision (base). The base folder
 * of every example is read from the base revision, so a helper next to the example is the base version
 * too. The errors are compared per file as a multiset of (code, message shape, elaboration lines), with
 * the quoted names and types removed. Only head errors with no base counterpart fail the run, so the
 * many examples that already carry type errors can be edited, and a pull request is only blamed for what
 * it adds. A new file has no base, so every error in it fails.
 *
 * Every example folder (one page, one framework) is its own program, so `declare global` blocks of
 * different examples never merge. The programs run in parallel.
 *
 * Usage (run from anywhere, after `npm run build:types --prefix handsontable`):
 *   node check.mjs --base origin/develop       changed files = `git diff` against the merge base (+ uncommitted and untracked edits)
 *   node check.mjs --files <path>...           explicit files, compared against HEAD (or --base). Relative paths resolve
 *                                              against the directory `npm run` was started in (`INIT_CWD`)
 *   BASE_REF=<sha> node check.mjs              the same as --base, for CI
 *   --show-existing                            also list the tolerated (pre-existing) errors
 *
 * Exit codes: 0 passed (or nothing to check), 1 errors introduced, 2 the tooling failed or the arguments are wrong.
 * Only built-in Node modules are used; `tsc` comes from `docs/` and `vue-tsc` from `wrappers/vue3`,
 * both installed by the root `pnpm install`.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExampleFile, toolFor, parseDiagnostics, introducedErrors, parseNameStatus, escapeCommand } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const tmpDir = path.join(here, '.tmp');
const baseTree = path.join(tmpDir, 'base');
const inActions = process.env.GITHUB_ACTIONS === 'true';
const toPosix = value => value.split(path.sep).join('/');

/**
 * @param {string[]} args Arguments of the git command.
 * @returns {string} Its stdout.
 */
function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * @param {string} message The failure to print.
 * @param {number} code The exit code.
 */
function die(message, code = 2) {
  console.error(message);
  process.exit(code);
}

/**
 * @param {string[]} argv Command line arguments.
 * @returns {{ base: string|null, files: string[], showExisting: boolean }} Parsed options.
 */
function parseArgs(argv) {
  const options = { base: process.env.BASE_REF || null, files: [], showExisting: false };
  // `npm run --prefix docs` starts the script in docs/, and npm records where the user typed the command.
  const invokedFrom = realpathSync(process.env.INIT_CWD || process.cwd());
  let collectingFiles = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--base') {
      options.base = argv[++i];
      collectingFiles = false;
    } else if (arg === '--files') {
      collectingFiles = true;
    } else if (arg === '--show-existing') {
      options.showExisting = true;
    } else if (arg.startsWith('--')) {
      die(`Unknown option ${arg}`);
    } else if (collectingFiles) {
      options.files.push(toPosix(path.relative(repoRoot, path.resolve(invokedFrom, arg))));
    } else {
      die(`Unexpected argument ${arg}. Use --base <ref> or --files <path>...`);
    }
  }

  return options;
}

/**
 * @param {string} ref A revision.
 * @returns {string} The merge base of the ref and HEAD, or the ref itself when no common history is available (shallow CI fetch).
 */
function resolveBase(ref) {
  try {
    return git(['merge-base', ref, 'HEAD']).trim();
  } catch {
    try {
      return git(['rev-parse', '--verify', `${ref}^{commit}`]).trim();
    } catch {
      return die(`Cannot resolve the base revision "${ref}". Fetch it first (git fetch origin <ref>).`);
    }
  }
}

/**
 * @param {string} baseRev The base revision.
 * @param {string} file A repo-relative path.
 * @returns {boolean} True when the file exists at the base revision.
 */
function existsAtBase(baseRev, file) {
  try {
    git(['cat-file', '-e', `${baseRev}:${file}`]);

    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{ base: string|null, files: string[] }} options Parsed options.
 * @returns {{ baseRev: string, entries: Array<{head: string, base: string|null}> }} The base revision and the changed examples.
 */
function collectChanges(options) {
  if (options.files.length > 0) {
    const baseRev = resolveBase(options.base || 'HEAD');
    const unchecked = options.files.filter(file => !isExampleFile(file) || !existsSync(path.join(repoRoot, file)));

    if (unchecked.length > 0) {
      die(`Not a checked docs example (a javascript/*.ts, react/*.tsx or vue/*.vue file under docs/content that exists): ${unchecked.join(', ')}`);
    }

    const entries = options.files.map(file => ({ head: file, base: existsAtBase(baseRev, file) ? file : null }));

    for (const { head, base } of entries) {
      if (base && git(['diff', '--name-only', baseRev, '--', head]).trim() === '') {
        console.warn(`Warning: ${head} has no changes against ${baseRev.slice(0, 10)}, so every error in it counts as pre-existing. Pass --base <ref> to compare with an earlier revision.`);
      }
    }

    return { baseRev, entries };
  }

  if (!options.base) {
    die('Pass --base <ref> (or set BASE_REF), or list the files with --files <path>...');
  }

  const baseRev = resolveBase(options.base);
  const raw = git(['diff', '--name-status', '-M', '-z', '--diff-filter=AMRC', baseRev, '--', 'docs/content']);
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z', '--', 'docs/content']).split('\0').filter(isExampleFile);
  const entries = [
    ...parseNameStatus(raw),
    ...untracked.map(head => ({ head, base: null })),
  ].filter(({ head }) => existsSync(path.join(repoRoot, head)));

  return { baseRev, entries };
}

/**
 * @param {string} pkgJson A package.json path to resolve from.
 * @param {string} specifier The module specifier of the tool's executable.
 * @param {string} hint How to get the tool.
 * @returns {string} The absolute path of the executable script.
 */
function resolveTool(pkgJson, specifier, hint) {
  try {
    return createRequire(pkgJson).resolve(specifier);
  } catch {
    return die(`Cannot find ${specifier} from ${path.relative(repoRoot, pkgJson)}. ${hint}`);
  }
}

/**
 * @returns {string} The ES lib the repository supports (`ES_TARGET` of `browser-targets.js`), so an example may use any built-in the core may.
 */
function esLib() {
  try {
    return createRequire(import.meta.url)(path.join(repoRoot, 'browser-targets.js')).ES_TARGET;
  } catch {
    return 'es2024';
  }
}

/**
 * @param {'ts'|'vue'} tool Which tool the config is for.
 * @param {string[]} files Absolute paths to compile.
 * @returns {object} A tsconfig object.
 */
function buildConfig(tool, files) {
  const at = relative => path.join(repoRoot, relative);
  const paths = {
    handsontable: [at('handsontable/tmp')],
    'handsontable/*': [at('handsontable/tmp/*')],
  };

  if (tool === 'vue') {
    paths.vue = [at('wrappers/vue3/node_modules/vue')];
    paths['@handsontable/vue3'] = [at('wrappers/vue3/src/index.ts')];
  } else {
    paths['@handsontable/react-wrapper'] = [at('wrappers/react-wrapper/src/index.tsx')];
  }

  return {
    compilerOptions: {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      jsx: 'react-jsx',
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'bundler',
      moduleDetection: 'force',
      lib: [esLib(), 'dom', 'dom.iterable'],
      types: existsSync(path.join(repoRoot, 'docs/node_modules/vite/client.d.ts')) ? ['vite/client'] : [],
      paths,
    },
    files,
  };
}

const concurrency = Math.max(1, Math.min(4, os.availableParallelism?.() ?? 2));
let running = 0;
const waiting = [];

/**
 * Runs `task` once fewer than `concurrency` compiler processes are alive.
 *
 * @template T
 * @param {() => Promise<T>} task The work.
 * @returns {Promise<T>} Its result.
 */
async function limited(task) {
  while (running >= concurrency) {
    await new Promise(resolve => waiting.push(resolve));
  }

  running += 1;

  try {
    return await task();
  } finally {
    running -= 1;
    waiting.shift()?.();
  }
}

/**
 * @param {string} bin The compiler script.
 * @param {string} config The tsconfig path.
 * @returns {Promise<{ status: number|null, output: string, error: Error|null }>} The finished process.
 */
function runCompiler(bin, config) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [bin, '-p', config, '--pretty', 'false'], { cwd: repoRoot });
    const chunks = [];

    child.stdout.on('data', chunk => chunks.push(chunk));
    child.stderr.on('data', chunk => chunks.push(chunk));
    child.on('error', error => resolve({ status: null, output: Buffer.concat(chunks).toString(), error }));
    child.on('close', status => resolve({ status, output: Buffer.concat(chunks).toString(), error: null }));
  });
}

/**
 * Compiles a set of files and returns the diagnostics that belong to them. Anything the compiler says
 * about its own configuration (`TS5xxx`, `TS6xxx`, or a diagnostic on the config file) is a tooling failure:
 * tsc skips every semantic check after such an error, so a run would pass without checking anything.
 *
 * @param {'ts'|'vue'} tool The compiler to run.
 * @param {string} label A name for the temp config.
 * @param {string[]} files Absolute paths to compile.
 * @returns {Promise<Map<string, Array<{line: number, code: string, message: string}>>>} Errors by absolute file path.
 */
function compile(tool, label, files) {
  return limited(async() => {
    const bin = tool === 'vue' ? compilers.vue : compilers.ts;
    const config = path.join(tmpDir, `tsconfig.${tool}.${label}.json`);

    writeFileSync(config, JSON.stringify(buildConfig(tool, files), null, 2));

    const run = await runCompiler(bin, config);
    const { diagnostics, global } = parseDiagnostics(run.output);
    const configDiagnostics = diagnostics.filter(({ file, code }) => path.resolve(repoRoot, file) === config || /^TS[56]\d{3}$/.test(code));

    if (run.error || global.length > 0 || configDiagnostics.length > 0 || (run.status !== 0 && diagnostics.length === 0)) {
      die(`${tool === 'vue' ? 'vue-tsc' : 'tsc'} failed to run (${label}).\n${run.error ?? ''}${run.output.slice(0, 4000)}\n`
        + 'Is the core type build present? Run: npm run build:types --prefix handsontable');
    }

    const wanted = new Set(files);
    const byFile = new Map();

    for (const diagnostic of diagnostics) {
      const abs = path.resolve(repoRoot, diagnostic.file);

      if (wanted.has(abs)) {
        byFile.set(abs, [...(byFile.get(abs) ?? []), diagnostic]);
      }
    }

    return byFile;
  });
}

/**
 * Reads blobs of the base revision in one `git cat-file --batch` call.
 *
 * @param {string} baseRev The base revision.
 * @param {string[]} paths Repo-relative paths that exist at the base revision.
 * @returns {Map<string, Buffer>} Contents by path.
 */
function readBlobs(baseRev, paths) {
  const blobs = new Map();

  if (paths.length === 0) {
    return blobs;
  }

  const out = execFileSync('git', ['cat-file', '--batch'], {
    cwd: repoRoot, input: paths.map(file => `${baseRev}:${file}\n`).join(''), maxBuffer: 1 << 30,
  });
  let position = 0;

  for (const file of paths) {
    const eol = out.indexOf(10, position);
    const header = /^\S+ blob (\d+)$/.exec(out.toString('utf8', position, eol));

    if (!header) {
      die(`Cannot read ${file} at ${baseRev.slice(0, 10)}.`);
    }

    blobs.set(file, out.subarray(eol + 1, eol + 1 + Number(header[1])));
    position = eol + 1 + Number(header[1]) + 1;
  }

  return blobs;
}

/**
 * Materializes the base version of an example folder under `.tmp/base/<head folder>`: every file of the
 * folder as the base revision has it (so a sibling helper is the base version too), then each changed
 * example's own base content at its head name. The tree sits under `docs/`, so bare imports still
 * resolve through `docs/node_modules`.
 *
 * @param {string} baseRev The base revision.
 * @param {string} headDir The folder of the examples at head (repo-relative).
 * @param {Array<{head: string, base: string|null}>} entries The changed examples of that folder.
 * @returns {string[]} The base copies of the changed examples that exist at base (absolute).
 */
function materializeBase(baseRev, headDir, entries) {
  const withBase = entries.filter(entry => entry.base);
  const sourceDir = withBase.length > 0 ? path.posix.dirname(withBase[0].base) : headDir;
  const listing = git(['ls-tree', '-z', baseRev, `${sourceDir}/`]).split('\0').filter(Boolean);
  const siblings = listing
    .map(row => /^\d+ blob \S+\t(.+)$/.exec(row)?.[1])
    .filter(Boolean);
  const blobs = readBlobs(baseRev, [...new Set([...siblings, ...withBase.map(entry => entry.base)])]);
  const target = path.join(baseTree, headDir);

  mkdirSync(target, { recursive: true });

  for (const file of siblings) {
    writeFileSync(path.join(target, path.posix.basename(file)), blobs.get(file));
  }

  return withBase.map(({ head, base }) => {
    writeFileSync(path.join(baseTree, head), blobs.get(base));

    return path.join(baseTree, head);
  });
}

const options = parseArgs(process.argv.slice(2));
const { baseRev, entries } = collectChanges(options);

if (entries.length === 0) {
  console.log('Docs examples type check: no changed javascript/react/vue examples, nothing to check.');
  process.exit(0);
}

const compilers = {
  ts: resolveTool(path.join(repoRoot, 'docs/package.json'), 'typescript/bin/tsc', 'Run pnpm install at the repository root.'),
  vue: resolveTool(path.join(repoRoot, 'wrappers/vue3/package.json'), 'vue-tsc/bin/vue-tsc.js', 'Run pnpm install at the repository root.'),
};

if (!existsSync(path.join(repoRoot, 'handsontable/tmp/index.d.ts'))) {
  die('handsontable/tmp/index.d.ts is missing. Build the core types first: npm run build:types --prefix handsontable');
}

rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });

console.log(`Docs examples type check: ${entries.length} changed example(s) against base ${baseRev.slice(0, 10)}.`);

const failures = [];
let tolerated = 0;

try {
  const groups = new Map();

  for (const entry of entries) {
    const key = `${toolFor(entry.head)}\0${path.posix.dirname(entry.head)}`;

    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  const headErrors = new Map();
  const baseErrors = new Map();

  await Promise.all([...groups].map(async([key, group], index) => {
    const [tool, dir] = key.split('\0');
    const baseCopies = materializeBase(baseRev, dir, group);
    const [head, base] = await Promise.all([
      compile(tool, `head.${index}`, group.map(({ head: file }) => path.join(repoRoot, file))),
      baseCopies.length > 0 ? compile(tool, `base.${index}`, baseCopies) : new Map(),
    ]);

    for (const [file, errors] of head) {
      headErrors.set(toPosix(path.relative(repoRoot, file)), errors);
    }

    for (const [file, errors] of base) {
      baseErrors.set(toPosix(path.relative(baseTree, file)), errors);
    }
  }));

  for (const { head } of entries) {
    const result = introducedErrors(headErrors.get(head) ?? [], baseErrors.get(head) ?? []);

    tolerated += result.tolerated;

    if (options.showExisting && result.tolerated > 0) {
      console.log(`  ${head}: ${result.tolerated} pre-existing error(s) tolerated`);
    }

    for (const error of result.introduced) {
      failures.push({ file: head, ...error });
    }
  }
} finally {
  if (!process.env.KEEP_TMP) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (failures.length === 0) {
  console.log(`Passed: no type errors introduced (${tolerated} pre-existing error(s) in the changed files tolerated).`);
  process.exit(0);
}

for (const failure of failures) {
  console.log(`${failure.file}:${failure.line}  ${failure.code}  ${failure.message}`);

  if (inActions) {
    console.log(`::error file=${escapeCommand(failure.file, true)},line=${failure.line},title=${failure.code}::${escapeCommand(failure.message)}`);
  }
}

console.log(`\nFailed: ${failures.length} type error(s) introduced in ${new Set(failures.map(f => f.file)).size} file(s) (${tolerated} pre-existing tolerated).`);
console.log('Fix them, or, for an import with no types, put "// @ts-expect-error" above it. See docs/AGENTS.md, "Type-checking the examples".');

if (failures.some(({ code, message }) => code === 'TS2345' && /\bElement\b/.test(message))) {
  console.log('A TS2345 about \'Element\' means the container is untyped: write `document.querySelector<HTMLElement>(\'#exampleN\')!`.');
}

process.exit(1);
