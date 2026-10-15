import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Drives the real check.mjs end to end in a throwaway git repository: the real `tsc` and `vue-tsc`, a small
// stub in place of the core types and the React wrapper. The cases run the script the way CI does: from
// `docs/`, with `BASE_REF` set, against a merge commit. The example carries one old TS2345 error.

const here = path.dirname(fileURLToPath(import.meta.url));
const realDocs = path.resolve(here, '../..');
const realVue3 = path.resolve(realDocs, '../wrappers/vue3');
const PAGE = 'docs/content/guides/g/p';
const EXAMPLE = `${PAGE}/javascript/e.ts`;
const OLD = 'function f(a: number): void { void a; }\nf(\'x\');\n';
const toolsPresent = existsSync(path.join(realDocs, 'node_modules/typescript/bin/tsc'))
  && existsSync(path.join(realVue3, 'node_modules/vue-tsc'));
const opts = { skip: toolsPresent ? false : 'tsc / vue-tsc are not installed' };
const made = [];

const HOT_TYPES = [
  'declare class Handsontable { constructor(element: HTMLElement, settings: { autoWrapRow?: boolean }); }',
  'export default Handsontable;',
  '',
].join('\n');
const REACT_WRAPPER = 'export const HotTable = (props: { autoWrapRow?: boolean }) => { void props; return null; };\n';

/**
 * @param {{ fakeTsc?: string, files?: Record<string, string> }} [options] `fakeTsc` is the source of a stand-in
 *   `tsc`; `files` are committed to the base revision next to the example.
 * @returns {string} The root of a committed temp repo that holds a copy of the checker.
 */
function makeRepo({ fakeTsc = '', files = {} } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'content-type-check-'));

  made.push(root);
  mkdirSync(path.join(root, 'docs/content-type-check'), { recursive: true });
  cpSync(path.join(realDocs, 'content-type-check/check.mjs'), path.join(root, 'docs/content-type-check/check.mjs'));
  cpSync(path.join(realDocs, 'content-type-check/lib.mjs'), path.join(root, 'docs/content-type-check/lib.mjs'));
  writeFileSync(path.join(root, 'docs/package.json'), '{"name":"docs"}');
  mkdirSync(path.join(root, 'wrappers/vue3'), { recursive: true });
  writeFileSync(path.join(root, 'wrappers/vue3/package.json'), '{"name":"vue3"}');
  symlinkSync(path.join(realVue3, 'node_modules'), path.join(root, 'wrappers/vue3/node_modules'));
  mkdirSync(path.join(root, 'wrappers/react-wrapper/src'), { recursive: true });
  writeFileSync(path.join(root, 'wrappers/react-wrapper/src/index.tsx'), REACT_WRAPPER);

  if (fakeTsc) {
    mkdirSync(path.join(root, 'docs/node_modules/typescript/bin'), { recursive: true });
    writeFileSync(path.join(root, 'docs/node_modules/typescript/package.json'), '{"name":"typescript"}');
    writeFileSync(path.join(root, 'docs/node_modules/typescript/bin/tsc'), fakeTsc);
  } else {
    symlinkSync(path.join(realDocs, 'node_modules'), path.join(root, 'docs/node_modules'));
  }

  mkdirSync(path.join(root, 'handsontable/tmp'), { recursive: true });
  writeFileSync(path.join(root, 'handsontable/tmp/index.d.ts'), HOT_TYPES);
  mkdirSync(path.dirname(path.join(root, EXAMPLE)), { recursive: true });
  writeFileSync(path.join(root, EXAMPLE), OLD);
  writeFileSync(path.join(root, '.gitignore'), 'node_modules\n.tmp\n');

  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }

  git(root, ['init', '-q']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'base']);

  return root;
}

/**
 * @param {string} root The temp repo.
 * @param {string[]} args Arguments of `git`.
 * @returns {string} The stdout.
 */
function git(root, args) {
  return spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root, encoding: 'utf8' }).stdout.trim();
}

/**
 * Runs check.mjs from `docs/`, the working directory `npm run --prefix docs` gives it in CI.
 *
 * @param {string} root The temp repo.
 * @param {string[]} args Arguments of check.mjs.
 * @param {{ baseRef?: string, invokedFrom?: string }} [settings] `BASE_REF`, and the directory npm records as `INIT_CWD`.
 * @returns {{ status: number, out: string }} The exit status and the output.
 */
function run(root, args, { baseRef = '', invokedFrom = root } = {}) {
  const result = spawnSync(process.execPath, [path.join(root, 'docs/content-type-check/check.mjs'), ...args], {
    cwd: path.join(root, 'docs'),
    encoding: 'utf8',
    env: { ...process.env, BASE_REF: baseRef, INIT_CWD: invokedFrom, GITHUB_ACTIONS: '' },
  });

  return { status: result.status, out: result.stdout + result.stderr };
}

/**
 * @param {string} root The temp repo.
 * @param {string} file A repo-relative path.
 * @param {string} content The new content.
 */
function write(root, file, content) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content);
}

test.after(() => made.forEach(dir => rmSync(dir, { recursive: true, force: true })));

test('an edit that only moves the old error passes', opts, () => {
  const root = makeRepo();

  write(root, EXAMPLE, `// a new comment\n// another\n${OLD}`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 0, out);
  assert.match(out, /1 pre-existing error/);
});

test('a second copy of the old error fails', opts, () => {
  const root = makeRepo();

  write(root, EXAMPLE, `${OLD}f('x');\n`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /TS2345/);
});

test('a new file with an error fails, and one without passes', opts, () => {
  const root = makeRepo();
  const added = `${PAGE}/javascript/new.ts`;

  write(root, added, 'export const n: number = \'s\';\n');
  git(root, ['add', '-A']);

  const bad = run(root, ['--base', 'HEAD']);

  assert.equal(bad.status, 1, bad.out);
  assert.match(bad.out, /new\.ts:1 {2}TS2322/);

  write(root, added, 'export const n: number = 1;\n');

  assert.equal(run(root, ['--base', 'HEAD']).status, 0);
});

test('an untracked new file is checked by --base', opts, () => {
  const root = makeRepo();

  write(root, `${PAGE}/javascript/untracked.ts`, 'export const n: number = \'s\';\n');

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /untracked\.ts:1 {2}TS2322/);
});

test('a tsc crash is a tooling failure (exit 2), not a pass', opts, () => {
  const root = makeRepo({ fakeTsc: 'console.error("boom: tsc crashed"); process.exit(3);\n' });

  write(root, EXAMPLE, `// edit\n${OLD}`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 2, out);
  assert.match(out, /failed to run/);
});

test('a compiler option error is a tooling failure, not a pass', opts, () => {
  const root = makeRepo({
    fakeTsc: 'console.log("docs/content-type-check/.tmp/tsconfig.ts.head.0.json(1,1): error TS5101: Option \'x\' is deprecated.");\n',
  });

  write(root, EXAMPLE, `// edit\n${OLD}`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 2, out);
  assert.match(out, /TS5101/);
});

test('missing core types are a tooling failure (exit 2)', opts, () => {
  const root = makeRepo();

  rmSync(path.join(root, 'handsontable/tmp/index.d.ts'));
  write(root, EXAMPLE, `// edit\n${OLD}`);

  assert.equal(run(root, ['--base', 'HEAD']).status, 2);
});

test('--files compares explicit files with HEAD', opts, () => {
  const root = makeRepo();

  write(root, EXAMPLE, `// moved\n${OLD}`);
  assert.equal(run(root, ['--files', EXAMPLE]).status, 0);

  write(root, EXAMPLE, `${OLD}f('x');\n`);
  assert.equal(run(root, ['--files', EXAMPLE]).status, 1);
});

test('--files resolves a relative path against the directory npm was started in', opts, () => {
  const root = makeRepo();

  write(root, EXAMPLE, `${OLD}f('x');\n`);

  const { status, out } = run(root, ['--files', 'javascript/e.ts'], { invokedFrom: path.join(root, PAGE) });

  assert.equal(status, 1, out);
  assert.match(out, /TS2345/);
});

test('--files with a path that is not a checked example is an error, not a silent skip', opts, () => {
  const root = makeRepo();

  write(root, `${PAGE}/javascript/e.js`, 'export {};\n');

  const missing = run(root, ['--files', 'docs/content/guides/g/p/javascript/typo.ts']);
  const wrongKind = run(root, ['--files', `${PAGE}/javascript/e.js`]);

  assert.equal(missing.status, 2, missing.out);
  assert.equal(wrongKind.status, 2, wrongKind.out);
  assert.match(wrongKind.out, /Not a checked docs example/);
});

test('--files warns when the file has no diff against the base', opts, () => {
  const root = makeRepo();
  const { status, out } = run(root, ['--files', EXAMPLE]);

  assert.equal(status, 0, out);
  assert.match(out, /has no changes against/);
});

test('nothing changed means nothing to check', opts, () => {
  const root = makeRepo();
  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 0);
  assert.match(out, /nothing to check/);
  assert.ok(readFileSync(path.join(root, EXAMPLE), 'utf8') === OLD);
});

/**
 * Commits the edits on a branch and merges it with `--no-ff`, the shape of the merge ref CI checks out.
 *
 * @param {string} root The temp repo.
 * @param {Record<string, string>} edits Repo-relative path to new content.
 * @returns {string} The first parent of the merge commit, which is `BASE_REF` in CI.
 */
function mergeCommit(root, edits) {
  const trunk = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);

  git(root, ['checkout', '-q', '-b', 'feature']);

  for (const [file, content] of Object.entries(edits)) {
    write(root, file, content);
  }

  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'change']);
  git(root, ['checkout', '-q', trunk]);
  git(root, ['merge', '-q', '--no-ff', '-m', 'merge', 'feature']);

  return git(root, ['rev-parse', 'HEAD^1']);
}

test('the CI invocation: a merge commit, BASE_REF, no arguments, run from docs/', opts, () => {
  const added = makeRepo();
  const addedBase = mergeCommit(added, { [EXAMPLE]: `${OLD}f('x');\n` });
  const addedRun = run(added, [], { baseRef: addedBase });

  assert.equal(addedRun.status, 1, addedRun.out);
  assert.match(addedRun.out, /e\.ts:\d+ {2}TS2345/);

  const moved = makeRepo();
  const movedBase = mergeCommit(moved, { [EXAMPLE]: `// moved\n${OLD}` });
  const movedRun = run(moved, [], { baseRef: movedBase });

  assert.equal(movedRun.status, 0, movedRun.out);
  assert.match(movedRun.out, /1 changed example/);
});

test('a type-neutral rename of a name quoted in an old error passes', opts, () => {
  const old = 'export function sanitize(value) { return value; }\n';
  const root = makeRepo({ files: { [EXAMPLE]: old } });

  assert.equal(run(root, ['--base', 'HEAD']).status, 0);

  write(root, EXAMPLE, 'export function sanitize(cellValue) { return cellValue; }\n');

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 0, out);
  assert.match(out, /1 pre-existing error/);
});

test('a valid property added to an object quoted in an old error passes', opts, () => {
  const old = 'const item = { name: \'a\' };\nvoid item.clear;\n';
  const root = makeRepo({ files: { [EXAMPLE]: old } });

  write(root, EXAMPLE, 'const item = { name: \'a\', disabled: false };\nvoid item.clear;\n');

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 0, out);
  assert.match(out, /1 pre-existing error/);
});

test('a deleted helper that the example still imports fails', opts, () => {
  const helper = `${PAGE}/javascript/helper.ts`;
  const clean = 'import { value } from \'./helper\';\n\nexport const n: number = value;\n';
  const root = makeRepo({ files: { [helper]: 'export const value = 1;\n', [EXAMPLE]: clean } });

  assert.equal(run(root, ['--base', 'HEAD']).status, 0);

  rmSync(path.join(root, helper));
  write(root, EXAMPLE, `// edit\n${clean}`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /TS2307/);
});

test('an edited helper that changes an export of the example fails', opts, () => {
  const helper = `${PAGE}/javascript/helper.ts`;
  const clean = 'import { value } from \'./helper\';\n\nexport const n: number = value;\n';
  const root = makeRepo({ files: { [helper]: 'export const value = 1;\n', [EXAMPLE]: clean } });

  write(root, helper, 'export const value = \'one\';\n');
  write(root, EXAMPLE, `// edit\n${clean}`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /TS2322/);
});

test('real settings types: a wrong option value fails when the container is typed', opts, () => {
  const settings = (container, value) => [
    'import Handsontable from \'handsontable\';',
    '',
    container,
    `new Handsontable(el, { autoWrapRow: ${value} });`,
    '',
  ].join('\n');
  const typed = 'const el = document.querySelector<HTMLElement>(\'#e\')!;';
  const root = makeRepo({ files: { [EXAMPLE]: settings(typed, 'true') } });

  assert.equal(run(root, ['--base', 'HEAD']).status, 0);

  write(root, EXAMPLE, settings(typed, '\'yes\''));

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /TS2322/);
});

test('known limit: an old error in argument 1 hides a new error in argument 2', opts, () => {
  const settings = value => [
    'import Handsontable from \'handsontable\';',
    '',
    'const el = document.querySelector(\'#e\');',
    `new Handsontable(el, { autoWrapRow: ${value} });`,
    '',
  ].join('\n');
  const root = makeRepo({ files: { [EXAMPLE]: settings('true') } });

  write(root, EXAMPLE, settings('\'yes\''));

  const { status, out } = run(root, ['--base', 'HEAD']);

  // TypeScript stops at the untyped container, so the settings object is never checked. docs/AGENTS.md
  // lists this under "Limits"; a typed container (the case above) is the way to get the check.
  assert.equal(status, 0, out);
  assert.match(out, /1 pre-existing error/);
});

test('a .tsx example: errors fail, and the React wrapper props are checked', opts, () => {
  const react = `${PAGE}/react/e.tsx`;
  const source = props => [
    'import { HotTable } from \'@handsontable/react-wrapper\';',
    '',
    `export const App = () => <div><HotTable ${props} /></div>;`,
    '',
  ].join('\n');
  const root = makeRepo({ files: { [react]: source('autoWrapRow') } });

  assert.equal(run(root, ['--base', 'HEAD']).status, 0);

  write(root, react, source('autoWrapRow="yes"'));

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /react\/e\.tsx:\d+ {2}TS2322/);
});

test('a .vue example: script errors fail and are attributed to the .vue file', opts, () => {
  const vue = `${PAGE}/vue/e.vue`;
  const source = value => `<script setup lang="ts">\nconst n: number = ${value};\n</script>\n\n<template><div>{{ n }}</div></template>\n`;
  const root = makeRepo({ files: { [vue]: source('1') } });

  assert.equal(run(root, ['--base', 'HEAD']).status, 0);

  write(root, vue, source('\'s\''));

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /vue\/e\.vue:\d+ {2}TS2322/);
});

test('several files of mixed types are all reported', opts, () => {
  const react = `${PAGE}/react/e.tsx`;
  const vue = `${PAGE}/vue/e.vue`;
  const root = makeRepo({
    files: {
      [react]: 'export const App = () => <div />;\n',
      [vue]: '<script setup lang="ts">\nconst n: number = 1;\n</script>\n\n<template><div>{{ n }}</div></template>\n',
    },
  });

  write(root, EXAMPLE, `${OLD}f('x');\n`);
  write(root, react, 'export const App = () => <div>{(1 as number).toFixed(\'x\')}</div>;\n');
  write(root, vue, '<script setup lang="ts">\nconst n: number = \'s\';\n</script>\n\n<template><div>{{ n }}</div></template>\n');

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 1, out);
  assert.match(out, /javascript\/e\.ts:\d+ {2}TS2345/);
  assert.match(out, /react\/e\.tsx:\d+ {2}TS2345/);
  assert.match(out, /vue\/e\.vue:\d+ {2}TS2322/);
  assert.match(out, /3 file\(s\)/);
});

test('`declare global` blocks of examples in different folders do not merge', opts, () => {
  const react = `${PAGE}/react/e.tsx`;
  const declare = type => `declare global {\n  interface Window {\n    readXlsxFile: ${type};\n  }\n}\n\nexport const App = () => <div />;\n`;
  const root = makeRepo({
    files: {
      [EXAMPLE]: 'declare global {\n  interface Window {\n    readXlsxFile: string;\n  }\n}\n\nexport {};\n',
      [react]: declare('string'),
    },
  });

  write(root, EXAMPLE, 'declare global {\n  interface Window {\n    readXlsxFile: string;\n  }\n}\n\nexport {};\n// edit\n');
  write(root, react, `${declare('number')}// edit\n`);

  const { status, out } = run(root, ['--base', 'HEAD']);

  assert.equal(status, 0, out);
});
