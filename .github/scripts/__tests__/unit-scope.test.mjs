import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The core `Unit` job runs on a pull request only when the scope router's
// `test-handsontable-unit` filter (checks.yml) matches a changed file. Besides
// `*hot-shared`, which covers `src/`, that filter used to name only
// `./handsontable/test/unit/**`, which stopped being a Jest root in 2023. The
// Jest config has had a second root, `test`, since 2026, so a pull request that
// changed only a config-pinning test in `handsontable/test/__tests__/`, a setup
// file, or a mock skipped Unit, and the change first ran on the develop push
// after the merge. This pins the filter to what the Jest run loads: the files
// the Jest config names, followed through their static relative imports, so a
// moved directory, a new setup file, or a new import outside the route fails
// here. It lives in the tooling suite rather than next to the tests it routes,
// because a pull request that edits only checks.yml never routes Unit.
//
// Text-based, like visual-tiers.test.mjs: no YAML parser is a dependency of the
// repo root. dorny/paths-filter matches with picomatch and `dot: true`. Node's
// `matchesGlob` is stricter, since its wildcards never match a dot segment, so
// the difference can only fail this test, never pass it wrongly.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

// Jest's `<rootDir>`: the directory that holds the config.
const CORE = 'handsontable';
const UNIT_FILTER = 'test-handsontable-unit';
const jestConfig = createRequire(import.meta.url)(path.join(root, CORE, 'jest.config.js'));

// The edges the import walk follows: a static relative `import`, `export ... from`,
// `require()`, or Babel `extends`. A path built at run time (`require(join(dir,
// name))`) is invisible to it.
const RELATIVE_SPECIFIER = /(?:\bfrom\s+|\bimport\s*\(?\s*|\brequire\s*\(\s*|\bextends:\s*)['"](\.\.?\/[^'"\n]+)['"]/g;
const RESOLVE_SUFFIXES = ['', '.js', '.mjs', '.cjs', '.ts', '.json', '/index.js', '/index.ts'];

/**
 * Every tracked file, relative to the repository root. What a pull request changes is tracked,
 * so an entry must match the index, not the disk, which also holds build output and
 * `node_modules`. The git variables a hook exports are dropped so git finds this checkout from
 * `root` (see `lib/repo-root.mjs`).
 *
 * @returns {Set<string>} The tracked paths, with forward slashes.
 */
function trackedFiles() {
  const { GIT_DIR: _gitDir, GIT_WORK_TREE: _gitWorkTree, GIT_INDEX_FILE: _gitIndexFile, ...env } = process.env;
  const output = execFileSync('git', ['ls-files', '-z'], {
    cwd: root, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });

  return new Set(output.split('\0').filter(Boolean));
}

/**
 * The scope router's path filters as written: each filter's entries in order, an alias
 * (`- *anchor`) kept as a reference, and the filter each anchor names.
 *
 * @param {string} workflow The checks.yml source.
 * @returns {{filters: Map<string, Array<{glob: string}|{alias: string}>>, anchors: Map<string, string>}}
 * The entries per filter key, and the filter key per anchor name.
 */
function parseFilters(workflow) {
  const lines = workflow.split('\n');
  const start = lines.findIndex(line => line.trim() === 'filters: |');

  assert.notEqual(start, -1, 'checks.yml has no `filters: |` block');

  const filters = new Map();
  const anchors = new Map();
  let entries = null;

  for (const line of lines.slice(start + 1)) {
    const text = line.trim();

    if (text === '' || text.startsWith('#')) {
      continue;
    }
    // The block scalar ends at the first line indented less than its content.
    if (line.length - line.trimStart().length < 12) {
      break;
    }

    const key = line.match(/^ {12}([A-Za-z0-9-]+):(?: &([A-Za-z0-9-]+))?$/);

    if (key) {
      entries = [];
      filters.set(key[1], entries);

      if (key[2]) {
        anchors.set(key[2], key[1]);
      }
      continue;
    }

    const glob = line.match(/^ {14}- '([^']+)'$/);
    const alias = line.match(/^ {14}- \*([A-Za-z0-9-]+)$/);

    // Strict on purpose: a line this parser skipped would be an entry this test never checks.
    assert.ok(entries && (glob || alias), `checks.yml: cannot read the path-filter line ${JSON.stringify(line)}`);
    entries.push(glob ? { glob: glob[1] } : { alias: alias[1] });
  }

  return { filters, anchors };
}

/**
 * One filter's globs, every alias expanded to the globs of the filter that defines its anchor,
 * recursively: the list dorny/paths-filter matches a changed file against.
 *
 * @param {ReturnType<typeof parseFilters>} parsed The parsed filters.
 * @param {string} name The filter key.
 * @returns {Array<{glob: string, writtenIn: string}>} The globs, each with the filter that spells it.
 */
function filterGlobs(parsed, name) {
  const entries = parsed.filters.get(name);

  assert.ok(entries, `checks.yml has no ${name} path filter`);

  return entries.flatMap((entry) => {
    if ('glob' in entry) {
      return [{ glob: entry.glob, writtenIn: name }];
    }

    const target = parsed.anchors.get(entry.alias);

    assert.ok(target, `checks.yml: the ${name} filter names *${entry.alias}, which no filter defines`);

    return filterGlobs(parsed, target);
  });
}

/**
 * Whether a changed file at `file` matches one of `globs`, the way the scope router asks.
 *
 * @param {Array<{glob: string}>} globs The expanded filter.
 * @param {string} file A path relative to the repository root.
 * @returns {boolean} True when the filter routes the file.
 */
function routes(globs, file) {
  return globs.some(({ glob }) => path.posix.matchesGlob(file, glob.replace(/^\.\//, '')));
}

/**
 * A `<rootDir>` path from the Jest config, relative to the repository root.
 *
 * @param {string} value A config value such as `<rootDir>/test/bootstrap.js`.
 * @returns {string} The path, such as `handsontable/test/bootstrap.js`.
 */
function fromRootDir(value) {
  assert.match(value, /^<rootDir>\//, `jest.config.js: ${value} is not a <rootDir> path, which this test cannot place`);

  return path.posix.join(CORE, value.slice('<rootDir>/'.length));
}

/**
 * The tracked files Jest collects as tests: under one of its roots, matched by its `testRegex`,
 * and not by a `testPathIgnorePatterns` entry.
 *
 * @param {Set<string>} tracked The tracked files.
 * @returns {string[]} The test files.
 */
function jestTests(tracked) {
  assert.equal(typeof jestConfig.testRegex, 'string',
    'jest.config.js no longer selects tests with one `testRegex` string; teach this test the new selector');

  const roots = jestConfig.roots.map(fromRootDir);
  const testRegex = new RegExp(jestConfig.testRegex);
  const ignored = (jestConfig.testPathIgnorePatterns ?? [])
    .map(pattern => new RegExp(pattern.replace('<rootDir>', CORE)));

  return [...tracked].filter(file => roots.some(dir => file.startsWith(`${dir}/`))
    && testRegex.test(file)
    && !ignored.some(pattern => pattern.test(file)));
}

/**
 * Every tracked file `start` loads through static relative imports, transitively, with the file
 * that first imported it. The walk does not descend into `src/`, which `*hot-shared` routes
 * whole. An untracked target (build output) is skipped, since no pull request can change it.
 *
 * @param {string[]} start The files the walk begins at.
 * @param {Set<string>} tracked The tracked files.
 * @returns {Map<string, string>} Each reached file, mapped to its first importer (`start` for a start file).
 */
function importClosure(start, tracked) {
  const reached = new Map(start.map(file => [file, 'start']));
  const queue = [...start];

  while (queue.length > 0) {
    const file = queue.shift();

    if (file.startsWith(`${CORE}/src/`)) {
      continue;
    }

    for (const [, specifier] of read(file).matchAll(RELATIVE_SPECIFIER)) {
      const base = path.posix.join(path.posix.dirname(file), specifier);
      const target = RESOLVE_SUFFIXES.map(suffix => `${base}${suffix}`).find(candidate => tracked.has(candidate));

      if (target && !reached.has(target)) {
        reached.set(target, file);
        queue.push(target);
      }
    }
  }

  return reached;
}

const checks = read('.github/workflows/checks.yml');
const tracked = trackedFiles();
// Read inside each test, so a renamed or unreadable filter fails the tests with their own reasons.
const unitFilter = () => filterGlobs(parseFilters(checks), UNIT_FILTER);

test('the Unit job is gated on the test-handsontable-unit path filter', () => {
  // A renamed filter key would leave the output empty, and the Unit job would skip every pull request.
  assert.ok(checks.includes(`\n      ${UNIT_FILTER}: \${{ steps.path-filter.outputs.${UNIT_FILTER} }}\n`),
    `checks.yml: the scope job must export the ${UNIT_FILTER} filter as its output`);
  assert.ok(checks.includes(`\n      ${UNIT_FILTER}: { value: '\${{ jobs.scope.outputs.${UNIT_FILTER} }}' }\n`),
    `checks.yml: the workflow must re-export the scope job's ${UNIT_FILTER} output to test.yml`);

  const tests = read('.github/workflows/test.yml');
  const start = tests.indexOf('\n  unit:\n');

  assert.notEqual(start, -1, 'test.yml has no `unit` job');

  const next = tests.slice(start + 1).search(/\n {2}[A-Za-z0-9_-]+:\n/);
  const unitJob = tests.slice(start, next === -1 ? undefined : start + 1 + next);

  assert.match(unitJob, /^ {4}if: .*needs\.checks\.outputs\.test-handsontable-unit == 'true'/m,
    'test.yml: the unit job must run when the scope router flags test-handsontable-unit');
  assert.match(unitJob, /^ {4}uses: \.\/\.github\/workflows\/unit\.yml$/m);
});

test('every entry of the Unit filter matches a tracked file', () => {
  const unitGlobs = unitFilter();

  assert.ok(unitGlobs.length > 0, `checks.yml: the ${UNIT_FILTER} filter has no entries`);

  for (const { glob, writtenIn } of unitGlobs) {
    // The scope router's negation is OR-based (see the outside-ci note in checks.yml); this test
    // does not model it, and a negated entry here would route nearly everything.
    assert.ok(!glob.startsWith('!'), `checks.yml: ${writtenIn} carries the negated entry ${glob}`);
    assert.ok([...tracked].some(file => routes([{ glob }], file)),
      `checks.yml: the ${writtenIn} entry '${glob}' (part of ${UNIT_FILTER}) matches no tracked file, `
        + 'so it routes nothing; a moved directory leaves the Unit job blind to its new home');
  }
});

test('the Unit filter routes every test file the core Jest config collects', () => {
  const unitGlobs = unitFilter();
  const tests = jestTests(tracked);

  // Vacuity guards: one test per root is the least a working collection finds.
  for (const dir of jestConfig.roots.map(fromRootDir)) {
    assert.ok(tests.some(file => file.startsWith(`${dir}/`)),
      `no tracked Jest test under ${dir}; the collection drifted`);
  }

  for (const file of tests) {
    assert.ok(routes(unitGlobs, file),
      `checks.yml: ${UNIT_FILTER} does not route ${file}, a test the core Jest config collects, so a pull `
        + 'request that changes only it skips the Unit job');
  }
});

test('the Unit filter routes the Jest config and every file it loads outside src/', () => {
  const unitGlobs = unitFilter();

  // babel-jest is the default transform, and it reads the project-wide config in `<rootDir>`.
  assert.equal(jestConfig.transform, undefined,
    'jest.config.js now sets `transform`; check which config files that transform loads, and start the walk there');

  const mapped = Object.values(jestConfig.moduleNameMapper ?? {});
  const start = [
    `${CORE}/jest.config.js`,
    `${CORE}/babel.config.js`,
    ...[...(jestConfig.setupFiles ?? []), ...(jestConfig.setupFilesAfterEnv ?? [])].map(fromRootDir),
    // A mapping with a capture (`<rootDir>/src$1`) is checked below, but it names no single file.
    ...mapped.filter(target => !target.includes('$')).map(fromRootDir),
    ...jestTests(tracked).filter(file => !file.startsWith(`${CORE}/src/`)),
  ];

  for (const file of start) {
    assert.ok(tracked.has(file), `the walk starts at ${file}, which is not a tracked file`);
  }

  const reached = importClosure(start, tracked);

  // Vacuity guards, and the reason the root entries exist: the walk must follow a bare import
  // (bootstrap.js), a Babel `extends` (the core config extends the root one), and a require (the
  // root config loads the browser floor). If it stops reaching these, its parsing broke.
  assert.equal(reached.get(`${CORE}/test/helpers/custom-matchers.js`), `${CORE}/test/bootstrap.js`);
  assert.equal(reached.get('babel.config.js'), `${CORE}/babel.config.js`);
  assert.ok(reached.has('browser-targets.js'), 'the walk no longer reaches browser-targets.js');

  for (const [file, importer] of reached) {
    const why = importer === 'start' ? 'loaded by the Jest config' : `imported by ${importer}`;

    assert.ok(routes(unitGlobs, file),
      `checks.yml: ${UNIT_FILTER} does not route ${file} (${why}), so a pull request that changes only it `
        + 'skips the Unit job');
  }

  for (const target of mapped.filter(value => value.includes('$'))) {
    const probe = fromRootDir(target.replace(/\$\d/g, '/probe'));

    assert.ok(routes(unitGlobs, probe),
      `checks.yml: ${UNIT_FILTER} does not route what the Jest mapping to ${target} resolves to`);
  }
});
