import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { selectHistoryDirs, HISTORY_FETCH_COUNT } from '../fetch-golden-history.mjs';

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');

describe('selectHistoryDirs', () => {
  test('extracts dir and timestamp name from git ls-tree output', () => {
    const output = 'performance-reports/develop/2026-08-28T06-17-50Z\n';

    assert.deepEqual(selectHistoryDirs(output), [
      { dir: 'performance-reports/develop/2026-08-28T06-17-50Z', name: '2026-08-28T06-17-50Z' },
    ]);
  });

  test('ignores non-timestamped entries (e.g. latest.json)', () => {
    const output = [
      'performance-reports/develop/latest.json',
      'performance-reports/develop/2026-08-28T06-17-50Z',
    ].join('\n');

    const result = selectHistoryDirs(output);

    assert.equal(result.length, 1);
    assert.equal(result[0].name, '2026-08-28T06-17-50Z');
  });

  test('sorts newest first', () => {
    const output = [
      'performance-reports/develop/2026-08-27T06-32-14Z',
      'performance-reports/develop/2026-08-31T11-28-19Z',
      'performance-reports/develop/2026-08-28T06-17-50Z',
    ].join('\n');

    assert.deepEqual(selectHistoryDirs(output).map(d => d.name), [
      '2026-08-31T11-28-19Z',
      '2026-08-28T06-17-50Z',
      '2026-08-27T06-32-14Z',
    ]);
  });

  test('caps at the given count', () => {
    const output = Array.from({ length: 10 }, (_, i) =>
      `performance-reports/develop/2026-08-${String(10 + i).padStart(2, '0')}T00-00-00Z`).join('\n');

    assert.equal(selectHistoryDirs(output, 3).length, 3);
  });

  test('defaults to HISTORY_FETCH_COUNT when no count is given', () => {
    const output = Array.from({ length: HISTORY_FETCH_COUNT + 5 }, (_, i) =>
      `performance-reports/develop/2026-0${1 + (i % 9)}-01T00-00-00Z`).join('\n');

    assert.equal(selectHistoryDirs(output).length, HISTORY_FETCH_COUNT);
  });

  test('returns nothing for empty or unmatched input', () => {
    assert.deepEqual(selectHistoryDirs(''), []);
    assert.deepEqual(selectHistoryDirs('performance-reports/develop/latest.json'), []);
  });
});

// The golden-restore step exists in both .github/workflows/performance-tests.yml and
// .github/actions/performance-run/action.yml. They already drift on several other
// blocks (PERF_MODE derivation, golden-deploy, PR-report-deploy) with nothing pinning
// them together; this assertion at least keeps the history-fetch call itself from
// silently forking into two copies of the fetch-count/timestamp-pattern logic again.
describe('golden-restore call sites stay on the shared script', () => {
  const CALL = 'node .github/scripts/fetch-golden-history.mjs';
  const sites = [
    '.github/workflows/performance-tests.yml',
    '.github/actions/performance-run/action.yml',
  ];

  for (const site of sites) {
    test(`${site} calls the shared fetch script`, () => {
      assert.ok(read(site).includes(CALL), `expected ${site} to call "${CALL}"`);
    });
  }
});
