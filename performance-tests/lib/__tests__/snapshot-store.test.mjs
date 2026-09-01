// Unit tests for golden snapshot I/O -- save/load, and the history-median load path
// added alongside computeMedianSnapshot() (median-snapshot.mjs). Runs against the
// module's real (gitignored) performance-tests/golden/ directory, cleaned before and
// after each test: the module has no path injection, and that directory is never
// committed, so this is the same location the CI restore step and a real golden-mode
// run would use.

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { saveSnapshots, loadSnapshots } from '../snapshot-store.mjs';

const GOLDEN_DIR = join(import.meta.dirname, '..', '..', 'golden');
const GOLDEN_PATH = join(GOLDEN_DIR, 'snapshots.json');
const HISTORY_DIR = join(GOLDEN_DIR, 'history');

/**
 * @param {string} timestamp -- ISO string
 * @returns {object} a minimal snapshot valid for computeMedianSnapshot
 */
function validSnapshot(timestamp) {
  return {
    timestamp,
    scenarios: {
      sorting: {
        categories: { scripting: 80 },
        windowSource: 'marks',
      },
    },
  };
}

beforeEach(async() => {
  await rm(GOLDEN_DIR, { recursive: true, force: true });
});

afterEach(async() => {
  await rm(GOLDEN_DIR, { recursive: true, force: true });
});

describe('saveSnapshots / loadSnapshots (single-file path)', () => {
  test('round-trips scenario results and metadata', async() => {
    await saveSnapshots({ sorting: { categories: { scripting: 80 } } }, { commit: 'abc123' });

    const golden = await loadSnapshots();

    assert.equal(golden.commit, 'abc123');
    assert.equal(golden.scenarios.sorting.categories.scripting, 80);
  });

  test('returns null when nothing has been saved', async() => {
    assert.equal(await loadSnapshots(), null);
  });

  test('returns null on a corrupt single-file golden, instead of throwing', async() => {
    await mkdir(GOLDEN_DIR, { recursive: true });
    await writeFile(GOLDEN_PATH, '{not valid json', 'utf8');

    assert.equal(await loadSnapshots(), null);
  });
});

describe('loadSnapshots (history-median path)', () => {
  test('falls back to the single-file golden when history/ is empty', async() => {
    await mkdir(HISTORY_DIR, { recursive: true });
    await writeFile(GOLDEN_PATH, JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')), 'utf8');

    const golden = await loadSnapshots();

    assert.equal(golden.isMedian, undefined);
    assert.equal(golden.scenarios.sorting.categories.scripting, 80);
  });

  test('falls back to the single-file golden when history/ has no snapshot valid for a median', async() => {
    await mkdir(HISTORY_DIR, { recursive: true });
    // Only one entry: below MIN_VALID_SNAPSHOTS (2), computeMedianSnapshot() returns null.
    await writeFile(
      join(HISTORY_DIR, '2026-08-28T00-00-00Z.json'),
      JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')),
      'utf8'
    );
    await writeFile(GOLDEN_PATH, JSON.stringify(validSnapshot('2026-08-29T00:00:00Z')), 'utf8');

    const golden = await loadSnapshots();

    assert.equal(golden.isMedian, undefined);
    assert.equal(golden.timestamp, '2026-08-29T00:00:00Z');
  });

  test('skips a corrupt history file and still medians the rest', async() => {
    await mkdir(HISTORY_DIR, { recursive: true });
    await writeFile(join(HISTORY_DIR, 'a.json'), JSON.stringify(validSnapshot('2026-08-27T00:00:00Z')), 'utf8');
    await writeFile(join(HISTORY_DIR, 'b.json'), JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')), 'utf8');
    await writeFile(join(HISTORY_DIR, 'c.json'), '{not valid json', 'utf8');

    const golden = await loadSnapshots();

    assert.equal(golden.isMedian, true);
    assert.equal(golden.medianWindowSize, 2);
  });

  test('returns a real median when enough history is valid', async() => {
    await mkdir(HISTORY_DIR, { recursive: true });

    const values = [10, 20, 30];

    for (const [i, scripting] of values.entries()) {
      const snapshot = validSnapshot(`2026-08-2${i}T00:00:00Z`);

      snapshot.scenarios.sorting.categories.scripting = scripting;
      await writeFile(join(HISTORY_DIR, `s${i}.json`), JSON.stringify(snapshot), 'utf8');
    }

    const golden = await loadSnapshots();

    assert.equal(golden.isMedian, true);
    assert.equal(golden.medianWindowSize, 3);
    assert.equal(golden.scenarios.sorting.categories.scripting, 20);
  });
});
