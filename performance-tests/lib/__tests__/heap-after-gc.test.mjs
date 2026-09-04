// Unit tests for the live-heap reading the runner takes after each end mark.
//
// The gate today is jsHeapMaxBytes, the highest sample inside the window, which on the scroll
// scenarios tracks where V8 scheduled a GC rather than what the grid retains. The post-GC reading is
// meant to replace it once enough goldens carry it. These cases pin the summary shape the teardown
// folds into updateCounters, and that a scenario with no successful readback writes nothing -- so it
// looks like one recorded before the field existed rather than one that measured zero.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rm, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HEAP_AFTER_GC_FILE, saveHeapAfterGc, summarizeHeapAfterGc } from '../heap-after-gc.mjs';

describe('summarizeHeapAfterGc', () => {
  test('averages the finite readings and keeps every per-iteration value, nulls included', () => {
    const summary = summarizeHeapAfterGc([100, null, 200]);

    assert.equal(summary.averageBytes, 150);
    assert.deepEqual(summary.values, [100, null, 200]);
  });

  test('has no average when nothing was read', () => {
    assert.equal(summarizeHeapAfterGc([null, null]).averageBytes, null);
    assert.equal(summarizeHeapAfterGc([]).averageBytes, null);
    assert.equal(summarizeHeapAfterGc(undefined).averageBytes, null);
  });

  test('does not share the caller\'s array', () => {
    const values = [1, 2];
    const summary = summarizeHeapAfterGc(values);

    values.push(3);
    assert.deepEqual(summary.values, [1, 2]);
  });
});

describe('saveHeapAfterGc', () => {
  test('writes the summary beside the traces', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'perf-heap-'));

    try {
      await saveHeapAfterGc(dir, [3_000_000, 3_500_000]);

      const saved = JSON.parse(await readFile(join(dir, HEAP_AFTER_GC_FILE), 'utf8'));

      assert.equal(saved.averageBytes, 3_250_000);
      assert.deepEqual(saved.values, [3_000_000, 3_500_000]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('writes nothing when every readback failed', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'perf-heap-'));

    try {
      await saveHeapAfterGc(dir, [null, null, null]);

      assert.deepEqual(await readdir(dir), []);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
