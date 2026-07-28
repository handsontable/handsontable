import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePr, median, summarize } from '../lib/gate-metrics.mjs';

const srcFile = { status: 'modified', filename: 'handsontable/src/core.ts', additions: 100 };
const unitFile = { status: 'added', filename: 'handsontable/src/__tests__/core.unit.js', additions: 40 };
const docFile = { status: 'modified', filename: 'docs/content/guides/foo/foo.md', additions: 10 };
const entryFile = { status: 'added', filename: '.changelogs/13200.json', additions: 5 };

test('a source PR with a test computes the ratio and passes', () => {
  const row = analyzePr({
    number: 1, title: 't', body: '', files: [srcFile, unitFile, entryFile], commitMessages: ['DEV-1: change'],
  });

  assert.equal(row.pass, true);
  assert.equal(row.verdict, 'ok');
  assert.equal(row.sourceAdded, 100);
  assert.equal(row.testAdded, 40);
  assert.equal(row.ratio, 0.4);
  assert.equal(row.changelogEntry, true);
});

test('a source PR with no test and no trailer would block', () => {
  const row = analyzePr({
    number: 2, title: 't', body: '', files: [srcFile], commitMessages: ['DEV-2: change'],
  });

  assert.equal(row.pass, false);
  assert.equal(row.verdict, 'missing-coverage');
});

test('a Refactor-only trailer converts the block into a declared pass', () => {
  const row = analyzePr({
    number: 3, title: 't', body: '', files: [srcFile], commitMessages: ['DEV-3: x\n\nRefactor-only: renames'],
  });

  assert.equal(row.pass, true);
  assert.equal(row.refactorTrailer, true);
});

test('docs-only PRs have no source signal and detect the skip marker', () => {
  const row = analyzePr({
    number: 4, title: 't', body: 'docs\n[skip changelog]', files: [docFile], commitMessages: ['docs'],
  });

  assert.equal(row.sourceFiles, 0);
  assert.equal(row.ratio, null);
  assert.equal(row.changelogSkipped, true);
});

test('median handles odd, even, and empty lists', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
});

test('summarize aggregates verdicts, escapes, and the would-block list', () => {
  const rows = [
    analyzePr({ number: 1, title: 'a', body: '', files: [srcFile, unitFile], commitMessages: [''] }),
    analyzePr({ number: 2, title: 'b', body: '', files: [srcFile], commitMessages: [''] }),
    analyzePr({ number: 3, title: 'c', body: '[skip changelog]', files: [docFile], commitMessages: [''] }),
  ];
  const s = summarize(rows);

  assert.equal(s.totalPrs, 3);
  assert.equal(s.sourcePrs, 2);
  assert.equal(s.byVerdict.ok, 2);
  assert.equal(s.byVerdict['missing-coverage'], 1);
  assert.deepEqual(s.wouldBlock.map(r => r.number), [2]);
  assert.equal(s.changelogSkips, 1);
  // The test-less source PR's 0 ratio counts — dragging the median down IS the
  // signal (median of [0.4, 0]).
  assert.equal(s.medianRatio, 0.2);
});
