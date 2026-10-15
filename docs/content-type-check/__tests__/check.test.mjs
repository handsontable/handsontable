import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Drives the real check.mjs end to end in a throwaway git repository: the real `tsc` from
// docs/node_modules, a stub in place of the core types. The example carries one old TS2345 error.

const here = path.dirname(fileURLToPath(import.meta.url));
const realDocs = path.resolve(here, '../..');
const realVue3 = path.resolve(realDocs, '../wrappers/vue3');
const EXAMPLE = 'docs/content/guides/g/p/javascript/e.ts';
const OLD = 'function f(a: number): void { void a; }\nf(\'x\');\n';
const toolsPresent = existsSync(path.join(realDocs, 'node_modules/typescript/bin/tsc'))
  && existsSync(path.join(realVue3, 'node_modules/vue-tsc'));
const opts = { skip: toolsPresent ? false : 'tsc / vue-tsc are not installed' };
const made = [];

/**
 * @param {{ fakeTsc?: boolean }} [options] Options.
 * @returns {string} The root of a committed temp repo that holds a copy of the checker.
 */
function makeRepo({ fakeTsc = false } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'content-type-check-'));

  made.push(root);
  mkdirSync(path.join(root, 'docs/content-type-check'), { recursive: true });
  cpSync(path.join(realDocs, 'content-type-check/check.mjs'), path.join(root, 'docs/content-type-check/check.mjs'));
  cpSync(path.join(realDocs, 'content-type-check/lib.mjs'), path.join(root, 'docs/content-type-check/lib.mjs'));
  writeFileSync(path.join(root, 'docs/package.json'), '{"name":"docs"}');
  mkdirSync(path.join(root, 'wrappers/vue3'), { recursive: true });
  writeFileSync(path.join(root, 'wrappers/vue3/package.json'), '{"name":"vue3"}');
  symlinkSync(path.join(realVue3, 'node_modules'), path.join(root, 'wrappers/vue3/node_modules'));

  if (fakeTsc) {
    mkdirSync(path.join(root, 'docs/node_modules/typescript/bin'), { recursive: true });
    writeFileSync(path.join(root, 'docs/node_modules/typescript/package.json'), '{"name":"typescript"}');
    writeFileSync(path.join(root, 'docs/node_modules/typescript/bin/tsc'), 'console.error("boom: tsc crashed"); process.exit(3);\n');
  } else {
    symlinkSync(path.join(realDocs, 'node_modules'), path.join(root, 'docs/node_modules'));
  }

  mkdirSync(path.join(root, 'handsontable/tmp'), { recursive: true });
  writeFileSync(path.join(root, 'handsontable/tmp/index.d.ts'), 'export {};\n');
  mkdirSync(path.dirname(path.join(root, EXAMPLE)), { recursive: true });
  writeFileSync(path.join(root, EXAMPLE), OLD);
  writeFileSync(path.join(root, '.gitignore'), 'node_modules\n.tmp\n');

  const git = args => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root, encoding: 'utf8' });

  git(['init', '-q']);
  git(['add', '-A']);
  git(['commit', '-q', '-m', 'base']);

  return root;
}

/**
 * @param {string} root The temp repo.
 * @param {string[]} args Arguments of check.mjs.
 * @returns {{ status: number, out: string }} The exit status and the output.
 */
function run(root, args) {
  const result = spawnSync(process.execPath, [path.join(root, 'docs/content-type-check/check.mjs'), ...args], {
    cwd: root, encoding: 'utf8', env: { ...process.env, BASE_REF: '', GITHUB_ACTIONS: '' },
  });

  return { status: result.status, out: result.stdout + result.stderr };
}

test.after(() => made.forEach(root => rmSync(root, { recursive: true, force: true })));

test('an edit that only moves the old error passes', opts, () => {
  const root = makeRepo();

  writeFileSync(path.join(root, EXAMPLE), `// a new comment\n// another\n${OLD}`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 0, out);
  assert.match(out, /1 pre-existing error/);
});

test('a second copy of the old error fails', opts, () => {
  const root = makeRepo();

  writeFileSync(path.join(root, EXAMPLE), `${OLD}f('x');\n`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /TS2345/);
});

test('a new file with an error fails, and one without passes', opts, () => {
  const root = makeRepo();
  const added = path.join(root, 'docs/content/guides/g/p/javascript/new.ts');

  writeFileSync(added, 'export const n: number = \'s\';\n');
  spawnSync('git', ['add', '-A'], { cwd: root });

  const bad = run(root, ['--base', 'HEAD']);

  assert.equal(bad.status, 1, bad.out);
  assert.match(bad.out, /new\.ts:1 {2}TS2322/);

  writeFileSync(added, 'export const n: number = 1;\n');

  assert.equal(run(root, ['--base', 'HEAD']).status, 0);
});

test('a tsc crash is a tooling failure (exit 2), not a pass', opts, () => {
  const root = makeRepo({ fakeTsc: true });

  writeFileSync(path.join(root, EXAMPLE), `// edit\n${OLD}`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 2, out);
  assert.match(out, /failed to run/);
});

test('missing core types are a tooling failure (exit 2)', opts, () => {
  const root = makeRepo();

  rmSync(path.join(root, 'handsontable/tmp/index.d.ts'));
  writeFileSync(path.join(root, EXAMPLE), `// edit\n${OLD}`);

  assert.equal(run(root, ['--base', 'HEAD']).status, 2);
});

test('--files compares explicit files with HEAD', opts, () => {
  const root = makeRepo();

  writeFileSync(path.join(root, EXAMPLE), `// moved\n${OLD}`);
  assert.equal(run(root, ['--files', EXAMPLE]).status, 0);

  writeFileSync(path.join(root, EXAMPLE), `${OLD}f('x');\n`);
  assert.equal(run(root, ['--files', EXAMPLE]).status, 1);
});

test('nothing changed means nothing to check', opts, () => {
  const root = makeRepo();
  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 0);
  assert.match(out, /nothing to check/);
  assert.ok(readFileSync(path.join(root, EXAMPLE), 'utf8') === OLD);
});
