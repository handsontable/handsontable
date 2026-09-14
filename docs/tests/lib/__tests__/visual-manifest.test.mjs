import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listPngs, manifestFromReport, manifestFromTree } from '../visual-manifest.mjs';

// This adapter decides what a docs pull request's visual verdict says, so each bucket is pinned. The
// two that matter most are the ones the old cache-based baseline got wrong: a golden that does not
// exist yet must read as NEW (it was silently written and passed before DEV-2860), and a page parked
// with `test.fixme()` must not read as DELETED (its golden is still the baseline's).

/**
 * One `JSONReportTest`, in the shape playwright/types/testReporter.d.ts declares.
 *
 * @param {object} options The test's shape.
 * @returns {object} The report entry.
 */
const reportTest = ({ status, snapshot, errors = [], annotateOnResult = false }) => ({
  status,
  expectedStatus: 'passed',
  projectName: 'visual',
  annotations: snapshot && !annotateOnResult ? [{ type: 'snapshot', description: snapshot }] : [],
  results: [{
    status: status === 'expected' ? 'passed' : 'failed',
    retry: 0,
    errors: errors.map(message => ({ message })),
    error: errors.length > 0 ? { message: errors[0] } : undefined,
    annotations: snapshot && annotateOnResult ? [{ type: 'snapshot', description: snapshot }] : [],
  }],
});

/**
 * A report with one file suite holding the given tests.
 *
 * @param {object[]} tests The `JSONReportTest` entries.
 * @returns {object} The report.
 */
const report = tests => ({
  suites: [{
    title: 'visualDocs.spec.ts',
    file: 'visualDocs.spec.ts',
    specs: tests.map((entry, index) => ({ title: `test ${index}`, ok: entry.status === 'expected', tests: [entry] })),
  }],
});

const MISSING = 'Error: A snapshot doesn\'t exist at /docs/tests/test-artifacts/screenshots/'
  + 'visualDocs.spec.ts/js-new-page.png.';

test('a passing test puts its golden in passedItems', () => {
  const manifest = manifestFromReport({
    report: report([reportTest({ status: 'expected', snapshot: 'visualDocs.spec.ts/js-demo.png' })]),
    baseline: ['visualDocs.spec.ts/js-demo.png'],
  });

  assert.deepEqual(manifest.passedItems, ['visualDocs.spec.ts/js-demo.png']);
  assert.deepEqual(manifest.failedItems, []);
  assert.deepEqual(manifest.newItems, []);
  assert.deepEqual(manifest.deletedItems, []);
  assert.deepEqual(manifest.actualItems, ['visualDocs.spec.ts/js-demo.png']);
  assert.deepEqual(manifest.expectedItems, ['visualDocs.spec.ts/js-demo.png']);
});

test('a flaky test counts as passing — the golden matched on a retry', () => {
  const manifest = manifestFromReport({
    report: report([reportTest({ status: 'flaky', snapshot: 'visualDocs.spec.ts/js-demo.png' })]),
    baseline: ['visualDocs.spec.ts/js-demo.png'],
  });

  assert.deepEqual(manifest.passedItems, ['visualDocs.spec.ts/js-demo.png']);
  assert.deepEqual(manifest.failedItems, []);
});

test('a mismatch is a changed item, and carries a diff', () => {
  const manifest = manifestFromReport({
    report: report([reportTest({
      status: 'unexpected',
      snapshot: 'visualDocs.spec.ts/js-demo.png',
      errors: ['Screenshot comparison failed:\n\n  12000 pixels (ratio 0.03) are different.'],
    })]),
    baseline: ['visualDocs.spec.ts/js-demo.png'],
  });

  assert.deepEqual(manifest.failedItems, ['visualDocs.spec.ts/js-demo.png']);
  assert.deepEqual(manifest.diffItems, ['visualDocs.spec.ts/js-demo.png']);
  assert.deepEqual(manifest.newItems, []);
  assert.deepEqual(manifest.passedItems, []);
});

test('a missing golden is a new item, not a changed one', () => {
  // `updateSnapshots: 'none'` on CI turns "no golden yet" into a failed test. Reading that as a
  // change would tell a reviewer a page regressed when nothing has ever been captured for it.
  const manifest = manifestFromReport({
    report: report([reportTest({
      status: 'unexpected',
      snapshot: 'visualDocs.spec.ts/js-new-page.png',
      errors: [MISSING],
    })]),
    baseline: ['visualDocs.spec.ts/js-demo.png'],
  });

  assert.deepEqual(manifest.newItems, ['visualDocs.spec.ts/js-new-page.png']);
  assert.deepEqual(manifest.failedItems, []);
  // The baseline's own page was declared by no test in this report, so it is a deletion.
  assert.deepEqual(manifest.deletedItems, ['visualDocs.spec.ts/js-demo.png']);
});

test('the missing-golden error is found on a retry as well as on the first attempt', () => {
  const entry = reportTest({ status: 'unexpected', snapshot: 'visualDocs.spec.ts/js-new-page.png' });

  entry.results.push({ status: 'failed', retry: 1, errors: [{ message: MISSING }], annotations: [] });

  const manifest = manifestFromReport({ report: report([entry]) });

  assert.deepEqual(manifest.newItems, ['visualDocs.spec.ts/js-new-page.png']);
  assert.deepEqual(manifest.failedItems, []);
});

test('a fixme\'d page declares its golden, so it is never reported as deleted', () => {
  // The annotation is pushed before `test.fixme()` for exactly this reason: the two pages parked in
  // visualDocs.spec.ts would otherwise vanish from the baseline on the first seed after this lands.
  const parked = reportTest({ status: 'skipped', snapshot: 'visualDocs.spec.ts/js-column-filter.png' });

  parked.annotations.push({ type: 'fixme', description: '' });

  const manifest = manifestFromReport({
    report: report([parked]),
    baseline: ['visualDocs.spec.ts/js-column-filter.png'],
  });

  assert.deepEqual(manifest.deletedItems, []);
  assert.deepEqual(manifest.passedItems, [], 'a skipped page was not compared, so it did not pass');
  assert.deepEqual(manifest.failedItems, []);
  assert.deepEqual(manifest.actualItems, [], 'nothing was rendered for it');
});

test('a golden no test declares any more is a deleted item', () => {
  const manifest = manifestFromReport({
    report: report([reportTest({ status: 'expected', snapshot: 'visualDocs.spec.ts/js-demo.png' })]),
    baseline: [
      'visualDocs.spec.ts/js-demo.png',
      'visualDocs.spec.ts/js-removed-guide.png',
      'visualDocs.spec.ts/vue-removed-guide.png',
    ],
  });

  assert.deepEqual(manifest.deletedItems, [
    'visualDocs.spec.ts/js-removed-guide.png',
    'visualDocs.spec.ts/vue-removed-guide.png',
  ]);
});

test('nested suites are walked, and a test without the annotation is ignored', () => {
  const manifest = manifestFromReport({
    report: {
      suites: [{
        title: 'visualDocs.spec.ts',
        specs: [{ title: 'a helper test', tests: [reportTest({ status: 'expected' })] }],
        suites: [{
          title: 'js tests',
          specs: [{
            title: 'take screenshot for js on demo',
            tests: [reportTest({ status: 'expected', snapshot: 'visualDocs.spec.ts/js-demo.png' })],
          }],
          suites: [{
            title: 'deeper',
            specs: [{
              title: 'take screenshot for vue on demo',
              tests: [reportTest({ status: 'unexpected', snapshot: 'visualDocs.spec.ts/vue-demo.png', errors: ['diff'] })],
            }],
          }],
        }],
      }],
    },
  });

  assert.deepEqual(manifest.passedItems, ['visualDocs.spec.ts/js-demo.png']);
  assert.deepEqual(manifest.failedItems, ['visualDocs.spec.ts/vue-demo.png']);
  assert.deepEqual(manifest.actualItems, ['visualDocs.spec.ts/js-demo.png', 'visualDocs.spec.ts/vue-demo.png']);
});

test('an annotation pushed at runtime is read off the result too', () => {
  // Playwright records `test.info().annotations.push()` on the result and copies the last result's
  // annotations onto the test; taking the union keeps the adapter right either way.
  const manifest = manifestFromReport({
    report: report([reportTest({
      status: 'expected',
      snapshot: 'visualDocs.spec.ts/js-demo.png',
      annotateOnResult: true,
    })]),
  });

  assert.deepEqual(manifest.passedItems, ['visualDocs.spec.ts/js-demo.png']);
});

test('an empty or unreadable report yields empty buckets, and the baseline is all deleted', () => {
  // The gate blocks on this shape ("nothing was compared"), which is why the CLI refuses to write a
  // manifest at all when the report cannot be read — this is the belt to that brace.
  const manifest = manifestFromReport({ report: null, baseline: ['visualDocs.spec.ts/js-demo.png'] });

  assert.deepEqual(manifest.actualItems, []);
  assert.deepEqual(manifest.passedItems, []);
  assert.deepEqual(manifest.deletedItems, ['visualDocs.spec.ts/js-demo.png']);
});

test('every bucket is sorted and deduplicated', () => {
  const manifest = manifestFromReport({
    report: report([
      reportTest({ status: 'expected', snapshot: 'visualDocs.spec.ts/vue-demo.png' }),
      reportTest({ status: 'expected', snapshot: 'visualDocs.spec.ts/js-demo.png' }),
      reportTest({ status: 'expected', snapshot: 'visualDocs.spec.ts/js-demo.png' }),
    ]),
    baseline: ['visualDocs.spec.ts/z.png', 'visualDocs.spec.ts/a.png', 'visualDocs.spec.ts/a.png'],
  });

  assert.deepEqual(manifest.passedItems, ['visualDocs.spec.ts/js-demo.png', 'visualDocs.spec.ts/vue-demo.png']);
  assert.deepEqual(manifest.expectedItems, ['visualDocs.spec.ts/a.png', 'visualDocs.spec.ts/z.png']);
});

test('manifestFromTree makes every rendered golden its own reference', () => {
  const manifest = manifestFromTree(['b.png', 'a.png', 'a.png']);

  assert.deepEqual(manifest.passedItems, ['a.png', 'b.png']);
  assert.deepEqual(manifest.actualItems, ['a.png', 'b.png']);
  assert.deepEqual(manifest.expectedItems, ['a.png', 'b.png']);
  assert.deepEqual(manifest.failedItems, []);
  assert.deepEqual(manifest.newItems, []);
  assert.deepEqual(manifest.deletedItems, []);
  // The seed step refuses to publish an empty one: a blank manifest makes the probe return 200
  // forever and every later pull request then compares against nothing.
  assert.deepEqual(manifestFromTree([]).actualItems, []);
});

test('listPngs walks the tree, returns posix paths, and tolerates a missing directory', () => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-visual-'));

  mkdirSync(join(dir, 'visualDocs.spec.ts'), { recursive: true });
  writeFileSync(join(dir, 'visualDocs.spec.ts', 'js-demo.png'), '');
  writeFileSync(join(dir, 'visualDocs.spec.ts', 'angular-demo.png'), '');
  writeFileSync(join(dir, 'visualDocs.spec.ts', 'notes.txt'), '');

  assert.deepEqual(listPngs(dir), [
    'visualDocs.spec.ts/angular-demo.png',
    'visualDocs.spec.ts/js-demo.png',
  ]);
  assert.deepEqual(listPngs(join(dir, 'does-not-exist')), []);
});
