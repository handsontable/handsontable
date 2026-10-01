import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  ageCheckEnabled, checkLinkedPackages, confirmationLines, danglingLinks, findBuildProblems, formatProblems,
  generatedSourcePatterns, isCompiledSource, newestFile, packageCopies, preflightOptions, readConfirmations,
  sourceFiles, workspacePackages,
} from '../local-builds.mjs';

// The two checks that keep the visual-test examples off the registry's builds (DEV-16): the guard each example's
// `build` script runs first, and the preflight `scripts/build.mjs` runs before it installs anything. Each case
// builds a throwaway repository in the shape the checks read (root `workspaces`, pnpm's links in
// `examples/node_modules`, the linker's links under each framework directory) and puts it in one of the states
// that used to pass silently. The last tests pin the wiring: every example's `build` runs the guard,
// `build.mjs` refuses before its first install, and nothing builds an example any other way.

const PACKAGE_ROOT = join(import.meta.dirname, '..', '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..');
const INSTALL_JS = 'npm run examples:install next/visual-tests/js';
const GUARD = 'node ../../../../../visual-tests/scripts/check-linked-packages.mjs';
const BUILD_TOOL = /\b(vite build|ng build|react-app-rewired build)\b/;
// The core's own ignore rules for what its build writes under `src/`, as `handsontable/.gitignore` has them, plus
// `languages/` and `dev*.ts` without the leading slash they carry there now: git applies an unanchored rule under
// `src/` too, and the age check must still count the sources it matches.
const CORE_GITIGNORE = 'src/3rdparty/walkontable/test/dist/\nsrc/3rdparty/walkontable/dist/\ndev*.ts\nlanguages/\n'
  + 'src/styles/handsontableStyles.js\nsrc/styles/handsontableStyles.ts\n';

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
 * @param {object} [options] Options.
 * @param {string} [options.parent] The directory to create the repository in, `os.tmpdir()` by default.
 * @returns {{root: string, demo: (framework: string) => string, frameworkModules: (framework: string) =>
 *   string}} The root and two path helpers.
 */
function makeRepo(t, { parent = tmpdir() } = {}) {
  const root = mkdtempSync(join(parent, 'visual-local-builds-'));
  const examples = join(root, 'examples');

  t.after(() => rmSync(root, { recursive: true, force: true }));

  write(join(root, 'package.json'), { workspaces: ['handsontable', 'wrappers/*', 'examples'] });

  write(join(root, 'handsontable/package.json'),
    { name: 'handsontable', version: '18.1.1', publishConfig: { directory: 'tmp', linkDirectory: true } });
  write(join(root, 'handsontable/.gitignore'), CORE_GITIGNORE);
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
  // The framework directory's own manifest, the npm workspace root the demo sits in.
  write(join(frameworkDir('js'), 'package.json'), { name: 'examples-js', workspaces: ['@(!(node_modules))/'] });

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

test('an example the linker linked passes, and only its monorepo packages are checked', (t) => {
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
    remedy: `Install and link the example: ${INSTALL_JS}`,
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
    `Build it, then relink the example: npm --prefix handsontable run build && ${INSTALL_JS}`);
});

test('an unbuilt React wrapper is refused before the bundler fails on the missing entry', (t) => {
  const { root, demo } = makeRepo(t);

  rmSync(join(root, 'wrappers/react-wrapper/es'), { recursive: true });

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary,
    '@handsontable/react-wrapper: the local build is missing (wrappers/react-wrapper/es/react-handsontable.mjs).');
  assert.deepEqual(problems[0].detail,
    ['The linker links the package anyway, and the build fails on the missing file.'],
    'the manifest is there, so the link is made; saying the linker skipped it would send the reader the wrong way');
  assert.equal(problems[0].remedy, 'Build it, then relink the example: npm --prefix wrappers/react-wrapper run build '
    + '&& npm run examples:install next/visual-tests/react-wrapper');
});

test('a registry copy of a wrapper is refused like one of the core', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  installRegistryCopy(frameworkModules('react-wrapper'), '@handsontable/react-wrapper');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') });

  assert.equal(problems.length, 1);
  assert.match(problems[0].summary, /^@handsontable\/react-wrapper: resolves to a copy/);
});

test('the Angular demo is checked at both levels the linker writes, and the relink replaces its nested copy', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  // The linker links the framework level, but a nested copy under the demo shadows it for the bundler and for
  // the stylesheet paths in angular.json. For Angular the linker replaces that level too.
  installRegistryCopy(join(demo('angular-wrapper'), 'node_modules'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('angular-wrapper') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].detail[0],
    'examples/next/visual-tests/angular-wrapper/demo/node_modules/handsontable is a plain copy of version 18.1.0, '
    + 'not a link.');
  assert.equal(problems[0].remedy, 'Install and link the example: npm run examples:install next/visual-tests/'
    + 'angular-wrapper');
  assert.deepEqual(packageCopies(demo('angular-wrapper'), join(root, 'examples'), 'handsontable'), [
    join(demo('angular-wrapper'), 'node_modules/handsontable'),
    join(frameworkModules('angular-wrapper'), 'handsontable'),
    join(root, 'examples/node_modules/handsontable'),
  ]);
});

test('a copy nested under a non-Angular example is to be deleted, since the linker never replaces it', (t) => {
  const { root, demo } = makeRepo(t);
  const nested = 'examples/next/visual-tests/js/demo/node_modules/handsontable';

  // The shape the Angular lockfile records today; for js the linker links the framework level only.
  installRegistryCopy(join(demo('js'), 'node_modules'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.deepEqual(problems, [{
    summary: 'handsontable: resolves to a copy that is not the local build handsontable/tmp.',
    detail: [
      `${nested} is a plain copy of version 18.1.0, not a link.`,
      'The linker replaces a copy nested under an example for Angular only, so it never replaces this one. If it '
        + 'comes back after the relink, the framework\'s lockfile records it there.',
    ],
    remedy: `Delete ${nested}, then relink the example: ${INSTALL_JS}`,
  }]);
});

test('a registry copy where the linker reads from needs the root install, not a reinstall of the example', (t) => {
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
    remedy: `Recreate the workspace links, then install and link the example: pnpm install && ${INSTALL_JS}`,
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
    `Recreate the workspace links, then install and link the example: pnpm install && ${INSTALL_JS}`);
  assert.equal(problem.detail.at(-1), 'The linker copies its links from examples/node_modules/handsontable, which '
    + 'does not resolve to the local build either.');
});

test('a dangling link on the example\'s path is refused, since a copy by path finds nothing through it', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);
  const moved = join(root, 'elsewhere/examples/node_modules/handsontable');

  // The linker's absolute link after the checkout moved: it points into the old path.
  rmSync(join(frameworkModules('js'), 'handsontable'));
  link(moved, join(frameworkModules('js'), 'handsontable'));

  assert.deepEqual(danglingLinks(demo('js'), join(root, 'examples'), 'handsontable'),
    [join(frameworkModules('js'), 'handsontable')]);

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.deepEqual(problems, [{
    summary: 'handsontable: a link on the example\'s path points at nothing, not at the local build handsontable/tmp.',
    detail: [
      `examples/next/visual-tests/js/node_modules/handsontable links to ${moved}, which does not exist.`,
      'The linker replaces these with links to the local build when examples:install runs it.',
    ],
    remedy: `Install and link the example: ${INSTALL_JS}`,
  }]);
});

test('an example with no copy of the package anywhere in its tree is refused as not installed', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);

  rmSync(frameworkModules('js'), { recursive: true });
  rmSync(join(root, 'examples/node_modules'), { recursive: true });

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary, 'handsontable: not installed for this example.');
  assert.equal(problems[0].remedy,
    `Recreate the workspace links, then install and link the example: pnpm install && ${INSTALL_JS}`);
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
  assert.equal(result.skipped, 'examples/18.1.0/visual-tests/js/demo is a versioned copy of the examples, which '
    + 'pins a published release; the linker links next/ only.');
});

test('a guard run from anywhere but an example is refused, so it cannot pass by checking nothing', (t) => {
  const { root, demo } = makeRepo(t);
  const remedy = 'Build the example through its own script: npm --prefix examples/next/visual-tests/<framework>/demo '
    + 'run build';
  const summaries = [
    root,
    join(root, 'examples'),
    join(root, 'visual-tests'),
    dirname(demo('js')),
    join(root, 'examples/next/visual-tests/js/demo/src'),
  ].map((dir) => {
    mkdirSync(dir, { recursive: true });

    const { skipped, problems } = checkLinkedPackages({ repoRoot: root, demoDir: dir });

    assert.equal(skipped, null, dir);
    assert.equal(problems.length, 1, dir);
    assert.equal(problems[0].remedy, remedy, dir);

    return problems[0].summary;
  });

  assert.deepEqual(summaries, [
    'the repository root is not an example under examples/next/, so there is nothing to check.',
    'examples is not an example under examples/next/, so there is nothing to check.',
    'visual-tests is not an example under examples/next/, so there is nothing to check.',
    'examples/next/visual-tests/js declares no handsontable or @handsontable/* package, so there is nothing to check.',
    'examples/next/visual-tests/js/demo/src has no package.json, so it is not an example.',
  ]);
});

test('the checks read real paths, so a symlinked checkout passes like a real one', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);
  const alias = `${root}-alias`;

  symlinkSync(root, alias, 'junction');
  t.after(() => rmSync(alias, { force: true }));

  const throughAlias = join(alias, 'examples/next/visual-tests/js/demo');
  const mixed = checkLinkedPackages({ repoRoot: root, demoDir: throughAlias });

  assert.equal(mixed.skipped, null, 'an example reached through the alias still sits under examples/next/');
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

test('the guard refuses an example whose core build is older than its sources, unless the age check is off', (t) => {
  const { root, demo } = makeRepo(t);

  setTime(join(root, 'handsontable/src/core.ts'), '2026-03-01T00:00:00Z');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') });

  assert.deepEqual(problems.map(({ summary }) => summary),
    ['The core build is older than its sources: handsontable/tmp predates handsontable/src/core.ts.'],
    'checked once, for the core, however many packages the example declares');
  assert.equal(problems[0].remedy, 'Build the core first: npm --prefix handsontable run build');
  assert.deepEqual(checkLinkedPackages({ repoRoot: root, demoDir: demo('js'), checkAge: false }).problems, []);
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
  assert.deepEqual(problem.detail, ['The linker links the package anyway, and the build fails on the missing file.']);
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
    'A source changed after the build, so the examples may render the previous one.',
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

test('the age check skips what the build writes under src, and the tests, Markdown, and dotfiles', (t) => {
  const { root } = makeRepo(t);

  writeGeneratedSources(root);
  ['plugins/filters/__tests__/filters.unit.js', '3rdparty/walkontable/test/spec/table.spec.js',
    '3rdparty/walkontable/css/walkontable.test.css', 'plugins/filters/AGENTS.md', '.DS_Store'].forEach((file) => {
    write(join(root, 'handsontable/src', file), '');
    setTime(join(root, 'handsontable/src', file), '2026-03-01T00:00:00Z');
  });

  assert.deepEqual(sourceFiles(join(root, 'handsontable')), [join(root, 'handsontable/src/core.ts')]);
  assert.deepEqual(findBuildProblems({ repoRoot: root }), [],
    'the files build:styles and build:walkontable write do not make a current build stale');
  assert.equal(newestFile([join(root, 'handsontable/src/core.ts'), join(root, 'gone.ts')]).path,
    join(root, 'handsontable/src/core.ts'), 'a file removed between the listing and the read is skipped');
});

test('a new source that an unanchored ignore rule matches still counts, since git is not asked', (t) => {
  const { root } = makeRepo(t);

  // `languages/` and `dev*.ts` target the package root's build output and dev pages. Unanchored, as the fixture
  // keeps them, git applies both under src/ too: `git check-ignore` reported these two paths ignored in the real
  // checkout until the rules gained a leading slash.
  ['i18n/languages/xx-XX.ts', 'plugins/dev-panel.ts'].forEach((file) => {
    write(join(root, 'handsontable/src', file), 'export {};');
    setTime(join(root, 'handsontable/src', file), '2026-03-01T00:00:00Z');

    const [problem] = findBuildProblems({ repoRoot: root });

    assert.equal(problem?.summary,
      `The core build is older than its sources: handsontable/tmp predates handsontable/src/${file}.`);
    rmSync(join(root, 'handsontable/src', file));
  });
});

test('a checkout inside another repository that ignores everything still has its sources read', (t) => {
  const outer = mkdtempSync(join(tmpdir(), 'visual-local-builds-outer-'));

  t.after(() => rmSync(outer, { recursive: true, force: true }));
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: outer }).status, 0, 'git init failed');
  write(join(outer, '.gitignore'), '*\n');

  // An extracted source archive with no .git of its own, under a home directory kept in git.
  const { root } = makeRepo(t, { parent: outer });

  assert.deepEqual(sourceFiles(join(root, 'handsontable')), [join(root, 'handsontable/src/core.ts')]);

  setTime(join(root, 'handsontable/src/core.ts'), '2026-03-01T00:00:00Z');

  assert.match(findBuildProblems({ repoRoot: root })[0]?.summary ?? '', /^The core build is older than its sources/);
});

test('the real core .gitignore marks the generated files under src, and no real source', () => {
  const generated = generatedSourcePatterns(join(REPO_ROOT, 'handsontable'));

  ['styles/handsontableStyles.js', 'styles/handsontableStyles.ts', '3rdparty/walkontable/dist/walkontable.js']
    .forEach(path => assert.equal(isCompiledSource(path, generated), false, `${path} is a build output`));
  ['core.ts', 'i18n/languages/de-DE.ts', 'i18n/languages/xx-XX.ts', 'plugins/dev-panel.ts', 'styles/main.scss']
    .forEach(path => assert.equal(isCompiledSource(path, generated), true, `${path} is a source`));
});

test('generatedSourcePatterns reads directory, file, and glob entries, and nothing without the src/ prefix', (t) => {
  const { root } = makeRepo(t);

  write(join(root, 'handsontable/.gitignore'),
    '# generated\n/src/gen/\nsrc/**/*.gen.ts\nsrc/x?.ts\nsrc/one.ts\ntmp/\n!src/keep.ts\n');

  const generated = generatedSourcePatterns(join(root, 'handsontable'));
  const compiled = path => isCompiledSource(path, generated);

  assert.equal(generated.length, 4, 'the comment, the tmp/ entry, and the negation are no generated source');
  assert.deepEqual(['gen/a.ts', 'a/b/c.gen.ts', 'x1.ts', 'one.ts', 'one.ts/inner.ts'].map(compiled),
    [false, false, false, false, false]);
  // An entry with a slash in it is anchored to src/, the way git reads it, so the same name deeper down counts.
  assert.deepEqual(['gen.ts', 'a/c.gen.tsx', 'x/1.ts', 'x12.ts', 'one.tsx', 'keep.ts', 'deep/gen/a.ts', 'sub/one.ts']
    .map(compiled), [true, true, true, true, true, true, true, true]);
  assert.deepEqual(generatedSourcePatterns(join(root, 'wrappers/react-wrapper')), [], 'no .gitignore, no patterns');
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
  assert.deepEqual([{ CI: 'true' }, {}, { CI: '1' }].map(ageCheckEnabled), [false, true, true],
    'only the value GitHub Actions sets turns it off');
});

test('formatProblems lays out every problem the same way for both scripts', () => {
  const problems = [
    { summary: 'one', detail: ['a', 'b'], remedy: 'fix one' },
    { summary: 'two', detail: [], remedy: 'fix two' },
  ];

  assert.deepEqual(formatProblems(problems), [
    '', '- one', '  a', '  b', '  fix one',
    '', '- two', '  fix two',
    '', 'Run the commands from the repository root. See visual-tests/AGENTS.md (Local builds).',
  ]);
  assert.deepEqual(formatProblems(problems, { highlight: text => `<${text}>` }).filter(line => line.startsWith('<')),
    ['<- one>', '<- two>'], 'the highlight colors the summary lines and nothing else');
});

test('the guard\'s confirmations survive a build\'s other output', () => {
  const lines = confirmationLines([
    { name: 'handsontable', buildDir: 'handsontable/tmp' },
    { name: '@handsontable/vue3', buildDir: 'wrappers/vue3' },
  ]);
  const stdout = ['> vue3-ts-example@0.0.0 build', lines[0], 'vite v6.4.3 building for production...', lines[1],
    '✓ built in 2.05s'].join('\n');

  assert.deepEqual(lines, ['handsontable resolves to the local build handsontable/tmp.',
    '@handsontable/vue3 resolves to the local build wrappers/vue3.']);
  assert.deepEqual(readConfirmations(stdout), lines);
});

/**
 * Runs the real guard from a directory of a throwaway repository. The script finds the repository from its own
 * location, so it and the module it imports are copied into the repository first.
 *
 * @param {string} root The throwaway repository.
 * @param {string} cwd The directory to run it from.
 * @param {object} [env] More environment variables.
 * @returns {{status: number, stdout: string, stderr: string}} What it did.
 */
function runGuard(root, cwd, env = {}) {
  mkdirSync(join(root, 'visual-tests/scripts'), { recursive: true });
  mkdirSync(join(root, 'visual-tests/lib'), { recursive: true });
  cpSync(join(PACKAGE_ROOT, 'scripts/check-linked-packages.mjs'),
    join(root, 'visual-tests/scripts/check-linked-packages.mjs'));
  cpSync(join(PACKAGE_ROOT, 'lib/local-builds.mjs'), join(root, 'visual-tests/lib/local-builds.mjs'));

  const result = spawnSync(process.execPath, [join(root, 'visual-tests/scripts/check-linked-packages.mjs')], {
    cwd,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...env },
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('the guard script exits 0 on a linked example and 1 with the remedy on an unlinked one', (t) => {
  const { root, demo, frameworkModules } = makeRepo(t);
  const linked = runGuard(root, demo('js'));

  assert.equal(linked.status, 0, linked.stderr);
  assert.equal(linked.stdout, 'handsontable resolves to the local build handsontable/tmp.\n');

  installRegistryCopy(frameworkModules('js'), 'handsontable');

  const refused = runGuard(root, demo('js'));

  assert.equal(refused.status, 1);
  assert.equal(refused.stdout, '');
  assert.match(refused.stderr, /^Refusing to build examples\/next\/visual-tests\/js\/demo:\n\n- handsontable: /);
  assert.ok(refused.stderr.includes(`  Install and link the example: ${INSTALL_JS}\n`), refused.stderr);
  assert.match(refused.stderr, /See visual-tests\/AGENTS\.md \(Local builds\)\.\n$/);
});

test('the guard script checks the core\'s age off CI only', (t) => {
  const { root, demo } = makeRepo(t);

  setTime(join(root, 'handsontable/src/core.ts'), '2026-03-01T00:00:00Z');

  const local = runGuard(root, demo('js'));
  const onCi = runGuard(root, demo('js'), { CI: 'true' });

  assert.equal(local.status, 1);
  assert.match(local.stderr, /- The core build is older than its sources: /);
  assert.equal(onCi.status, 0, onCi.stderr);
});

test('the guard script exits 0 on a versioned copy and 1 outside any example', (t) => {
  const { root } = makeRepo(t);
  const versioned = join(root, 'examples/18.1.0/visual-tests/js/demo');

  write(join(versioned, 'package.json'), { dependencies: { handsontable: '18.1.0' } });

  const skipped = runGuard(root, versioned);
  const fromRoot = runGuard(root, root);

  assert.equal(skipped.status, 0, skipped.stderr);
  assert.equal(skipped.stderr, '');
  assert.match(skipped.stdout, /^Linked-package check skipped: examples\/18\.1\.0\/visual-tests\/js\/demo /);
  assert.equal(fromRoot.status, 1, 'a run from the wrong directory must not pass');
  assert.match(fromRoot.stderr, /^Refusing to build the repository root:\n/);
});

/**
 * Every example in the visual-tests tree and its manifest: each framework's `demo/` and `basic-example/`.
 *
 * @returns {Array<{exampleDir: string, manifest: object}>} One entry per example.
 */
function realExamples() {
  const frameworksDir = join(REPO_ROOT, 'examples/next/visual-tests');

  return readdirSync(frameworksDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => readdirSync(join(frameworksDir, entry.name), { withFileTypes: true })
      .filter(child => child.isDirectory() && child.name !== 'node_modules')
      .map(child => join(frameworksDir, entry.name, child.name)))
    .filter(exampleDir => existsSync(join(exampleDir, 'package.json')))
    .map(exampleDir => ({ exampleDir, manifest: JSON.parse(readFileSync(join(exampleDir, 'package.json'), 'utf8')) }));
}

test('every example in the visual-tests tree runs the guard first in its build, and no other script builds it', () => {
  const examples = realExamples();

  // Four frameworks, a demo and a basic example each. Fewer means the tree moved and this test checks nothing.
  assert.equal(examples.length, 8, `found ${examples.length} examples`);

  examples.forEach(({ exampleDir, manifest: { scripts } }) => {
    const rest = scripts.build.slice(`${GUARD} && `.length);

    assert.ok(scripts.build.startsWith(`${GUARD} && `), `${exampleDir}: the build script must start with the guard, `
      + `found "${scripts.build}"`);
    assert.equal(resolve(exampleDir, GUARD.split(' ')[1]), join(PACKAGE_ROOT, 'scripts/check-linked-packages.mjs'),
      `${exampleDir}: the guard path does not resolve to the guard`);
    assert.match(rest, BUILD_TOOL, `${exampleDir}: the build itself must follow the guard`);
    // Only `&&` joins the chain: `;` and a lone `&` run the build whatever the guard said, `|` takes the exit
    // code of the last command, and `||` runs the build only after a refusal.
    assert.doesNotMatch(scripts.build, /;|\||(?<!&)&(?!&)|\n/,
      `${exampleDir}: the build script must chain the guard with \`&&\` alone`);

    Object.entries(scripts).filter(([name]) => name !== 'build').forEach(([name, command]) => {
      assert.doesNotMatch(command, BUILD_TOOL, `${exampleDir}: script "${name}" builds the example without the guard`);
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
  assert.match(build, /preflightOptions\(\{\s*env: process\.env,\s*frameworks: frameworksToTest,/,
    'the options, the age check among them, must come from preflightOptions(), which the tests pin');
  assert.match(build, /formatProblems\(problems/, 'the refusal must print through the shared formatter');
  assert.match(build, /const \{ stdout \} = await execa\.command\('npm run build', \{\s*stdout: 'pipe',/,
    'a demo builds through its own build script, which runs the guard, and its output is read');
  assert.match(build, /readConfirmations\(stdout\)/, 'the guard\'s confirmations must reach the log');
  assert.match(build, /monorepoRoot: REPO_ROOT,\s*examples: join\(REPO_ROOT, 'examples', 'next', 'visual-tests'\),/,
    'the paths must derive from REPO_ROOT, or a run from another directory builds another tree');
});

test('the guard script prints through the shared formatter and checks the age off CI only', () => {
  const guard = readFileSync(join(PACKAGE_ROOT, 'scripts/check-linked-packages.mjs'), 'utf8');

  assert.match(guard, /checkAge: ageCheckEnabled\(process\.env\)/);
  assert.match(guard, /formatProblems\(problems\)/);
  assert.doesNotMatch(guard, /Run the commands from the repository root/,
    'the pointer line belongs to formatProblems(), so the two scripts cannot drift apart');
});

/**
 * Splits a workflow or action into its list items, which for steps is one step each: a line that opens a
 * sequence entry (`- name:`, `- run:`, `- uses:`) starts the next one.
 *
 * @param {string} text The YAML.
 * @returns {string[]} The items, comment lines dropped.
 */
function yamlItems(text) {
  return text.split('\n').filter(line => !line.trim().startsWith('#'))
    .reduce((items, line) => {
      if (/^\s*-\s+[\w-]+:/.test(line) || items.length === 0) {
        items.push(line);
      } else {
        items[items.length - 1] += `\n${line}`;
      }

      return items;
    }, []);
}

/**
 * Finds the steps and scripts that build a visual-test example without its guard: a demo's build tool called in
 * a step or script that works on the visual-tests tree, or a demo script other than `build`.
 *
 * @param {Array<{file: string, text: string}>} sources The workflow and action files, as YAML text.
 * @param {Array<{file: string, scripts: object}>} manifests The package manifests whose scripts to read.
 * @returns {string[]} One line per bypass, naming where it is.
 */
function bypasses(sources, manifests) {
  const touchesVisualTests = text => /visual-tests/.test(text);
  const otherDemoScript = /examples\/next\/visual-tests\/[\w-]+\/(demo|basic-example) run (?!build(\s|$))/;

  return [
    ...sources.flatMap(({ file, text }) => yamlItems(text)
      .filter(item => touchesVisualTests(item) && (BUILD_TOOL.test(item) || otherDemoScript.test(item)))
      .map(item => `${file}: ${item.trim().split('\n')[0]}`)),
    ...manifests.flatMap(({ file, scripts }) => Object.entries(scripts ?? {})
      .filter(([, command]) => touchesVisualTests(command) && BUILD_TOOL.test(command))
      .map(([name]) => `${file}: scripts.${name}`)),
  ];
}

test('the bypass scan flags a visual-tests step that builds around the guard, and nothing else', () => {
  const yaml = [
    '    steps:',
    '      - name: Build the docs',
    '        run: ng build',
    '        working-directory: docs/angular-type-check',
    '      - name: Build the js demo',
    '        run: |',
    '          cd examples/next/visual-tests/js/demo',
    '          vite build',
    '      - name: Build it right',
    '        run: npm --prefix examples/next/visual-tests/js/demo run build',
    '      - name: A second script',
    '        run: npm --prefix examples/next/visual-tests/js/demo run build:ci',
  ].join('\n');
  const scripts = {
    'serve-example': 'npm --prefix ../examples/next/visual-tests/js/demo run serve -- --port=8082',
    'build-demo': 'cd ../examples/next/visual-tests/js/demo && vite build',
    'docs:build': 'cd ../docs && ng build',
  };

  assert.deepEqual(bypasses([{ file: 'x.yml', text: yaml }], [{ file: 'package.json', scripts }]), [
    'x.yml: - name: Build the js demo',
    'x.yml: - name: A second script',
    'package.json: scripts.build-demo',
  ]);
});

test('no workflow, action, or package script builds a visual-test example around its guard', () => {
  const workflowsDir = join(REPO_ROOT, '.github/workflows');
  const actionsDir = join(REPO_ROOT, '.github/actions');
  const files = [
    ...readdirSync(workflowsDir).filter(file => /\.ya?ml$/.test(file)).map(file => join(workflowsDir, file)),
    ...readdirSync(actionsDir, { withFileTypes: true }).filter(entry => entry.isDirectory())
      .map(entry => join(actionsDir, entry.name, 'action.yml')).filter(file => existsSync(file)),
  ];
  const sources = files.map(file => ({ file: file.slice(REPO_ROOT.length + 1), text: readFileSync(file, 'utf8') }));
  const manifests = ['package.json', 'visual-tests/package.json', 'examples/package.json']
    .map(file => ({ file, scripts: JSON.parse(readFileSync(join(REPO_ROOT, file), 'utf8')).scripts }));
  const demoBuilds = sources.filter(({ text }) => /examples\/next\/visual-tests\/[\w-]+\/demo run build$/m.test(text));

  assert.ok(files.length > 10, `only ${files.length} workflow and action files found — did .github move?`);
  assert.deepEqual(bypasses(sources, manifests), [],
    'build an example through `npm --prefix <example> run build` so its guard runs');
  // The two direct builds today: the cross-browser leg of visual.yml and the stability matrix.
  assert.deepEqual(demoBuilds.map(({ file }) => file.split('/').pop()).sort(), ['visual-stability.yml', 'visual.yml']);
});
