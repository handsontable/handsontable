import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { envHash, specKey, filterCached, recordGreen } from '../e2e-run-cache.mjs';

/**
 * Build a minimal fake repo root with a dist bundle, a fixture, and one spec.
 *
 * @returns {string} The fake repo root.
 */
function fakeRoot() {
  const root = mkdtempSync(path.join(tmpdir(), 'e2e-cache-'));

  mkdirSync(path.join(root, '.git'), { recursive: true });
  mkdirSync(path.join(root, 'handsontable/dist'), { recursive: true });
  mkdirSync(path.join(root, 'tests/e2e'), { recursive: true });
  mkdirSync(path.join(root, 'tests/fixtures/pages'), { recursive: true });
  writeFileSync(path.join(root, 'handsontable/dist/handsontable.js'), 'dist-umd-v1');
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

test('rebuilding ONLY the base UMD bundle invalidates the cache (the e2e-main leg loads it)', () => {
  const root = fakeRoot();

  recordGreen(root, ['e2e/a.spec.ts']);
  // `build:umd` rewrites handsontable.js and leaves the min files alone — the
  // hook must re-run the spec against the new bundle, not skip it as green.
  writeFileSync(path.join(root, 'handsontable/dist/handsontable.js'), 'dist-umd-v2');
  assert.deepEqual(filterCached(root, ['e2e/a.spec.ts']).toRun, ['e2e/a.spec.ts']);
});

test('a missing base UMD bundle makes the environment incomplete (never skip)', () => {
  const root = fakeRoot();

  recordGreen(root, ['e2e/a.spec.ts']);
  rmSync(path.join(root, 'handsontable/dist/handsontable.js'));
  assert.equal(envHash(root), '');
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
