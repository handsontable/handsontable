import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  checkLinkedPackages, danglingLinks, findBuildProblems, isCompiledSource, newestFile, packageCopies,
  preflightOptions, sourceFiles, workspacePackages,
} from '../local-builds.mjs';

// The two checks that keep the visual demos off the registry's builds (DEV-16): the guard each demo's `build`
// script runs first, and the preflight `scripts/build.mjs` runs before it installs anything. Each case builds a
// throwaway repository in the shape the checks read (root `workspaces`, pnpm's links in `examples/node_modules`,
// the linker's links under each framework directory) and puts it in one of the states that used to pass
// silently. The last tests pin the wiring: every demo's `build` runs the guard, `build.mjs` refuses before its
// first install, and no workflow builds a demo around its guard.

const PACKAGE_ROOT = join(import.meta.dirname, '..', '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..');
const INSTALL_JS = 'npm run examples:install next/visual-tests/js';
const GUARD = 'node ../../../../../visual-tests/scripts/check-linked-packages.mjs';

/**
 * Writes a file, creating its directory.
 *
 * @param {string} path The file.
 * @param {string|object} content The text, or an object written as JSON.
 */
function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content));
}

/**
 * Creates a directory symlink, creating its parent.
 *
 * @param {string} target What the link points at, relative to the link's directory or absolute.
 * @param {string} path The link.
 */
function link(target, path) {
  mkdirSync(dirname(path), { recursive: true });
  symlinkSync(target, path, 'junction');
}

/**
 * Sets a file's access and modification time, so an age comparison never depends on how fast the fixture was
 * written or how fine the file system's clock is.
 *
 * @param {string} path The file.
 * @param {string} iso The time, as an ISO date.
 */
function setTime(path, iso) {
  utimesSync(path, new Date(iso), new Date(iso));
}

/**
 * Builds a repository in the layout the checks read, with the core and both kinds of wrapper built and every
 * demo linked the way `examples:install` leaves it. The cases then break one thing each. The directory is
 * removed when the test ends.
 *
 * @param {object} t The test context, for the cleanup.
 * @returns {{root: string, demo: (framework: string) => string, frameworkModules: (framework: string) =>
 *   string}} The root and two path helpers.
 */
function makeRepo(t) {
  const root = mkdtempSync(join(tmpdir(), 'visual-local-builds-'));
  const examples = join(root, 'examples');

  t.after(() => rmSync(root, { recursive: true, force: true }));

  write(join(root, 'package.json'), { workspaces: ['handsontable', 'wrappers/*', 'examples'] });

  write(join(root, 'handsontable/package.json'),
    { name: 'handsontable', version: '18.1.1', publishConfig: { directory: 'tmp', linkDirectory: true } });
  write(join(root, 'handsontable/src/core.ts'), 'export {};');
  write(join(root, 'handsontable/tmp/package.json'), { name: 'handsontable', version: '18.1.1', module: 'index.mjs' });
  write(join(root, 'handsontable/tmp/index.mjs'), 'export {};');
  // The source predates the build, as it does after a full build.
  setTime(join(root, 'handsontable/src/core.ts'), '2026-01-01T00:00:00Z');
  setTime(join(root, 'handsontable/tmp/package.json'), '2026-02-01T00:00:00Z');

  // A wrapper whose build is its package directory (React, Vue), and one whose build is a subdirectory (Angular).
  write(join(root, 'wrappers/react-wrapper/package.json'),
    { name: '@handsontable/react-wrapper', version: '18.1.1', module: './es/react-handsontable.mjs' });
  write(join(root, 'wrappers/react-wrapper/es/react-handsontable.mjs'), 'export {};');
  write(join(root, 'wrappers/angular-wrapper/package.json'), {
    name: '@handsontable/angular-wrapper',
    version: '18.1.1',
    publishConfig: { directory: 'dist/hot-table', linkDirectory: true },
  });
  write(join(root, 'wrappers/angular-wrapper/dist/hot-table/package.json'),
    { name: '@handsontable/angular-wrapper', version: '18.1.1', module: 'fesm2022/hot-table.mjs' });
  write(join(root, 'wrappers/angular-wrapper/dist/hot-table/fesm2022/hot-table.mjs'), 'export {};');
  // A stray wrapper directory with no manifest, the leftover the DEV-16 audit found on disk.
  mkdirSync(join(root, 'wrappers/vue/node_modules'), { recursive: true });

  // What the root pnpm install links, relative like pnpm writes them.
  write(join(examples, 'package.json'), { name: 'handsontable-examples-internal' });
  link('../../handsontable/tmp', join(examples, 'node_modules/handsontable'));
  link('../../../wrappers/react-wrapper', join(examples, 'node_modules/@handsontable/react-wrapper'));
  link('../../../wrappers/angular-wrapper/dist/hot-table',
    join(examples, 'node_modules/@handsontable/angular-wrapper'));

  const frameworkDir = framework => join(examples, 'next/visual-tests', framework);
  const demo = framework => join(frameworkDir(framework), 'demo');
  const frameworkModules = framework => join(frameworkDir(framework), 'node_modules');

  write(join(demo('js'), 'package.json'),
    { dependencies: { handsontable: 'latest' }, devDependencies: { vite: '^6' } });
  write(join(demo('react-wrapper'), 'package.json'),
    { dependencies: { handsontable: 'latest', '@handsontable/react-wrapper': 'latest', react: '^18.2.0' } });
  write(join(demo('angular-wrapper'), 'package.json'),
    { dependencies: { handsontable: 'latest', '@handsontable/angular-wrapper': 'latest' } });

  // What the linker writes: absolute links to the pnpm links, under each framework directory, and for Angular
  // under the demo too, for every package it linked at the framework level.
  ['js', 'react-wrapper', 'angular-wrapper'].forEach((framework) => {
    link(join(examples, 'node_modules/handsontable'), join(frameworkModules(framework), 'handsontable'));
  });
  link(join(examples, 'node_modules/@handsontable/react-wrapper'),
    join(frameworkModules('react-wrapper'), '@handsontable/react-wrapper'));
  link(join(examples, 'node_modules/@handsontable/angular-wrapper'),
    join(frameworkModules('angular-wrapper'), '@handsontable/angular-wrapper'));
  link(join(frameworkModules('angular-wrapper'), 'handsontable'),
    join(demo('angular-wrapper'), 'node_modules/handsontable'));
  link(join(frameworkModules('angular-wrapper'), '@handsontable/angular-wrapper'),
    join(demo('angular-wrapper'), 'node_modules/@handsontable/angular-wrapper'));

  return { root, demo, frameworkModules };
}

/**
 * Makes the throwaway repository a git repository with the core's own ignore rules for what its build writes
 * under `src/`, so the age check lists its sources the way it does in a checkout. Asserts the command worked,
 * so a machine without git fails here instead of quietly testing the fallback.
 *
 * @param {string} root The throwaway repository.
 */
function gitInit(root) {
  write(join(root, 'handsontable/.gitignore'),
    'src/3rdparty/walkontable/dist/\nsrc/styles/handsontableStyles.js\nsrc/styles/handsontableStyles.ts\n');

  const result = spawnSync('git', ['init', '-q'], { cwd: root, encoding: 'utf8' });

  assert.equal(result.status, 0, `git init failed: ${result.stderr}`);
}

/**
 * Writes the files the core's build writes under `src/`, later than the stamp, the state a `build:styles` or
 * `build:walkontable` run leaves (both come first in `lint`, `test:unit`, `test:e2e`, and `test:walkontable`).
 *
 * @param {string} root The throwaway repository.
 */
function writeGeneratedSources(root) {
  ['src/styles/handsontableStyles.js', 'src/styles/handsontableStyles.ts', 'src/3rdparty/walkontable/dist/wot.js']
    .forEach((file) => {
      write(join(root, 'handsontable', file), '');
      setTime(join(root, 'handsontable', file), '2026-03-01T00:00:00Z');
    });
}

/**
 * Replaces a package in a `node_modules` directory with a plain copy, the way an install leaves the registry's
 * build when the linker does not run after it.
 *
 * @param {string} modulesDir The `node_modules` directory.
 * @param {string} name The package name.
 * @param {string} [version] The registry version to record.
 */
function installRegistryCopy(modulesDir, name, version = '18.1.0') {
  rmSync(join(modulesDir, name), { recursive: true, force: true });
  write(join(modulesDir, name, 'package.json'), { name, version });
}

test('workspacePackages maps every workspace package to the directory pnpm links it to', (t) => {
  const { root } = makeRepo(t);

  // pnpm 10 links to publishConfig.directory unless linkDirectory is false, so the flag's absence counts too.
  write(join(root, 'wrappers/vue3/package.json'), { name: '@handsontable/vue3', publishConfig: { directory: 'dist' } });
  write(join(root, 'wrappers/unlinked/package.json'),
    { name: '@handsontable/unlinked', publishConfig: { directory: 'dist', linkDirectory: false } });

  const packages = workspacePackages(root);

  assert.equal(packages.get('handsontable').buildDir, join(root, 'handsontable/tmp'));
  assert.equal(packages.get('@handsontable/angular-wrapper').buildDir,
    join(root, 'wrappers/angular-wrapper/dist/hot-table'));
  assert.equal(packages.get('@handsontable/vue3').buildDir, join(root, 'wrappers/vue3/dist'),
    'a directory without linkDirectory is still the link target');
  assert.equal(packages.get('@handsontable/unlinked').buildDir, join(root, 'wrappers/unlinked'),
    'linkDirectory: false links the package directory');
  assert.equal(packages.get('@handsontable/react-wrapper').buildDir, join(root, 'wrappers/react-wrapper'),
    'without publishConfig the package directory is the link target');
  assert.equal(packages.has('vue'), false, 'a wrappers/ directory without a manifest is no package');
});

test('a demo the linker linked passes, and only its monorepo packages are checked', (t) => {
  const { root, demo } = makeRepo(t);

  ['js', 'react-wrapper', 'angular-wrapper'].forEach((framework) => {
    const result = checkLinkedPackages({ repoRoot: root, demoDir: demo(framework) });

    assert.deepEqual(result.problems, [], `${framework}: ${JSON.stringify(result.problems)}`);
    assert.equal(result.skipped, null);
    assert.equal(result.demo, `examples/next/visual-tests/${framework}/demo`);
  });

  assert.deepEqual(checkLinkedPackages({ repoRoot: root, demoDir: demo('js') }).checked,
    [{ name: 'handsontable', buildDir: 'handsontable/tmp' }], 'vite is a dependency, not a monorepo package');
  assert.deepEqual(
    checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') }).checked.map(({ name }) => name),
    ['handsontable', '@handsontable/react-wrapper'],
  );
});

test('an install without the linker is refused, naming the copy and the command that links it', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  installRegistryCopy(frameworkModules('js'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.deepEqual(problems, [{
    summary: 'handsontable: resolves to a copy that is not the local build handsontable/tmp.',
    detail: [
      'examples/next/visual-tests/js/node_modules/handsontable is a plain copy of version 18.1.0, not a link.',
      'The linker replaces these with links to the local build when examples:install runs it.',
    ],
    remedy: `Install and link the demo: ${INSTALL_JS}`,
  }]);
});

test('a registry copy declared as a devDependency is refused the same way', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  write(join(demo('js'), 'package.json'), { devDependencies: { handsontable: 'latest', vite: '^6' } });
  installRegistryCopy(frameworkModules('js'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.deepEqual(problems.map(({ summary }) => summary),
    ['handsontable: resolves to a copy that is not the local build handsontable/tmp.']);
});

test('a missing core build is refused with the build command, since the linker skips it without a word', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  // The linker's pass over this state: its source is a dangling pnpm link, so it leaves the registry copy.
  rmSync(join(root, 'handsontable/tmp'), { recursive: true });
  installRegistryCopy(frameworkModules('js'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary, 'handsontable: the local build is missing (handsontable/tmp/package.json).');
  assert.match(problems[0].detail.join(' '), /The linker skips a package whose local build is missing/);
  assert.equal(problems[0].remedy,
    `Build it, then relink the demo: npm --prefix handsontable run build && ${INSTALL_JS}`);
});

test('an unbuilt React wrapper is refused before the bundler fails on the missing entry', (t) => {
  const { root, demo } = makeRepo(t);

  rmSync(join(root, 'wrappers/react-wrapper/es'), { recursive: true });

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary,
    '@handsontable/react-wrapper: the local build is missing (wrappers/react-wrapper/es/react-handsontable.mjs).');
  assert.deepEqual(problems[0].detail,
    ['The linker links the package anyway, and the demo build fails on the missing file.'],
    'the manifest is there, so the link is made; saying the linker skipped it would send the reader the wrong way');
  assert.equal(problems[0].remedy, 'Build it, then relink the demo: npm --prefix wrappers/react-wrapper run build '
    + '&& npm run examples:install next/visual-tests/react-wrapper');
});

test('a registry copy of a wrapper is refused like one of the core', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  installRegistryCopy(frameworkModules('react-wrapper'), '@handsontable/react-wrapper');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') });

  assert.equal(problems.length, 1);
  assert.match(problems[0].summary, /^@handsontable\/react-wrapper: resolves to a copy/);
});

test('the Angular demo is checked at both levels the linker writes, the nearest first', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  // The linker links the framework level, but a nested copy under the demo shadows it for the bundler and for
  // the stylesheet paths in angular.json.
  installRegistryCopy(join(demo('angular-wrapper'), 'node_modules'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('angular-wrapper') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].detail[0],
    'examples/next/visual-tests/angular-wrapper/demo/node_modules/handsontable is a plain copy of version 18.1.0, '
    + 'not a link.');
  assert.deepEqual(packageCopies(demo('angular-wrapper'), join(root, 'examples'), 'handsontable'), [
    join(demo('angular-wrapper'), 'node_modules/handsontable'),
    join(frameworkModules('angular-wrapper'), 'handsontable'),
    join(root, 'examples/node_modules/handsontable'),
  ]);
});

test('a registry copy where the linker reads from needs the root install, not a reinstall of the demo', (t) => {
  const { root, demo } = makeRepo(t);

  // `npm install` run in examples/ replaces pnpm's link with a copy, and the linker would then link that copy.
  installRegistryCopy(join(root, 'examples/node_modules'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.deepEqual(problems, [{
    summary: 'handsontable: resolves to a copy that is not the local build handsontable/tmp.',
    detail: [
      'examples/next/visual-tests/js/node_modules/handsontable links to examples/node_modules/handsontable '
        + '(version 18.1.0).',
      'examples/node_modules/handsontable is a plain copy of version 18.1.0, not a link.',
      'The linker copies its links from examples/node_modules/handsontable, which does not resolve to the local '
        + 'build either.',
    ],
    remedy: `Recreate the workspace links, then install and link the demo: pnpm install && ${INSTALL_JS}`,
  }]);
});

test('a registry copy with the linker\'s source gone needs the root install too, or the remedy loops', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  // `npm run all clean` removes examples/node_modules; the next install puts the locked copy where the
  // linker's link dangled, and the linker, with nothing to link from, leaves it.
  rmSync(join(root, 'examples/node_modules'), { recursive: true });
  installRegistryCopy(frameworkModules('js'), 'handsontable');

  const [problem, ...rest] = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') }).problems;

  assert.deepEqual(rest, []);
  assert.equal(problem.remedy,
    `Recreate the workspace links, then install and link the demo: pnpm install && ${INSTALL_JS}`);
  assert.equal(problem.detail.at(-1), 'The linker copies its links from examples/node_modules/handsontable, which '
    + 'does not resolve to the local build either.');
});

test('a dangling link on the demo\'s path is refused, since a copy by path finds nothing through it', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);
  const moved = join(root, 'elsewhere/examples/node_modules/handsontable');

  // The linker's absolute link after the checkout moved: it points into the old path.
  rmSync(join(frameworkModules('js'), 'handsontable'));
  link(moved, join(frameworkModules('js'), 'handsontable'));

  assert.deepEqual(danglingLinks(demo('js'), join(root, 'examples'), 'handsontable'),
    [join(frameworkModules('js'), 'handsontable')]);

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.deepEqual(problems, [{
    summary: 'handsontable: a link on the demo\'s path points at nothing, not at the local build handsontable/tmp.',
    detail: [
      `examples/next/visual-tests/js/node_modules/handsontable links to ${moved}, which does not exist.`,
      'The linker replaces these with links to the local build when examples:install runs it.',
    ],
    remedy: `Install and link the demo: ${INSTALL_JS}`,
  }]);
});

test('a demo with no copy of the package anywhere in its tree is refused as not installed', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  rmSync(frameworkModules('js'), { recursive: true });
  rmSync(join(root, 'examples/node_modules'), { recursive: true });

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary, 'handsontable: not installed for this demo.');
  assert.equal(problems[0].remedy,
    `Recreate the workspace links, then install and link the demo: pnpm install && ${INSTALL_JS}`);
});

test('a Handsontable package that is no workspace package is refused, not left unchecked', (t) => {
  const { root, demo } = makeRepo(t);

  write(join(demo('js'), 'package.json'),
    { dependencies: { handsontable: 'latest', '@handsontable/pikaday': 'latest' } });

  const { problems, checked } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.deepEqual(problems.map(({ summary }) => summary),
    ['@handsontable/pikaday: no workspace package has this name.']);
  assert.deepEqual(checked.map(({ name }) => name), ['handsontable']);

  // The same gap from the other side: a root manifest whose workspaces lost the core.
  write(join(root, 'package.json'), { workspaces: ['wrappers/*'] });
  write(join(demo('js'), 'package.json'), { dependencies: { handsontable: 'latest' } });

  assert.deepEqual(checkLinkedPackages({ repoRoot: root, demoDir: demo('js') }).problems.map(({ summary }) => summary),
    ['handsontable: no workspace package has this name.']);
});

test('a versioned copy of the examples is skipped, since the linker links next/ only', (t) => {
  const { root } = makeRepo(t);
  const versioned = join(root, 'examples/18.1.0/visual-tests/js/demo');

  write(join(versioned, 'package.json'), { dependencies: { handsontable: '18.1.0' } });
  installRegistryCopy(join(root, 'examples/18.1.0/visual-tests/js/node_modules'), 'handsontable');

  const result = checkLinkedPackages({ repoRoot: root, demoDir: versioned });

  assert.deepEqual(result.problems, []);
  assert.match(result.skipped, /examples\/18\.1\.0\/visual-tests\/js\/demo is not under examples\/next\//);
});

test('the checks read real paths, so a symlinked checkout passes like a real one', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);
  const alias = `${root}-alias`;

  symlinkSync(root, alias, 'junction');
  t.after(() => rmSync(alias, { force: true }));

  const throughAlias = join(alias, 'examples/next/visual-tests/js/demo');
  const mixed = checkLinkedPackages({ repoRoot: root, demoDir: throughAlias });

  assert.equal(mixed.skipped, null, 'a demo reached through the alias still sits under examples/next/');
  assert.equal(mixed.demo, 'examples/next/visual-tests/js/demo');
  assert.deepEqual(mixed.problems, []);
  assert.deepEqual(checkLinkedPackages({ repoRoot: alias, demoDir: demo('js') }).problems, []);

  installRegistryCopy(frameworkModules('js'), 'handsontable');

  assert.equal(checkLinkedPackages({ repoRoot: alias, demoDir: throughAlias }).problems.length, 1,
    'through the alias a registry copy is still refused');
  assert.deepEqual(findBuildProblems({ repoRoot: alias }), []);
});

test('packageCopies skips a dangling link the way the resolver does, and stops at the given directory', (t) => {
  const { root, demo } = makeRepo(t);

  rmSync(join(root, 'handsontable/tmp'), { recursive: true });
  // A copy above the examples workspace is never read by the check.
  write(join(root, 'node_modules/handsontable/package.json'), { name: 'handsontable', version: '1.0.0' });

  assert.deepEqual(packageCopies(demo('js'), join(root, 'examples'), 'handsontable'), [],
    'both links dangle once handsontable/tmp is gone, and the root copy is past the stop');
});

test('the preflight passes a built, linked, current core and refuses a missing one with the build command', (t) => {
  const { root } = makeRepo(t);

  assert.deepEqual(findBuildProblems({ repoRoot: root }), []);

  rmSync(join(root, 'handsontable/tmp'), { recursive: true });

  const problems = findBuildProblems({ repoRoot: root });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary, 'The core is not built: handsontable/tmp/package.json is missing.');
  assert.equal(problems[0].remedy, 'Build the core first: npm --prefix handsontable run build');
});

test('the preflight names the entry a partial core build lacks', (t) => {
  const { root } = makeRepo(t);

  rmSync(join(root, 'handsontable/tmp/index.mjs'));

  const [problem] = findBuildProblems({ repoRoot: root });

  assert.equal(problem.summary, 'The core is not built: handsontable/tmp/index.mjs is missing.');
  assert.deepEqual(problem.detail,
    ['The linker links the package anyway, and the demo build fails on the missing file.']);
});

test('the preflight refuses before any install when the linker would have nothing to link from', (t) => {
  const { root } = makeRepo(t);

  rmSync(join(root, 'examples/node_modules'), { recursive: true });

  assert.deepEqual(findBuildProblems({ repoRoot: root, wrappers: ['react-wrapper'] }).map(({ summary }) => summary), [
    'examples/node_modules/handsontable does not link to the local build handsontable/tmp.',
    'examples/node_modules/@handsontable/react-wrapper does not link to the local build wrappers/react-wrapper.',
  ]);
  assert.deepEqual([...new Set(findBuildProblems({ repoRoot: root }).map(({ remedy }) => remedy))],
    ['Recreate the workspace links: pnpm install']);
});

test('the preflight refuses a core build older than its sources, unless the age check is off', (t) => {
  const { root } = makeRepo(t);

  setTime(join(root, 'handsontable/src/core.ts'), '2026-03-01T00:00:00Z');

  const [problem, ...rest] = findBuildProblems({ repoRoot: root });

  assert.deepEqual(rest, []);
  assert.equal(problem.summary,
    'The core build is older than its sources: handsontable/tmp predates handsontable/src/core.ts.');
  assert.deepEqual(problem.detail, [
    'Newest source: handsontable/src/core.ts (2026-03-01T00:00:00.000Z)',
    'Build composed: handsontable/tmp/package.json (2026-02-01T00:00:00.000Z)',
    'A source changed after the build, so the demos may render the previous one.',
  ]);
  assert.equal(problem.remedy, 'Build the core first: npm --prefix handsontable run build');
  assert.deepEqual(findBuildProblems({ repoRoot: root, checkAge: false }), []);
});

test('a rebuild that skipped postbuild still counts as stale, since only the full build composes the package', (t) => {
  const { root } = makeRepo(t);

  // `build:es` alone rewrote the entry after the source edit, but the manifest is from the build before it.
  setTime(join(root, 'handsontable/tmp/index.mjs'), '2026-04-01T00:00:00Z');
  setTime(join(root, 'handsontable/src/core.ts'), '2026-03-01T00:00:00Z');

  const [problem] = findBuildProblems({ repoRoot: root });

  assert.ok(problem, 'a current index.mjs must not hide a package.json older than the sources');
  assert.match(problem.summary, /^The core build is older than its sources/);
});

test('in a checkout, git decides the sources: generated files never count, and new untracked ones do', (t) => {
  const { root } = makeRepo(t);

  gitInit(root);
  writeGeneratedSources(root);
  write(join(root, 'handsontable/src/plugins/filters/__tests__/filters.unit.js'), '');
  write(join(root, 'handsontable/src/plugins/filters/AGENTS.md'), '');
  write(join(root, 'handsontable/src/.DS_Store'), '');
  ['plugins/filters/__tests__/filters.unit.js', 'plugins/filters/AGENTS.md', '.DS_Store'].forEach((file) => {
    setTime(join(root, 'handsontable/src', file), '2026-03-01T00:00:00Z');
  });

  // Any ignore rule counts, not only the names the fallback knows: a developer's scratch file, excluded locally.
  write(join(root, '.git/info/exclude'), '*.local.ts\n');
  write(join(root, 'handsontable/src/scratch.local.ts'), '');
  setTime(join(root, 'handsontable/src/scratch.local.ts'), '2026-03-01T00:00:00Z');

  assert.deepEqual(sourceFiles(root, join(root, 'handsontable/src')), [join(root, 'handsontable/src/core.ts')]);
  assert.deepEqual(findBuildProblems({ repoRoot: root }), [],
    'the files build:styles and build:walkontable write, and tests, Markdown, and dotfiles, do not make it stale');

  // A new source file, not yet added to git, is a source.
  write(join(root, 'handsontable/src/plugins/filters/condition.ts'), 'export {};');
  setTime(join(root, 'handsontable/src/plugins/filters/condition.ts'), '2026-03-01T00:00:00Z');

  assert.match(findBuildProblems({ repoRoot: root })[0].summary,
    /predates handsontable\/src\/plugins\/filters\/condition\.ts\.$/);
});

test('without git, the walk skips the generated files, the tests, the Markdown, and dotfiles by name', (t) => {
  const { root } = makeRepo(t);

  writeGeneratedSources(root);
  ['plugins/filters/__tests__/filters.unit.js', '3rdparty/walkontable/test/spec/table.spec.js',
    '3rdparty/walkontable/css/walkontable.test.css', 'plugins/filters/AGENTS.md', '.DS_Store'].forEach((file) => {
    write(join(root, 'handsontable/src', file), '');
    setTime(join(root, 'handsontable/src', file), '2026-03-01T00:00:00Z');
  });

  assert.deepEqual(sourceFiles(root, join(root, 'handsontable/src')), [join(root, 'handsontable/src/core.ts')]);
  assert.deepEqual(findBuildProblems({ repoRoot: root }), []);
  assert.equal(isCompiledSource('styles/handsontableStyles.ts'), true, 'git would have left it out, so it counts');
  assert.equal(isCompiledSource('styles/handsontableStyles.ts', { skipGenerated: true }), false);
  assert.equal(newestFile([join(root, 'handsontable/src/core.ts'), join(root, 'missing.ts')]).path,
    join(root, 'handsontable/src/core.ts'), 'a listed file that is gone is skipped');
});

test('the preflight checks the wrapper builds the tier renders, and only those', (t) => {
  const { root } = makeRepo(t);

  rmSync(join(root, 'wrappers/react-wrapper/es'), { recursive: true });
  rmSync(join(root, 'wrappers/angular-wrapper/dist'), { recursive: true });

  assert.deepEqual(findBuildProblems({ repoRoot: root, wrappers: [] }), [], 'a js-only tier needs no wrapper build');

  const problems = findBuildProblems({ repoRoot: root, wrappers: ['react-wrapper', 'angular-wrapper', 'vue'] });

  assert.deepEqual(problems.map(({ summary }) => summary), [
    'The react-wrapper build is missing: wrappers/react-wrapper/es/react-handsontable.mjs does not exist.',
    'The angular-wrapper build is missing: wrappers/angular-wrapper/dist/hot-table/package.json does not exist.',
    'The vue build is missing: wrappers/vue/package.json does not exist.',
  ]);
  assert.deepEqual(problems.map(({ remedy }) => remedy), [
    'Build it first: npm --prefix wrappers/react-wrapper run build',
    'Build it first: npm --prefix wrappers/angular-wrapper run build',
    'Build it first: npm --prefix wrappers/vue run build',
  ]);
  assert.match(problems[1].detail.join(' '), /The linker skips a package whose local build is missing/,
    'no dist/hot-table means a dangling pnpm link, so the linker leaves the registry copy');
});

test('the preflight refuses a root manifest that lost the core from its workspaces', (t) => {
  const { root } = makeRepo(t);

  write(join(root, 'package.json'), { workspaces: ['wrappers/*'] });

  assert.deepEqual(findBuildProblems({ repoRoot: root }).map(({ summary }) => summary),
    ['The root package.json lists no workspace package named "handsontable".']);
});

test('preflightOptions turns the age check off on CI only, and passes the tier\'s wrappers', () => {
  const frameworks = ['js', 'angular-wrapper', 'react-wrapper', 'vue3'];

  assert.deepEqual(preflightOptions({ env: { CI: 'true' }, frameworks, referenceFramework: 'js' }),
    { wrappers: ['angular-wrapper', 'react-wrapper', 'vue3'], checkAge: false });
  assert.equal(preflightOptions({ env: {}, frameworks, referenceFramework: 'js' }).checkAge, true);
  assert.equal(preflightOptions({ env: { CI: 'false' }, frameworks, referenceFramework: 'js' }).checkAge, true);
  assert.deepEqual(preflightOptions({ env: {}, frameworks: ['js'], referenceFramework: 'js' }).wrappers, []);
});

/**
 * Runs the real guard from a demo directory of a throwaway repository. The script finds the repository from
 * its own location, so it and the module it imports are copied into the repository first.
 *
 * @param {string} root The throwaway repository.
 * @param {string} demoDir The demo to run it from.
 * @returns {{status: number, stdout: string, stderr: string}} What it did.
 */
function runGuard(root, demoDir) {
  mkdirSync(join(root, 'visual-tests/scripts'), { recursive: true });
  mkdirSync(join(root, 'visual-tests/lib'), { recursive: true });
  cpSync(join(PACKAGE_ROOT, 'scripts/check-linked-packages.mjs'),
    join(root, 'visual-tests/scripts/check-linked-packages.mjs'));
  cpSync(join(PACKAGE_ROOT, 'lib/local-builds.mjs'), join(root, 'visual-tests/lib/local-builds.mjs'));

  const result = spawnSync(process.execPath, ['../../../../../visual-tests/scripts/check-linked-packages.mjs'], {
    cwd: demoDir,
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('the guard script exits 0 on a linked demo and 1 with the remedy on an unlinked one', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);
  const linked = runGuard(root, demo('js'));

  assert.equal(linked.status, 0, linked.stderr);
  assert.equal(linked.stdout, 'handsontable resolves to the local build handsontable/tmp.\n');

  installRegistryCopy(frameworkModules('js'), 'handsontable');

  const refused = runGuard(root, demo('js'));

  assert.equal(refused.status, 1);
  assert.equal(refused.stdout, '');
  assert.match(refused.stderr, /^Refusing to build examples\/next\/visual-tests\/js\/demo: /);
  assert.ok(refused.stderr.includes(`  Install and link the demo: ${INSTALL_JS}\n`), refused.stderr);
  assert.match(refused.stderr, /See visual-tests\/AGENTS\.md \(Local builds\)\.\n$/);
});

test('the guard script exits 0 on a versioned copy, which `examples:build <version>` builds', (t) => {
  const { root } = makeRepo(t);
  const versioned = join(root, 'examples/18.1.0/visual-tests/js/demo');

  write(join(versioned, 'package.json'), { dependencies: { handsontable: '18.1.0' } });

  const skipped = runGuard(root, versioned);

  assert.equal(skipped.status, 0, skipped.stderr);
  assert.equal(skipped.stderr, '');
  assert.match(skipped.stdout, /^Linked-package check skipped: examples\/18\.1\.0\/visual-tests\/js\/demo /);
});

/**
 * The four visual-test demos and their manifests.
 *
 * @returns {Array<{demoDir: string, manifest: object}>} One entry per demo.
 */
function realDemos() {
  const frameworksDir = join(REPO_ROOT, 'examples/next/visual-tests');

  return readdirSync(frameworksDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(frameworksDir, entry.name, 'demo/package.json')))
    .map(entry => join(frameworksDir, entry.name, 'demo'))
    .map(demoDir => ({ demoDir, manifest: JSON.parse(readFileSync(join(demoDir, 'package.json'), 'utf8')) }));
}

test('every visual-test demo runs the guard first in its build script, and no other script builds it', () => {
  const demos = realDemos();
  const buildTool = /\b(vite build|ng build|react-app-rewired build)\b/;

  // The four frameworks the suite renders. Fewer means the directory moved and this test checks nothing.
  assert.equal(demos.length, 4, `found ${demos.length} demos`);

  demos.forEach(({ demoDir, manifest: { scripts } }) => {
    const rest = scripts.build.slice(`${GUARD} && `.length);

    assert.ok(scripts.build.startsWith(`${GUARD} && `), `${demoDir}: the build script must start with the guard, `
      + `found "${scripts.build}"`);
    assert.equal(resolve(demoDir, GUARD.split(' ')[1]), join(PACKAGE_ROOT, 'scripts/check-linked-packages.mjs'),
      `${demoDir}: the guard path does not resolve to the guard`);
    assert.match(rest, buildTool, `${demoDir}: the build itself must follow the guard`);
    assert.doesNotMatch(scripts.build, /\|\||;/,
      `${demoDir}: an \`||\` or \`;\` would let the build run after a refusal`);

    Object.entries(scripts).filter(([name]) => name !== 'build').forEach(([name, command]) => {
      assert.doesNotMatch(command, buildTool, `${demoDir}: script "${name}" builds the demo without the guard`);
    });
  });
});

test('build.mjs refuses before its first install, and builds each demo through its build script', () => {
  const build = readFileSync(join(PACKAGE_ROOT, 'scripts/build.mjs'), 'utf8');
  const functionAt = build.indexOf('async function installAndBuild() {');
  const preflightAt = build.indexOf('const problems = findBuildProblems({ repoRoot: REPO_ROOT, ...options });');
  const refusalAt = build.indexOf('process.exitCode = 1;');
  const elseAt = build.indexOf('} else {', refusalAt);
  const callAt = build.indexOf('await installAndBuild();');
  const installs = [...build.matchAll(/execa\.command\(/g)].map(({ index }) => index);

  assert.ok(functionAt !== -1 && preflightAt !== -1 && refusalAt !== -1 && callAt !== -1,
    'build.mjs lost its installAndBuild function, its preflight, its refusal, or its call');
  assert.ok(installs.length > 0 && installs.every(index => index > functionAt && index < preflightAt),
    'every install and build must sit inside installAndBuild(), which is defined before the preflight');
  assert.equal(build.split('await installAndBuild();').length, 2, 'installAndBuild() must be called exactly once');
  assert.ok(preflightAt < refusalAt && refusalAt < elseAt && elseAt < callAt,
    'installAndBuild() must be called in the else branch of the refusal, or the installs run after it');
  assert.match(build, /preflightOptions\(\{\n\s+env: process\.env,\n\s+frameworks: frameworksToTest,/,
    'the options, the age check among them, must come from preflightOptions(), which the tests pin');
  assert.match(build, /await execa\.command\('npm run build', \{/,
    'a demo builds through its own build script, which runs the guard');
});

test('no workflow or action builds a visual-test demo around its guard', () => {
  const workflowsDir = join(REPO_ROOT, '.github/workflows');
  const actionsDir = join(REPO_ROOT, '.github/actions');
  const files = [
    ...readdirSync(workflowsDir).filter(file => /\.ya?ml$/.test(file)).map(file => join(workflowsDir, file)),
    ...readdirSync(actionsDir, { withFileTypes: true }).filter(entry => entry.isDirectory())
      .map(entry => join(actionsDir, entry.name, 'action.yml')).filter(file => existsSync(file)),
  ];
  const lines = files.flatMap(file => readFileSync(file, 'utf8').split('\n')
    .map((line, index) => ({ file, line: index + 1, text: line.trim() }))
    .filter(({ text }) => !text.startsWith('#')));
  // A demo's build tool called directly skips the guard, and so does any demo script other than `build`.
  const toolCalls = lines.filter(({ text }) => /\b(vite build|ng build|react-app-rewired build)\b/.test(text));
  const otherScripts = lines.filter(({ text }) => /examples\/next\/visual-tests\/[\w-]+\/demo run (?!build\b)/
    .test(text) || /examples\/next\/visual-tests\/[\w-]+\/demo run build\S/.test(text));
  const demoBuilds = lines.filter(({ text }) => /examples\/next\/visual-tests\/[\w-]+\/demo run build$/.test(text));

  assert.ok(files.length > 10, `only ${files.length} workflow and action files found — did .github move?`);
  assert.deepEqual(toolCalls, [], 'build a demo through `npm --prefix <demo> run build` so its guard runs');
  assert.deepEqual(otherScripts, [], 'a workflow runs a demo script other than `build`, which skips the guard');
  // The two direct builds today: the cross-browser leg of visual.yml and the stability matrix.
  assert.deepEqual([...new Set(demoBuilds.map(({ file }) => file.split('/').pop()))].sort(),
    ['visual-stability.yml', 'visual.yml']);
});
