import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The core `Unit` job runs on a pull request only when the scope router's
// `test-handsontable-unit` filter (checks.yml) matches a changed file. Besides
// `*hot-shared` (`src/`, `scripts/`, and the build configuration), that filter
// used to name only `./handsontable/test/unit/**`, which stopped being a Jest
// root in 2023. The Jest config has had a second root, `test`, since 2026, so a
// pull request that changed only a config-pinning test in
// `handsontable/test/__tests__/`, a setup file, or a mock skipped Unit, and the
// change first ran on the develop push after the merge.
//
// This pins the filter to what the Jest run loads. The walk starts at every test
// the Jest config collects, every file the config and the `test:unit` task name,
// every Babel config babel-jest can read, and every manual mock, then follows
// static imports the way Jest resolves them: through `moduleNameMapper` first
// (`handsontable/...`, `walkontable/...`), else relative to the importing file,
// through `src/` and out of it. A moved directory, a new setup file, a new import
// outside the route, or a narrowed entry fails here. It lives in the tooling
// suite rather than next to the tests it routes, because a pull request that
// edits only checks.yml never routes Unit.
//
// Limits: a path built at run time (a template literal, `require(join(dir,
// name))`) is invisible to the walk, and a Jest config key this test does not
// know fails it rather than being guessed at. An import inside a comment or a
// string counts as real, which can only ask for a route nobody needs.
//
// Text-based, like visual-tiers.test.mjs: no YAML parser or glob library is a
// dependency of the repo root. Entries are matched the way dorny/paths-filter
// matches them (picomatch with `dot: true`, case-sensitive). Node's
// `path.matchesGlob` would not do: it ignores case on macOS and Windows.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

// Jest's `<rootDir>`: the directory that holds the config.
const CORE = 'handsontable';
const UNIT_FILTER = 'test-handsontable-unit';
const jestConfig = createRequire(import.meta.url)(path.join(root, CORE, 'jest.config.js'));

// The config keys this test knows how to follow. Another key can make Jest load a file
// (`globalSetup`, `snapshotSerializers`, `reporters`, `resolver`, `transform`, `preset`,
// `projects`), so a key outside this list fails the test until someone teaches it the new one.
const KNOWN_JEST_KEYS = [
  'coverageDirectory', 'coverageReporters', 'moduleNameMapper', 'roots', 'setupFiles',
  'setupFilesAfterEnv', 'testEnvironment', 'testPathIgnorePatterns', 'testRegex', 'testRunner',
];

// What introduces a module path the walk follows: `import ... from`, `export ... from`, a bare or
// dynamic `import`, `require()` and `require.resolve()`, the `jest.mock()` family (a mock without
// a factory loads the real module), and a Babel `extends`.
const SPECIFIER_LEADS = [
  /\bfrom\s+/,
  /\bimport\s*\(?\s*/,
  /\brequire(?:\.resolve)?\s*\(\s*/,
  /\bjest\.(?:mock|doMock|unmock|setMock|requireActual|requireMock|createMockFromModule)\s*\(\s*/,
  /\bextends:\s*\[?\s*/,
];
const SPECIFIER = new RegExp(
  `(?:${SPECIFIER_LEADS.map(lead => lead.source).join('|')})['"]([^'"\\n]+)['"]`, 'g'
);
// Jest maps every specifier through `moduleNameMapper` first, a relative one included: the first
// pattern that matches replaces the whole specifier with its target, `$n` filled in from the match.
const MODULE_MAPPINGS = Object.entries(jestConfig.moduleNameMapper ?? {})
  .map(([pattern, target]) => ({ pattern: new RegExp(pattern), targets: [target].flat() }));
// Jest's default module file extensions, then the same names as a directory index.
const MODULE_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json'];
const RESOLVE_SUFFIXES = ['', ...MODULE_EXTENSIONS, ...MODULE_EXTENSIONS.map(extension => `/index${extension}`)];
// The Babel configs babel-jest reads for the core: the package's project-wide config, and a
// file-relative `.babelrc` anywhere inside the package.
const BABEL_CONFIG = new RegExp(
  `^${CORE}/(?:babel\\.config\\.(?:js|cjs|mjs|json)|(?:.+/)?\\.babelrc(?:\\.(?:js|cjs|mjs|json))?)$`
);
// One path-filter entry, read the way dorny/paths-filter reads it: a quoted or plain glob with an
// optional trailing comment. A status-prefixed entry (`- added|modified: '...'`) or a nested list
// routes only some changes, which this test does not model, so it does not match.
const GLOB_ENTRY = /^ {14}- (?:'([^']+)'|"([^"\\]+)"|([\w./](?:[^\s#]*[^\s#:])?))\s*(?:#.*)?$/;

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
 * The scope router's path filters as written: each filter's raw entry lines, in order. An alias
 * (`- *anchor`) is resolved to the filter that defined the anchor most recently before it, as YAML
 * resolves one. Entries are parsed only for the filters the Unit filter reaches (see
 * `filterGlobs`), so syntax this test does not model elsewhere in the block cannot fail it.
 *
 * @param {string} workflow The checks.yml source.
 * @returns {Map<string, Array<{line: string, alias?: string, target?: string}>>} The entries per filter key.
 */
function parseFilters(workflow) {
  const lines = workflow.split('\n');
  const blocks = lines.flatMap((line, index) => (line.trim() === 'filters: |' ? [index] : []));

  assert.equal(blocks.length, 1, 'checks.yml must hold exactly one `filters: |` block, the scope router\'s');

  const filters = new Map();
  const anchors = new Map();
  let entries = null;

  for (const line of lines.slice(blocks[0] + 1)) {
    const text = line.trim();

    if (text === '' || text.startsWith('#')) {
      continue;
    }
    // The block scalar ends at the first line indented less than its content.
    if (line.length - line.trimStart().length < 12) {
      break;
    }

    const key = line.match(/^ {12}([\w-]+):(?: &([\w-]+))?\s*(?:#.*)?$/);

    if (key) {
      entries = [];
      filters.set(key[1], entries);

      if (key[2]) {
        anchors.set(key[2], key[1]);
      }
      continue;
    }

    assert.ok(entries, `checks.yml: the path-filter line ${JSON.stringify(line)} belongs to no filter`);

    const alias = line.match(/^ {14}- \*([\w-]+)\s*(?:#.*)?$/);

    entries.push(alias ? { line, alias: alias[1], target: anchors.get(alias[1]) } : { line });
  }

  return filters;
}

/**
 * A path-filter glob as a regular expression, matching what picomatch matches with `dot: true`:
 * a leading `./` is dropped, a `**` segment spans any number of segments, `*` and `?` stay within
 * one, `{a,b}` is an alternation of literals, and case always matters. Any other glob syntax fails
 * the test instead of being guessed at.
 *
 * @param {string} glob A path-filter entry.
 * @returns {RegExp} The anchored expression.
 */
function globToRegExp(glob) {
  assert.doesNotMatch(glob, /^!|[[\]()+@\\]/, `checks.yml: '${glob}' uses glob syntax this test does not model`);

  const pattern = glob.replace(/^\.\//, '');
  const literal = text => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  let source = '';

  for (let i = 0; i < pattern.length; i += 1) {
    const wholeSegment = (i === 0 || pattern[i - 1] === '/')
      && (pattern[i + 2] === '/' || i + 2 === pattern.length);

    if (pattern.startsWith('**', i) && wholeSegment && pattern[i + 2] === '/') {
      // Any number of whole segments, none included.
      source += '(?:[^/]+/)*';
      i += 2;
    } else if (pattern.startsWith('**', i) && wholeSegment) {
      // At the end: anything below this point, and, as picomatch has it, the directory itself.
      source = source.endsWith('\\/') ? `${source.slice(0, -2)}(?:/.*)?` : `${source}.*`;
      i += 1;
    } else if (pattern[i] === '*') {
      assert.notEqual(pattern[i + 1], '*', `checks.yml: '${glob}' has a ** that is not a whole segment`);
      source += '[^/]*';
    } else if (pattern[i] === '?') {
      source += '[^/]';
    } else if (pattern[i] === '{') {
      const end = pattern.indexOf('}', i);
      const options = pattern.slice(i + 1, end).split(',');

      assert.ok(end > i && options.every(option => /^[\w.-]+$/.test(option)),
        `checks.yml: '${glob}' has a brace group this test does not model`);
      source += `(?:${options.map(literal).join('|')})`;
      i = end;
    } else {
      source += literal(pattern[i]);
    }
  }

  return new RegExp(`^${source}$`);
}

/**
 * One filter's globs with every alias expanded, recursively: the list dorny/paths-filter matches a
 * changed file against. Each entry on the way must be one this test can read.
 *
 * @param {ReturnType<typeof parseFilters>} filters The parsed filters.
 * @param {string} name The filter key.
 * @param {string[]} [via] The filters that led here, to catch a cycle.
 * @returns {Array<{glob: string, regExp: RegExp, writtenIn: string}>} The globs, each with the filter that spells it.
 */
function filterGlobs(filters, name, via = []) {
  const entries = filters.get(name);

  assert.ok(entries, `checks.yml has no ${name} path filter`);
  assert.ok(!via.includes(name), `checks.yml: the ${name} filter includes itself through ${via.join(' > ')}`);

  return entries.flatMap(({ line, alias, target }) => {
    if (alias) {
      assert.ok(target, `checks.yml: the ${name} filter names *${alias} before any filter defines it`);

      return filterGlobs(filters, target, [...via, name]);
    }

    const match = line.match(GLOB_ENTRY);

    assert.ok(match, `checks.yml: the ${name} filter has the entry ${JSON.stringify(line.trim())}, `
      + 'which this test cannot read');

    const glob = match[1] ?? match[2] ?? match[3];

    return [{ glob, regExp: globToRegExp(glob), writtenIn: name }];
  });
}

/**
 * Whether a change to `file` matches one of `globs`, the way the scope router asks.
 *
 * @param {Array<{regExp: RegExp}>} globs The expanded filter.
 * @param {string} file A path relative to the repository root.
 * @returns {boolean} True when the filter routes the file.
 */
function routes(globs, file) {
  return globs.some(({ regExp }) => regExp.test(file));
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
 * Every `<rootDir>` path a config value holds, at any depth.
 *
 * @param {unknown} value A config value.
 * @returns {string[]} The paths, as written.
 */
function rootDirPaths(value) {
  if (typeof value === 'string') {
    return value.startsWith('<rootDir>/') ? [value] : [];
  }

  return value && typeof value === 'object' ? Object.values(value).flatMap(rootDirPaths) : [];
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
 * The tracked file a specifier in `from` resolves to, the way Jest resolves it: through the first
 * `moduleNameMapper` pattern that matches, else relative to `from` (`'.'` and `'..'` included). A
 * package name, or a path to an untracked file such as build output, resolves to nothing, since no
 * pull request can change it.
 *
 * @param {string} from The importing file, relative to the repository root.
 * @param {string} specifier The module path as written.
 * @param {Set<string>} tracked The tracked files.
 * @returns {{file: string, mapped: boolean}|null} The file, and whether a mapping produced it.
 */
function resolveSpecifier(from, specifier, tracked) {
  const mapping = MODULE_MAPPINGS.find(({ pattern }) => pattern.test(specifier));
  let bases = [];

  if (mapping) {
    const match = specifier.match(mapping.pattern);

    bases = mapping.targets
      .map(target => target.replace(/\$(\d+)/g, (_, index) => match[Number(index)] ?? ''))
      .filter(target => target.startsWith('<rootDir>/'))
      .map(fromRootDir);
  } else if (/^\.\.?(?:\/|$)/.test(specifier)) {
    bases = [path.posix.join(path.posix.dirname(from), specifier)];
  }

  for (const base of bases) {
    // `'../../'` imports the directory's index; join() keeps the trailing slash.
    const trimmed = base.replace(/\/+$/, '');
    const file = RESOLVE_SUFFIXES.map(suffix => `${trimmed}${suffix}`).find(candidate => tracked.has(candidate));

    if (file) {
      return { file, mapped: Boolean(mapping) };
    }
  }

  return null;
}

/**
 * Every tracked file `start` loads through static imports, transitively, with the file that first
 * imported it and whether that import went through `moduleNameMapper`.
 *
 * @param {string[]} start The files the walk begins at.
 * @param {Set<string>} tracked The tracked files.
 * @returns {Map<string, {importer: string, mapped: boolean}|null>} Each reached file and how it was
 * first reached (null for a start file).
 */
function importClosure(start, tracked) {
  const reached = new Map(start.map(file => [file, null]));
  const queue = [...start];

  while (queue.length > 0) {
    const file = queue.shift();

    for (const [, specifier] of read(file).matchAll(SPECIFIER)) {
      const resolved = resolveSpecifier(file, specifier, tracked);

      if (resolved && !reached.has(resolved.file)) {
        reached.set(resolved.file, { importer: file, mapped: resolved.mapped });
        queue.push(resolved.file);
      }
    }
  }

  return reached;
}

const checks = read('.github/workflows/checks.yml');
const tracked = trackedFiles();
const tasks = JSON.parse(read(`${CORE}/scripts/tasks.json`));
// Read inside each test, so a renamed or unreadable filter fails the tests with their own reasons.
const unitFilter = () => filterGlobs(parseFilters(checks), UNIT_FILTER);

test('the scope router reads the filter, and the Unit job runs the Jest config this test reads', () => {
  // The filters belong to the dorny/paths-filter step under the id the outputs read, and it keeps
  // the default OR semantics: `predicate-quantifier: every` would change what every entry means.
  const blockAt = checks.indexOf('filters: |');
  const step = checks.slice(checks.lastIndexOf('\n      - ', blockAt), blockAt);

  assert.match(step, /^ {6}- uses: dorny\/paths-filter@[0-9a-f]{40}\b/m,
    'checks.yml: the filters this test reads must be the dorny/paths-filter step\'s');
  assert.match(step, /^ {8}id: path-filter$/m, 'checks.yml: the path-filter step must keep the id its outputs read');
  assert.doesNotMatch(step, /predicate-quantifier/,
    'checks.yml: this test models dorny/paths-filter\'s OR semantics only');

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

  // The whole condition, so a clause that skips Unit on a pull request cannot slip in unnoticed.
  const condition = '${{ !failure() && !cancelled() && (needs.checks.outputs.run-all == \'true\' '
    + `|| needs.checks.outputs.${UNIT_FILTER} == 'true') }}`;

  assert.ok(unitJob.includes(`\n    if: ${condition}\n`),
    `test.yml: the unit job must run when the scope router flags ${UNIT_FILTER}`);
  assert.match(unitJob, /^ {4}uses: \.\/\.github\/workflows\/unit\.yml$/m);

  // unit.yml runs the core's test:unit script, that script runs the test:unit pipeline, and the
  // pipeline runs Jest with its default config lookup and no flag that changes what Jest loads. The
  // lookahead keeps `npm run test:unit.jest` or `test:unit:ci` from passing for the script itself.
  assert.match(read('.github/workflows/unit.yml'), /^ +cd handsontable\n(?: +#.*\n)* +npm run test:unit(?![\w.:-])/m,
    'unit.yml must run the core test:unit script from handsontable/');
  const unitScript = JSON.parse(read(`${CORE}/package.json`)).scripts['test:unit'];

  assert.equal(unitScript, 'node scripts/run.mjs --sequential test:unit',
    'handsontable/package.json: the test:unit script must run the test:unit pipeline');
  assert.deepEqual(tasks.pipelines['test:unit'].tasks, ['test:unit.jest']);

  const jestTask = tasks.tasks['test:unit.jest'];
  const loadFlag = new RegExp([
    /^(?:-c|--config|--rootDir|--roots|--projects|--selectProjects)$/.source,
    /^(?:--testRegex|--testMatch)$|^--(?:setup|global)/.source,
  ].join('|'));

  assert.match(jestTask.cmd, /\bjest$/, 'test:unit.jest must run Jest with no flags of its own');
  assert.deepEqual(jestTask.passthroughFilter.filter(flag => loadFlag.test(flag)), [],
    'test:unit.jest must not forward a flag that changes what Jest loads');
});

test('the browser floor and the root Babel config reach every job that compiles the core', () => {
  const filters = parseFilters(checks);
  const configFiles = filterGlobs(filters, 'config-files');

  // Every build config in handsontable/.config/ requires browser-targets.js, and the core's Babel
  // config extends the root one. Both belong in `config-files`, which every `*hot-shared` filter
  // takes in, so a floor change builds the bundles, runs every suite, and renders the visual tier,
  // which follows the ES + CJS build. Listed in the Unit filter alone, Build, E2E, Walkontable, and
  // Visual all skipped such a change. Walkontable lists `.config/` by hand, so it names the floor.
  assert.ok(routes(configFiles, 'browser-targets.js'), 'checks.yml: config-files must route browser-targets.js');
  assert.ok(routes(configFiles, 'babel.config.js'), 'checks.yml: config-files must route the root babel.config.js');
  assert.ok(routes(filterGlobs(filters, 'test-handsontable-walkontable'), 'browser-targets.js'),
    'checks.yml: test-handsontable-walkontable must route browser-targets.js, which its configs require');
});

test('every entry of the Unit filter matches a tracked file', () => {
  const unitGlobs = unitFilter();

  assert.ok(unitGlobs.length > 0, `checks.yml: the ${UNIT_FILTER} filter has no entries`);

  for (const { glob, regExp, writtenIn } of unitGlobs) {
    const entry = writtenIn === UNIT_FILTER
      ? `the ${UNIT_FILTER} entry '${glob}'`
      : `the ${writtenIn} entry '${glob}', which ${UNIT_FILTER} takes through an anchor,`;

    assert.ok([...tracked].some(file => regExp.test(file)),
      `checks.yml: ${entry} matches no tracked file, so it routes nothing; fix it where it is written`);
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

test('the Unit filter routes every file the core Jest run loads', () => {
  const unitGlobs = unitFilter();
  const unknownKeys = Object.keys(jestConfig).filter(key => !KNOWN_JEST_KEYS.includes(key));

  assert.deepEqual(unknownKeys, [],
    `jest.config.js sets ${unknownKeys.join(', ')}, which this test does not know. If a key makes Jest `
      + 'load a file, start the walk there, then add the key to KNOWN_JEST_KEYS');

  for (const key of ['testEnvironment', 'testRunner']) {
    const value = jestConfig[key] ?? '';

    assert.ok(value.startsWith('<rootDir>/') || !/^\.{0,2}\//.test(value),
      `jest.config.js: write the ${key} path as <rootDir>/... so this test can follow it`);
  }
  for (const value of [...(jestConfig.setupFiles ?? []), ...(jestConfig.setupFilesAfterEnv ?? [])]) {
    assert.ok(tracked.has(fromRootDir(value)), `jest.config.js loads ${value}, which is not a tracked file`);
  }

  const roots = jestConfig.roots.map(fromRootDir);
  const envFile = tasks.tasks['test:unit.jest'].cmd.match(/\benv-cmd -f (\S+)/);
  const start = [...new Set([
    `${CORE}/jest.config.js`,
    // Every file the config names: the setup files, a mapping without a capture, and any other.
    ...rootDirPaths(jestConfig).map(fromRootDir).filter(file => tracked.has(file)),
    // The environment file the test:unit task loads before Jest starts.
    ...(envFile ? [path.posix.join(CORE, envFile[1])] : []),
    // babel-jest, the default transform with no `transform` key, reads these without an import.
    ...[...tracked].filter(file => BABEL_CONFIG.test(file)),
    // Jest takes a manual mock from any `__mocks__` directory under its roots by convention.
    ...[...tracked].filter(file => roots.some(dir => file.startsWith(`${dir}/`)) && file.includes('/__mocks__/')),
    ...jestTests(tracked),
  ])];

  for (const file of start) {
    assert.ok(tracked.has(file), `the walk starts at ${file}, which is not a tracked file`);
  }

  const reached = importClosure(start, tracked);

  // Vacuity guards, and the reasons behind the root entries in `config-files`: the walk must follow
  // a bare import (bootstrap.js), a Babel `extends` (the core config extends the root one), a require
  // (the root config loads the browser floor), an import that leaves `src/`, and an import Jest maps
  // through `moduleNameMapper` (`walkontable/...`, `handsontable/...`). If it stops reaching these,
  // its parsing broke.
  assert.equal(reached.get(`${CORE}/test/helpers/custom-matchers.js`)?.importer, `${CORE}/test/bootstrap.js`);
  assert.equal(reached.get('babel.config.js')?.importer, `${CORE}/babel.config.js`);
  assert.ok(reached.has('browser-targets.js'), 'the walk no longer reaches browser-targets.js');
  assert.ok([...reached].some(([file, edge]) => edge?.importer.startsWith(`${CORE}/src/`)
    && !file.startsWith(`${CORE}/src/`)), 'the walk no longer follows an import out of src/');
  assert.ok([...reached.values()].some(edge => edge?.mapped), 'the walk no longer follows a mapped import');

  for (const [file, edge] of reached) {
    const why = edge === null ? 'where the walk starts' : `imported by ${edge.importer}`;

    assert.ok(routes(unitGlobs, file),
      `checks.yml: ${UNIT_FILTER} does not route ${file} (${why}), so a pull request that changes only it `
        + 'skips the Unit job');
  }

  for (const target of Object.values(jestConfig.moduleNameMapper ?? {}).filter(value => value.includes('$'))) {
    const probe = fromRootDir(target.replace(/\$\d/g, '/probe'));

    assert.ok(routes(unitGlobs, probe),
      `checks.yml: ${UNIT_FILTER} does not route what the Jest mapping to ${target} resolves to`);
  }
});
