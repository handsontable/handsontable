import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { byteStability, collectRuns, verdictLine } from '../stability-report.mjs';

// The verdict script hands these paths to reg-cli under a different working directory, so a
// relative argument resolved lazily compared two directories that did not exist and passed on
// nothing. Absolute at the source is the fix, pinned here.
test('collectRuns resolves the directory once and sorts iterations numerically', () => {
  const dir = mkdtempSync(join(tmpdir(), 'stability-'));

  ['stability-10', 'stability-2', 'stability-1', 'diff-2', 'notes.txt'].forEach((name) => {
    mkdirSync(join(dir, name), { recursive: true });
  });

  const previous = process.cwd();

  process.chdir(dir);

  try {
    const runs = collectRuns('.');

    assert.ok(runs.every(run => isAbsolute(run)), 'every run path must be absolute');
    assert.deepEqual(runs.map(run => run.split(/[\\/]/).pop()), ['stability-1', 'stability-2', 'stability-10']);
  } finally {
    process.chdir(previous);
  }
});

test('collectRuns returns nothing for a directory download-artifact never created', () => {
  assert.deepEqual(collectRuns(join(tmpdir(), 'stability-does-not-exist')), []);
});

test('byteStability reports differing hashes and missing captures without throwing', () => {
  const runs = ['/r/stability-1', '/r/stability-2', '/r/stability-3'];
  const listPngs = () => ['a.png', 'b.png', 'c.png'];
  const hashes = {
    '/r/stability-1/a.png': 'x',
    '/r/stability-2/a.png': 'x',
    '/r/stability-3/a.png': 'x',
    '/r/stability-1/b.png': 'x',
    '/r/stability-2/b.png': 'y',
    '/r/stability-3/b.png': 'x',
    '/r/stability-1/c.png': 'x',
    '/r/stability-2/c.png': null,
    '/r/stability-3/c.png': 'x',
  };
  const { files, unstable } = byteStability(runs, file => hashes[file.replace(/\\/g, '/')], listPngs);

  assert.deepEqual(files, ['a.png', 'b.png', 'c.png']);
  assert.deepEqual(unstable, [
    { file: 'b.png', distinct: 2, missingIn: [] },
    { file: 'c.png', distinct: 1, missingIn: ['stability-2'] },
  ]);
});

test('byteStability judges the union of captures, not only the first run', () => {
  const runs = ['/r/stability-1', '/r/stability-2'];
  const listPngs = dir => (dir.endsWith('stability-2') ? ['a.png', 'late.png'] : ['a.png']);
  const hashOf = file => (file.includes('late') && file.includes('stability-1') ? null : 'x');
  const { unstable } = byteStability(runs, hashOf, listPngs);

  assert.deepEqual(unstable, [{ file: 'late.png', distinct: 1, missingIn: ['stability-1'] }]);
});

test('verdictLine fails on changed items and on pairs that could not be compared', () => {
  assert.deepEqual(verdictLine([0, 0, 0]), {
    line: '**Verdict: the gate would have passed every pair.**',
    failed: false,
  });
  assert.deepEqual(verdictLine([0, 2, 1]), {
    line: '**Verdict: the gate would have failed on 3 item(s).**',
    failed: true,
  });
  assert.equal(verdictLine([0, null]).failed, true);
  assert.match(verdictLine([0, null]).line, /could not be compared/);
  // A comparison error must never read as a pass, whatever the other pairs said.
  assert.equal(verdictLine([null]).failed, true);
});
