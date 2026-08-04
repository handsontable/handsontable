import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { envHash, specKey, filterCached, recordGreen, cacheFile } from '../e2e-run-cache.mjs';

/**
 * Build a minimal fake repo root with a dist bundle, a fixture, and one spec.
 *
 * @param {'clone'|'worktree'} shape `clone` gives a `.git` DIRECTORY; `worktree`
 *   gives the linked-worktree layout, where `.git` is a FILE pointing at
 *   `<main>/.git/worktrees/<name>`.
 * @returns {string} The fake repo root.
 */
function fakeRoot(shape = 'clone') {
  const root = mkdtempSync(path.join(tmpdir(), 'e2e-cache-'));

  if (shape === 'worktree') {
    const linked = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-cache-main-')), '.git/worktrees/wt');

    mkdirSync(linked, { recursive: true });
    writeFileSync(path.join(root, '.git'), `gitdir: ${linked}\n`);
  } else {
    mkdirSync(path.join(root, '.git'), { recursive: true });
  }
  mkdirSync(path.join(root, 'handsontable/dist'), { recursive: true });
  mkdirSync(path.join(root, 'tests/e2e'), { recursive: true });
  mkdirSync(path.join(root, 'tests/fixtures/pages'), { recursive: true });
  writeFileSync(path.join(root, 'handsontable/dist/handsontable.full.min.js'), 'dist-v1');
  writeFileSync(path.join(root, 'tests/fixtures/pages/GridPage.ts'), 'pom-v1');
  writeFileSync(path.join(root, 'tests/playwright.config.ts'), 'cfg-v1');
  writeFileSync(path.join(root, 'tests/e2e/a.spec.ts'), 'spec-v1');

  return root;
}

test('a recorded green run is skipped on the next pass (run-once)', () => {
  const root = fakeRoot();

  assert.deepEqual(filterCached(root, ['e2e/a.spec.ts']).toRun, ['e2e/a.spec.ts']);
  recordGreen(root, ['e2e/a.spec.ts']);
  const second = filterCached(root, ['e2e/a.spec.ts']);

  assert.deepEqual(second.toRun, []);
  assert.deepEqual(second.skipped, ['e2e/a.spec.ts']);
});

// In a linked worktree `<root>/.git` is a file, so the old `path.join(root,
// '.git', …)` target could never be written (ENOTDIR, swallowed) — the cache was
// permanently cold for everyone working in a worktree, silently.
test('run-once works in a linked worktree, where .git is a file', () => {
  const root = fakeRoot('worktree');
  const file = cacheFile(root);

  // Not under the `.git` file — the real git directory lives outside the worktree.
  assert.ok(file && !file.startsWith(root), `${file} is under the .git FILE`);

  assert.deepEqual(filterCached(root, ['e2e/a.spec.ts']).toRun, ['e2e/a.spec.ts']);
  recordGreen(root, ['e2e/a.spec.ts']);
  assert.ok(existsSync(file), `${file} was not written`);

  const second = filterCached(root, ['e2e/a.spec.ts']);

  assert.deepEqual(second.toRun, []);
  assert.deepEqual(second.skipped, ['e2e/a.spec.ts']);
});

test('editing the spec invalidates the cache in a worktree too', () => {
  const root = fakeRoot('worktree');

  recordGreen(root, ['e2e/a.spec.ts']);
  writeFileSync(path.join(root, 'tests/e2e/a.spec.ts'), 'spec-v2');
  assert.deepEqual(filterCached(root, ['e2e/a.spec.ts']).toRun, ['e2e/a.spec.ts']);
});

test('editing the spec invalidates the cache', () => {
  const root = fakeRoot();

  recordGreen(root, ['e2e/a.spec.ts']);
  writeFileSync(path.join(root, 'tests/e2e/a.spec.ts'), 'spec-v2');
  assert.deepEqual(filterCached(root, ['e2e/a.spec.ts']).toRun, ['e2e/a.spec.ts']);
});

test('rebuilding the dist or touching a fixture invalidates the cache', () => {
  const root = fakeRoot();

  recordGreen(root, ['e2e/a.spec.ts']);
  writeFileSync(path.join(root, 'handsontable/dist/handsontable.full.min.js'), 'dist-v2');
  assert.deepEqual(filterCached(root, ['e2e/a.spec.ts']).toRun, ['e2e/a.spec.ts']);

  recordGreen(root, ['e2e/a.spec.ts']);
  writeFileSync(path.join(root, 'tests/fixtures/pages/GridPage.ts'), 'pom-v2');
  assert.deepEqual(filterCached(root, ['e2e/a.spec.ts']).toRun, ['e2e/a.spec.ts']);
});

test('no dist → never skip (env incomplete), and keys are content-scoped', () => {
  const root = fakeRoot();

  recordGreen(root, ['e2e/a.spec.ts']);
  assert.equal(specKey(root, 'e2e/a.spec.ts', '').length, 0);
  assert.ok(envHash(root).length > 0);
  // a different spec is unaffected by a's green record
  writeFileSync(path.join(root, 'tests/e2e/b.spec.ts'), 'spec-b');
  assert.deepEqual(filterCached(root, ['e2e/b.spec.ts']).toRun, ['e2e/b.spec.ts']);
});
