// The one writer and reader for the per-scenario sidecar files (hook-timing.json, heap-after-gc.json).

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSidecar, writeSidecar } from '../sidecar.mjs';

describe('writeSidecar / readSidecar', () => {
  test('round-trips a document, creating the directory on the way', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'perf-sidecar-'));

    try {
      const nested = join(dir, 'scenario');

      await writeSidecar(nested, 'thing.json', { a: 1, values: [1, null] });

      assert.deepEqual(await readSidecar(nested, 'thing.json'), { a: 1, values: [1, null] });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('reads null, not an error, for a sidecar that was never written', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'perf-sidecar-'));

    try {
      assert.equal(await readSidecar(dir, 'missing.json'), null);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
