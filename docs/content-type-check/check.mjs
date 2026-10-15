#!/usr/bin/env node
/**
 * Type-checks the docs examples a change touched, and fails only on the errors the change introduced.
 *
 * Scope: the JavaScript (`javascript/*.ts`), React (`react/*.tsx`) and Vue (`vue/*.vue`) examples under
 * `docs/content/`. Angular examples have their own checker (`docs/angular-type-check`).
 *
 * Rule: each changed file is compiled twice against the SAME current build of the core types and the
 * wrapper sources: once as it is now (head), once as it was at the base revision (base). The errors
 * are compared per file as a multiset of (code, message, elaboration lines). Only head errors with no base counterpart
 * fail the run, so the many examples that already carry type errors can be edited, and a pull request
 * is only blamed for what it adds. A new file has no base, so every error in it fails.
 *
 * Usage (run from anywhere, after `npm run build:types --prefix handsontable`):
 *   node check.mjs --base origin/develop       changed files = `git diff` against the merge base (+ uncommitted edits)
 *   node check.mjs --files <path>...           explicit repo-relative files, compared against HEAD (or --base)
 *   BASE_REF=<sha> node check.mjs              the same as --base, for CI
 *   --show-existing                            also list the tolerated (pre-existing) errors
 *
 * Exit codes: 0 passed (or nothing to check), 1 errors introduced, 2 the tooling failed.
 * Only built-in Node modules are used; `tsc` comes from `docs/` and `vue-tsc` from `wrappers/vue3`,
 * both installed by the root `pnpm install`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExampleFile, toolFor, parseDiagnostics, introducedErrors, parseNameStatus, escapeCommand } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const tmpDir = path.join(here, '.tmp');
const baseTree = path.join(tmpDir, 'base');
const inActions = process.env.GITHUB_ACTIONS === 'true';

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
      options.files.push(path.relative(repoRoot, path.resolve(process.cwd(), arg)).split(path.sep).join('/'));
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
    const entries = options.files
      .filter(file => isExampleFile(file) && existsSync(path.join(repoRoot, file)))
      .map(file => ({ head: file, base: existsAtBase(baseRev, file) ? file : null }));

    return { baseRev, entries };
  }

  if (!options.base) {
    die('Pass --base <ref> (or set BASE_REF), or list the files with --files <path>...');
  }

  const baseRev = resolveBase(options.base);
  const raw = git(['diff', '--name-status', '-M', '-z', '--diff-filter=AMRC', baseRev, '--', 'docs/content']);
  const entries = parseNameStatus(raw).filter(({ head }) => existsSync(path.join(repoRoot, head)));

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
 * @param {'ts'|'vue'} tool Which tool the config is for.
 * @param {string[]} files Absolute paths to compile.
 * @returns {object} A tsconfig object.
 */
function buildConfig(tool, files) {
  const paths = {
    handsontable: ['handsontable/tmp'],
    'handsontable/*': ['handsontable/tmp/*'],
  };

  if (tool === 'vue') {
    paths.vue = ['wrappers/vue3/node_modules/vue'];
    paths['@handsontable/vue3'] = ['wrappers/vue3/src/index.ts'];
  } else {
    paths['@handsontable/react-wrapper'] = ['wrappers/react-wrapper/src/index.tsx'];
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
      lib: ['ES2022', 'dom'],
      types: [],
      baseUrl: repoRoot,
      paths,
    },
    files,
  };
}

/**
 * Compiles a set of files and returns the diagnostics that belong to them.
 *
 * @param {'ts'|'vue'} tool The compiler to run.
 * @param {string} label A name for the temp config.
 * @param {string[]} files Absolute paths to compile.
 * @returns {Map<string, Array<{line: number, code: string, message: string}>>} Errors by absolute file path.
 */
function compile(tool, label, files) {
  const bin = tool === 'vue' ? compilers.vue : compilers.ts;
  const config = path.join(tmpDir, `tsconfig.${tool}.${label}.json`);

  writeFileSync(config, JSON.stringify(buildConfig(tool, files), null, 2));

  const run = spawnSync(process.execPath, [bin, '-p', config, '--pretty', 'false'], {
    cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 28,
  });
  const output = `${run.stdout}\n${run.stderr}`;
  const { diagnostics, global } = parseDiagnostics(output);

  if (run.error || global.length > 0 || (run.status !== 0 && diagnostics.length === 0)) {
    die(`${tool === 'vue' ? 'vue-tsc' : 'tsc'} failed to run (${label}).\n${run.error ?? ''}${output.slice(0, 4000)}\n`
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
}

/**
 * Materializes the base versions under `.tmp/base/<repo path>`: each file's directory is copied from
 * head first (so relative imports of sibling files keep resolving), then the base contents win.
 * The tree sits under `docs/`, so bare imports still resolve through `docs/node_modules`.
 *
 * @param {string} baseRev The base revision.
 * @param {Array<{head: string, base: string|null}>} entries The changed examples.
 * @returns {Map<string, string>} Base copy (absolute) to head path (repo-relative).
 */
function materializeBase(baseRev, entries) {
  const added = new Set(entries.filter(entry => !entry.base).map(entry => entry.head));
  const copies = new Map();

  for (const { head } of entries) {
    const dir = path.dirname(head);
    const target = path.join(baseTree, dir);

    mkdirSync(target, { recursive: true });

    for (const name of readdirSync(path.join(repoRoot, dir))) {
      const source = path.join(repoRoot, dir, name);

      if (statSync(source).isFile() && !added.has(`${dir}/${name}`)) {
        copyFileSync(source, path.join(target, name));
      }
    }
  }

  for (const { head, base } of entries) {
    if (base) {
      const content = execFileSync('git', ['show', `${baseRev}:${base}`], { cwd: repoRoot, maxBuffer: 1 << 28 });

      writeFileSync(path.join(baseTree, head), content);
      copies.set(path.join(baseTree, head), head);
    }
  }

  return copies;
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
  const baseCopies = materializeBase(baseRev, entries);
  const headErrors = new Map();
  const baseErrors = new Map();

  for (const tool of ['ts', 'vue']) {
    const mine = entries.filter(({ head }) => toolFor(head) === tool);

    if (mine.length === 0) {
      continue;
    }

    for (const [file, errors] of compile(tool, 'head', mine.map(({ head }) => path.join(repoRoot, head)))) {
      headErrors.set(path.relative(repoRoot, file).split(path.sep).join('/'), errors);
    }

    const mineBase = [...baseCopies].filter(([, head]) => toolFor(head) === tool);

    if (mineBase.length > 0) {
      for (const [file, errors] of compile(tool, 'base', mineBase.map(([copy]) => copy))) {
        baseErrors.set(baseCopies.get(file), errors);
      }
    }
  }

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
process.exit(1);
