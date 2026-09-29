import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  checkLinkedPackages, findBuildProblems, newestFile, packageCopies, workspacePackages,
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
 * Builds a repository in the layout the checks read, with the core and both kinds of wrapper built and every
 * demo linked the way `examples:install` leaves it. The cases then break one thing each.
 *
 * @returns {{root: string, demo: (framework: string) => string, frameworkModules: (framework: string) =>
 *   string}} The root and two path helpers.
 */
function makeRepo() {
  const root = mkdtempSync(join(tmpdir(), 'visual-local-builds-'));
  const examples = join(root, 'examples');

  write(join(root, 'package.json'), { workspaces: ['handsontable', 'wrappers/*', 'examples'] });

  write(join(root, 'handsontable/package.json'),
    { name: 'handsontable', version: '18.1.1', publishConfig: { directory: 'tmp', linkDirectory: true } });
  write(join(root, 'handsontable/src/core.ts'), 'export {};');
  write(join(root, 'handsontable/tmp/package.json'), { name: 'handsontable', version: '18.1.1', module: 'index.mjs' });
  write(join(root, 'handsontable/tmp/index.mjs'), 'export {};');

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
  // under the demo too.
  ['js', 'react-wrapper', 'angular-wrapper'].forEach((framework) => {
    link(join(examples, 'node_modules/handsontable'), join(frameworkModules(framework), 'handsontable'));
  });
  link(join(examples, 'node_modules/@handsontable/react-wrapper'),
    join(frameworkModules('react-wrapper'), '@handsontable/react-wrapper'));
  link(join(examples, 'node_modules/@handsontable/angular-wrapper'),
    join(frameworkModules('angular-wrapper'), '@handsontable/angular-wrapper'));
  link(join(frameworkModules('angular-wrapper'), 'handsontable'),
    join(demo('angular-wrapper'), 'node_modules/handsontable'));

  return { root, demo, frameworkModules };
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

test('workspacePackages maps every workspace package to the directory pnpm links it to', () => {
  const { root } = makeRepo();
  const packages = workspacePackages(root);

  assert.equal(packages.get('handsontable').buildDir, join(root, 'handsontable/tmp'),
    'publishConfig.directory with linkDirectory is the link target');
  assert.equal(packages.get('@handsontable/angular-wrapper').buildDir,
    join(root, 'wrappers/angular-wrapper/dist/hot-table'));
  assert.equal(packages.get('@handsontable/react-wrapper').buildDir, join(root, 'wrappers/react-wrapper'),
    'without publishConfig the package directory is the link target');
  assert.deepEqual([...packages.keys()].sort(),
    ['@handsontable/angular-wrapper', '@handsontable/react-wrapper', 'handsontable', 'handsontable-examples-internal'],
    'a wrappers/ directory without a manifest is no package');
});

test('a demo the linker linked passes, and only its monorepo packages are checked', () => {
  const { root, demo } = makeRepo();

  ['js', 'react-wrapper', 'angular-wrapper'].forEach((framework) => {
    const result = checkLinkedPackages({ repoRoot: root, demoDir: demo(framework) });

    assert.deepEqual(result.problems, [], `${framework}: ${JSON.stringify(result.problems)}`);
    assert.equal(result.skipped, null);
  });

  assert.deepEqual(checkLinkedPackages({ repoRoot: root, demoDir: demo('js') }).checked,
    [{ name: 'handsontable', buildDir: 'handsontable/tmp' }], 'vite is a dependency, not a monorepo package');
  assert.deepEqual(
    checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') }).checked.map(({ name }) => name),
    ['handsontable', '@handsontable/react-wrapper'],
  );
});

test('an install without the linker is refused, naming the copy and the command that links it', () => {
  const { root, demo, frameworkModules } = makeRepo();

  installRegistryCopy(frameworkModules('js'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary,
    'handsontable: resolves to a copy that is not the local build handsontable/tmp.');
  assert.ok(problems[0].detail.includes(
    'examples/next/visual-tests/js/node_modules/handsontable is a plain copy of version 18.1.0, not a link.'),
  problems[0].detail.join('\n'));
  assert.equal(problems[0].remedy, `Install and link the demo: ${INSTALL_JS}`);
});

test('a missing core build is refused with the build command, since the linker skips it without a word', () => {
  const { root, demo, frameworkModules } = makeRepo();

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

test('an unbuilt React wrapper is refused before the bundler fails on the missing entry', () => {
  const { root, demo } = makeRepo();

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

test('a registry copy of a wrapper is refused like one of the core', () => {
  const { root, demo, frameworkModules } = makeRepo();

  installRegistryCopy(frameworkModules('react-wrapper'), '@handsontable/react-wrapper');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('react-wrapper') });

  assert.equal(problems.length, 1);
  assert.match(problems[0].summary, /^@handsontable\/react-wrapper: resolves to a copy/);
});

test('the Angular demo is checked at both levels the linker writes, the nearest first', () => {
  const { root, demo, frameworkModules } = makeRepo();

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

test('a registry copy where the linker reads from needs the root install, not a reinstall of the demo', () => {
  const { root, demo } = makeRepo();

  // `npm install` run in examples/ replaces pnpm's link with a copy, and the linker would then link that copy.
  installRegistryCopy(join(root, 'examples/node_modules'), 'handsontable');

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].detail.length, 3, 'the framework link and the copy it resolves to are both named');
  assert.equal(problems[0].remedy, `Recreate the workspace links, then relink the demo: pnpm install && ${INSTALL_JS}`);
});

test('a demo with no copy of the package anywhere in its tree is refused as not installed', () => {
  const { root, demo, frameworkModules } = makeRepo();

  rmSync(frameworkModules('js'), { recursive: true });
  rmSync(join(root, 'examples/node_modules'), { recursive: true });

  const { problems } = checkLinkedPackages({ repoRoot: root, demoDir: demo('js') });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary, 'handsontable: not installed for this demo.');
  assert.equal(problems[0].remedy,
    `Recreate the workspace links, then install and link the demo: pnpm install && ${INSTALL_JS}`);
});

test('a Handsontable package that is no workspace package is refused, not left unchecked', () => {
  const { root, demo } = makeRepo();

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

test('a versioned copy of the examples is skipped, since the linker links next/ only', () => {
  const { root } = makeRepo();
  const versioned = join(root, 'examples/18.1.0/visual-tests/js/demo');

  write(join(versioned, 'package.json'), { dependencies: { handsontable: '18.1.0' } });
  installRegistryCopy(join(root, 'examples/18.1.0/visual-tests/js/node_modules'), 'handsontable');

  const result = checkLinkedPackages({ repoRoot: root, demoDir: versioned });

  assert.deepEqual(result.problems, []);
  assert.match(result.skipped, /examples\/18\.1\.0\/visual-tests\/js\/demo is not under examples\/next\//);
});

test('packageCopies skips a dangling link the way the resolver does, and stops at the given directory', () => {
  const { root, demo } = makeRepo();

  rmSync(join(root, 'handsontable/tmp'), { recursive: true });
  // A copy above the examples workspace is never read by the check.
  write(join(root, 'node_modules/handsontable/package.json'), { name: 'handsontable', version: '1.0.0' });

  assert.deepEqual(packageCopies(demo('js'), join(root, 'examples'), 'handsontable'), [],
    'both links dangle once handsontable/tmp is gone, and the root copy is past the stop');
});

test('the preflight passes a built, current core and refuses a missing one with the build command', () => {
  const { root } = makeRepo();

  assert.deepEqual(findBuildProblems({ repoRoot: root }), []);

  rmSync(join(root, 'handsontable/tmp'), { recursive: true });

  const problems = findBuildProblems({ repoRoot: root });

  assert.equal(problems.length, 1);
  assert.equal(problems[0].summary, 'The core is not built: handsontable/tmp/package.json is missing.');
  assert.equal(problems[0].remedy, 'Build the core first: npm --prefix handsontable run build');
});

test('the preflight names the entry a partial core build lacks', () => {
  const { root } = makeRepo();

  rmSync(join(root, 'handsontable/tmp/index.mjs'));

  const [problem] = findBuildProblems({ repoRoot: root });

  assert.equal(problem.summary, 'The core is not built: handsontable/tmp/index.mjs is missing.');
  assert.deepEqual(problem.detail,
    ['The linker links the package anyway, and the demo build fails on the missing file.']);
});

test('the preflight refuses a core build older than its sources, unless the age check is off', () => {
  const { root } = makeRepo();
  const past = new Date('2026-01-01T00:00:00Z');

  // Every build file predates the one source file.
  readdirSync(join(root, 'handsontable/tmp'), { recursive: true })
    .forEach(file => utimesSync(join(root, 'handsontable/tmp', file), past, past));

  const [problem, ...rest] = findBuildProblems({ repoRoot: root });

  assert.deepEqual(rest, []);
  assert.equal(problem.summary,
    'The core build is older than its sources: handsontable/tmp predates handsontable/src/core.ts.');
  assert.ok(problem.detail.some(line => line.startsWith('Build composed: handsontable/tmp/package.json (2026-01-01')),
    problem.detail.join('\n'));
  assert.equal(problem.remedy, 'Build the core first: npm --prefix handsontable run build');
  assert.deepEqual(findBuildProblems({ repoRoot: root, checkAge: false }), [],
    'CI turns the age check off: the extracted artifact carries the Build job\'s older times');
});

test('a rebuild that skipped postbuild still counts as stale, since only the full build composes the package', () => {
  const { root } = makeRepo();
  const past = new Date('2026-01-01T00:00:00Z');
  const later = new Date('2026-02-01T00:00:00Z');

  // `build:es` alone rewrote the entry after the source edit, but the manifest is from the build before it.
  utimesSync(join(root, 'handsontable/tmp/package.json'), past, past);
  utimesSync(join(root, 'handsontable/src/core.ts'), later, later);

  const [problem] = findBuildProblems({ repoRoot: root });

  assert.ok(problem, 'a current index.mjs must not hide a package.json older than the sources');
  assert.match(problem.summary, /^The core build is older than its sources/);
});

test('the age check ignores the tests and the Markdown under src, which the build does not compile', () => {
  const { root } = makeRepo();
  const past = new Date('2026-01-01T00:00:00Z');

  utimesSync(join(root, 'handsontable/src/core.ts'), past, past);
  write(join(root, 'handsontable/src/plugins/filters/__tests__/filters.unit.js'), '');
  write(join(root, 'handsontable/src/3rdparty/walkontable/test/spec/table.spec.js'), '');
  write(join(root, 'handsontable/src/3rdparty/walkontable/css/walkontable.test.css'), '');
  write(join(root, 'handsontable/src/plugins/filters/AGENTS.md'), '');

  assert.deepEqual(findBuildProblems({ repoRoot: root }), []);
  assert.equal(newestFile(join(root, 'handsontable/src')).path.endsWith('core.ts'), false,
    'without the ignore options the newest file is one of the ignored ones');
});

test('the preflight checks the wrapper builds the tier renders, and only those', () => {
  const { root } = makeRepo();

  rmSync(join(root, 'wrappers/react-wrapper/es'), { recursive: true });
  rmSync(join(root, 'wrappers/angular-wrapper/dist'), { recursive: true });

  assert.deepEqual(findBuildProblems({ repoRoot: root, wrappers: [] }), [], 'a js-only tier needs no wrapper build');

  const problems = findBuildProblems({ repoRoot: root, wrappers: ['react-wrapper', 'angular-wrapper'] });

  assert.deepEqual(problems.map(({ summary }) => summary), [
    'The react-wrapper build is missing: wrappers/react-wrapper/es/react-handsontable.mjs does not exist.',
    'The angular-wrapper build is missing: wrappers/angular-wrapper/dist/hot-table/package.json does not exist.',
  ]);
  assert.deepEqual(problems.map(({ remedy }) => remedy), [
    'Build it first: npm --prefix wrappers/react-wrapper run build',
    'Build it first: npm --prefix wrappers/angular-wrapper run build',
  ]);
  assert.match(problems[1].detail.join(' '), /The linker skips a package whose local build is missing/,
    'no dist/hot-table means a dangling pnpm link, so the linker leaves the registry copy');
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

test('the guard script exits 0 on a linked demo and 1 with the remedy on an unlinked one', () => {
  const { root, demo, frameworkModules } = makeRepo();
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

test('every visual-test demo runs the guard first in its build script, through a path that resolves', () => {
  const frameworksDir = join(REPO_ROOT, 'examples/next/visual-tests');
  const demos = readdirSync(frameworksDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(frameworksDir, entry.name, 'demo/package.json')))
    .map(entry => join(frameworksDir, entry.name, 'demo'));

  // The four frameworks the suite renders. Fewer means the directory moved and this test checks nothing.
  assert.equal(demos.length, 4, `found ${demos.length} demos under ${frameworksDir}`);

  demos.forEach((demoDir) => {
    const { scripts } = JSON.parse(readFileSync(join(demoDir, 'package.json'), 'utf8'));
    const [guardCall, ...rest] = scripts.build.split(' && ');
    const [runtime, script] = guardCall.split(' ');

    assert.equal(runtime, 'node', `${demoDir}: the build script must start with the guard, found "${scripts.build}"`);
    assert.equal(resolve(demoDir, script), join(PACKAGE_ROOT, 'scripts/check-linked-packages.mjs'),
      `${demoDir}: the guard path resolves to ${resolve(demoDir, script)}`);
    assert.ok(rest.length > 0, `${demoDir}: the build itself must follow the guard`);
  });
});

test('build.mjs refuses before its first install, with the age check off on CI only', () => {
  const build = readFileSync(join(PACKAGE_ROOT, 'scripts/build.mjs'), 'utf8');
  const preflightAt = build.indexOf('findBuildProblems({');
  const refusalAt = build.indexOf('process.exitCode = 1;');
  const installAt = build.indexOf('examples:install');

  assert.notEqual(preflightAt, -1, 'build.mjs lost the preflight call');
  assert.notEqual(refusalAt, -1, 'build.mjs no longer sets a failing exit code on a problem');
  assert.notEqual(installAt, -1, 'build.mjs no longer installs the examples');
  assert.ok(preflightAt < refusalAt && refusalAt < installAt,
    'the preflight must run and refuse before the first install, or a missing build costs the installs first');
  assert.match(build, /const checkAge = process\.env\.CI !== 'true';/);
  assert.match(build, /wrappers: frameworksToTest\.filter\(framework => framework !== REFERENCE_FRAMEWORK\)/,
    'the preflight checks the wrappers the tier renders');
});

test('no workflow or action builds a visual-test demo around its guard', () => {
  const workflowsDir = join(REPO_ROOT, '.github/workflows');
  const actionsDir = join(REPO_ROOT, '.github/actions');
  const files = [
    ...readdirSync(workflowsDir).filter(file => /\.ya?ml$/.test(file)).map(file => join(workflowsDir, file)),
    ...readdirSync(actionsDir, { withFileTypes: true }).filter(entry => entry.isDirectory())
      .map(entry => join(actionsDir, entry.name, 'action.yml')).filter(file => existsSync(file)),
  ];
  const bypasses = files
    .flatMap(file => readFileSync(file, 'utf8').split('\n')
      .map((line, index) => ({ file, line: index + 1, text: line.trim() })))
    // A demo's own build tool called directly, which is the only way to skip the `build` script's guard.
    .filter(({ text }) => !text.startsWith('#') && /\b(vite build|ng build|react-app-rewired build)\b/.test(text));

  assert.ok(files.length > 10, `only ${files.length} workflow and action files found — did .github move?`);
  assert.deepEqual(bypasses, [], 'build a demo through `npm --prefix <demo> run build` so its guard runs');
});
