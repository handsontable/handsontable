import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalPath,
  parseLcov,
  addedLinesByFile,
  computeDiffCoverage,
  evaluate,
} from '../lib/diff-coverage.mjs';

test('canonicalPath normalizes diff, relative-lcov, and absolute-lcov shapes to one key', () => {
  assert.equal(canonicalPath('handsontable/src/helpers/number.ts'), 'src/helpers/number.ts');
  assert.equal(canonicalPath('src/helpers/number.ts'), 'src/helpers/number.ts');
  assert.equal(canonicalPath('/Users/x/handsontable/src/helpers/number.ts'), 'src/helpers/number.ts');
  assert.equal(canonicalPath('./src/helpers/number.ts'), 'src/helpers/number.ts');
});

test('parseLcov reads DA line hits per file', () => {
  const lcov = [
    'SF:src/a.ts',
    'DA:1,3',
    'DA:2,0',
    'end_of_record',
    'SF:/abs/handsontable/src/b.ts',
    'DA:10,1',
    'end_of_record',
  ].join('\n');
  const parsed = parseLcov(lcov);

  assert.equal(parsed.get('src/a.ts').get(1), 3);
  assert.equal(parsed.get('src/a.ts').get(2), 0);
  assert.equal(parsed.get('src/b.ts').get(10), 1);
});

test('addedLinesByFile tracks new-side line numbers across hunks', () => {
  const diff = [
    'diff --git a/handsontable/src/a.ts b/handsontable/src/a.ts',
    '--- a/handsontable/src/a.ts',
    '+++ b/handsontable/src/a.ts',
    '@@ -1,2 +1,4 @@',
    ' context line 1',
    '+added line 2',
    '+added line 3',
    ' context line 4',
    '@@ -10,1 +12,2 @@',
    '-removed',
    '+added line 12',
  ].join('\n');
  const added = addedLinesByFile(diff);

  assert.deepEqual([...added.get('src/a.ts')].sort((x, y) => x - y), [2, 3, 12]);
});

test('computeDiffCoverage counts only instrumented added lines; uncovered are hits=0', () => {
  const lcov = parseLcov([
    'SF:src/a.ts',
    'DA:2,5', // added line 2 — covered
    'DA:3,0', // added line 3 — instrumented but NOT covered
    'end_of_record',
  ].join('\n'));
  // line 4 is added but not in the DA map (a comment/blank) → not counted
  const added = new Map([['src/a.ts', new Set([2, 3, 4])]]);
  const summary = computeDiffCoverage(lcov, added);

  assert.equal(summary.instrumentedAdded, 2);
  assert.equal(summary.coveredAdded, 1);
  assert.equal(summary.pct, 50);
  assert.deepEqual(summary.byFile[0].uncovered, [3]);
});

test('an added file absent from lcov is not measurable (null pct → passes)', () => {
  const summary = computeDiffCoverage(parseLcov('SF:src/other.ts\nDA:1,1\nend_of_record'),
    new Map([['src/typesonly.ts', new Set([1, 2])]]));

  assert.equal(summary.pct, null);
  assert.equal(evaluate(summary, 80).pass, true);
  assert.equal(evaluate(summary, 80).reason, 'no-instrumented-added-lines');
});

test('evaluate enforces the floor on measurable coverage', () => {
  assert.equal(evaluate({ pct: 80, instrumentedAdded: 10 }, 80).pass, true);
  assert.equal(evaluate({ pct: 79.9, instrumentedAdded: 10 }, 80).pass, false);
  assert.equal(evaluate({ pct: 79.9, instrumentedAdded: 10 }, 80).reason, 'below-floor');
});
