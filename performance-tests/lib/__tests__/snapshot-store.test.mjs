// Unit tests for golden snapshot I/O -- save/load, and the history-median load path
// added alongside computeMedianSnapshot() (median-snapshot.mjs). Runs against a fresh
// temp directory per test via the goldenDir override, never the real (gitignored)
// performance-tests/golden/ -- a developer's locally-recorded golden must survive a
// `test:tooling` run untouched.

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { rm, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveSnapshots, loadSnapshots, loadBaseline } from '../snapshot-store.mjs';

let baseDir;
let goldenPath;
let historyDir;
const originalPerfMode = process.env.PERF_MODE;

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
  baseDir = await mkdtemp(join(tmpdir(), 'perf-golden-'));
  goldenPath = join(baseDir, 'snapshots.json');
  historyDir = join(baseDir, 'history');
  delete process.env.PERF_MODE;
});

afterEach(async() => {
  await rm(baseDir, { recursive: true, force: true });

  if (originalPerfMode === undefined) {
    delete process.env.PERF_MODE;
  } else {
    process.env.PERF_MODE = originalPerfMode;
  }
});

describe('saveSnapshots / loadSnapshots (single-file path)', () => {
  test('round-trips scenario results and metadata', async() => {
    await saveSnapshots({ sorting: { categories: { scripting: 80 } } }, { commit: 'abc123' }, baseDir);

    const golden = await loadSnapshots(baseDir);

    assert.equal(golden.commit, 'abc123');
    assert.equal(golden.scenarios.sorting.categories.scripting, 80);
  });

  test('returns null when nothing has been saved', async() => {
    assert.equal(await loadSnapshots(baseDir), null);
  });

  test('returns null on a corrupt single-file golden, instead of throwing', async() => {
    await mkdir(baseDir, { recursive: true });
    await writeFile(goldenPath, '{not valid json', 'utf8');

    assert.equal(await loadSnapshots(baseDir), null);
  });
});

describe('loadSnapshots (history-median path)', () => {
  test('falls back to the single-file golden when history/ is empty', async() => {
    await mkdir(historyDir, { recursive: true });
    await writeFile(goldenPath, JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')), 'utf8');

    const golden = await loadSnapshots(baseDir);

    assert.equal(golden.isMedian, undefined);
    assert.equal(golden.scenarios.sorting.categories.scripting, 80);
  });

  test('falls back to the single-file golden when history/ has no snapshot valid for a median', async() => {
    await mkdir(historyDir, { recursive: true });
    // Only one entry: below MIN_VALID_SNAPSHOTS (2), computeMedianSnapshot() returns null.
    await writeFile(
      join(historyDir, '2026-08-28T00-00-00Z.json'),
      JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')),
      'utf8'
    );
    await writeFile(goldenPath, JSON.stringify(validSnapshot('2026-08-29T00:00:00Z')), 'utf8');

    const golden = await loadSnapshots(baseDir);

    assert.equal(golden.isMedian, undefined);
    assert.equal(golden.timestamp, '2026-08-29T00:00:00Z');
  });

  test('returns null, not a false claim of a fallback, when neither history nor a single file qualifies', async() => {
    await mkdir(historyDir, { recursive: true });
    await writeFile(
      join(historyDir, '2026-08-28T00-00-00Z.json'),
      JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')),
      'utf8'
    );
    // No snapshots.json written at all -- the CI restore step removes it on a failed fetch.

    assert.equal(await loadSnapshots(baseDir), null);
  });

  test('skips a corrupt history file and still medians the rest', async() => {
    await mkdir(historyDir, { recursive: true });
    await writeFile(join(historyDir, 'a.json'), JSON.stringify(validSnapshot('2026-08-27T00:00:00Z')), 'utf8');
    await writeFile(join(historyDir, 'b.json'), JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')), 'utf8');
    await writeFile(join(historyDir, 'c.json'), '{not valid json', 'utf8');

    const golden = await loadSnapshots(baseDir);

    assert.equal(golden.isMedian, true);
    assert.equal(golden.medianWindowSize, 2);
  });

  test('returns a real median when enough history is valid', async() => {
    await mkdir(historyDir, { recursive: true });

    const values = [10, 20, 30];

    for (const [i, scripting] of values.entries()) {
      const snapshot = validSnapshot(`2026-08-2${i}T00:00:00Z`);

      snapshot.scenarios.sorting.categories.scripting = scripting;
      await writeFile(join(historyDir, `s${i}.json`), JSON.stringify(snapshot), 'utf8');
    }

    const golden = await loadSnapshots(baseDir);

    assert.equal(golden.isMedian, true);
    assert.equal(golden.medianWindowSize, 3);
    assert.equal(golden.scenarios.sorting.categories.scripting, 20);
  });

  test('reads history/ in golden mode too, so a develop run is compared against its own trend', async() => {
    // Until 2026-09 a golden (develop-push) run ignored history/ and compared against itself, so a
    // shift on develop was invisible on develop and surfaced as a regression on the next five
    // unrelated pull requests. The snapshot that gets *saved* is still never derived from history;
    // only the report is.
    process.env.PERF_MODE = 'golden';

    await mkdir(historyDir, { recursive: true });
    await writeFile(join(historyDir, 'a.json'), JSON.stringify(validSnapshot('2026-08-27T00:00:00Z')), 'utf8');
    await writeFile(join(historyDir, 'b.json'), JSON.stringify(validSnapshot('2026-08-28T00:00:00Z')), 'utf8');
    await writeFile(goldenPath, JSON.stringify(validSnapshot('2026-08-29T00:00:00Z')), 'utf8');

    const golden = await loadSnapshots(baseDir);

    assert.equal(golden.isMedian, true);
    assert.equal(golden.medianWindowSize, 2);
  });

  test('with a compatibility key, medians only the goldens that share it', async() => {
    await mkdir(historyDir, { recursive: true });

    const keyed = (timestamp, chromium, scripting) => {
      const snapshot = validSnapshot(timestamp);

      snapshot.environment = { chromium };
      snapshot.harnessVersion = 1;
      snapshot.scenarios.sorting.categories.scripting = scripting;

      return snapshot;
    };

    await writeFile(join(historyDir, 'a.json'), JSON.stringify(keyed('2026-09-03T10:49:00Z', '140.0.1', 120)), 'utf8');
    await writeFile(join(historyDir, 'b.json'), JSON.stringify(keyed('2026-09-03T10:31:00Z', '140.0.1', 122)), 'utf8');
    await writeFile(join(historyDir, 'c.json'), JSON.stringify(keyed('2026-09-03T10:08:00Z', '138.0.1', 150)), 'utf8');
    await writeFile(join(historyDir, 'd.json'), JSON.stringify(keyed('2026-09-03T09:47:00Z', '138.0.1', 155)), 'utf8');

    const { snapshot, unavailableReason } = await loadBaseline(baseDir, {
      compatibleWith: { key: { chromium: '140.0.1', harnessVersion: 1 } },
    });

    assert.equal(unavailableReason, null);
    assert.equal(snapshot.medianWindowSize, 2);
    assert.equal(snapshot.scenarios.sorting.categories.scripting, 121);
  });

  test('refuses an incompatible single-file fallback and says why, instead of returning it', async() => {
    await mkdir(historyDir, { recursive: true });

    const old = validSnapshot('2026-09-03T10:08:00Z');

    old.environment = { chromium: '138.0.1' };
    old.harnessVersion = 1;
    await writeFile(join(historyDir, 'c.json'), JSON.stringify(old), 'utf8');
    await writeFile(goldenPath, JSON.stringify(old), 'utf8');

    const { snapshot, unavailableReason } = await loadBaseline(baseDir, {
      compatibleWith: { key: { chromium: '140.0.1', harnessVersion: 1 } },
    });

    assert.equal(snapshot, null);
    assert.ok(unavailableReason.includes('Chromium 138.0.1 -> 140.0.1'));
    assert.ok(unavailableReason.includes('two develop pushes'));
  });

  test('a single-file golden with no provenance is refused once the run has a key', async() => {
    await writeFile(goldenPath, JSON.stringify(validSnapshot('2026-08-29T00:00:00Z')), 'utf8');

    const { snapshot, unavailableReason } = await loadBaseline(baseDir, {
      compatibleWith: { key: { chromium: '140.0.1', harnessVersion: 1 } },
    });

    assert.equal(snapshot, null);
    assert.ok(unavailableReason.includes('Chromium unknown -> 140.0.1'));
  });

  test('without a key, the single-file golden is returned as before and no reason is given', async() => {
    await writeFile(goldenPath, JSON.stringify(validSnapshot('2026-08-29T00:00:00Z')), 'utf8');

    const { snapshot, unavailableReason } = await loadBaseline(baseDir);

    assert.equal(snapshot.timestamp, '2026-08-29T00:00:00Z');
    assert.equal(unavailableReason, null);
  });

  test('honors PERF_MEDIAN_WINDOW_SIZE when set', async() => {
    await mkdir(historyDir, { recursive: true });

    const values = [10, 20, 30, 40, 50];

    for (const [i, scripting] of values.entries()) {
      const snapshot = validSnapshot(`2026-08-0${i + 1}T00:00:00Z`);

      snapshot.scenarios.sorting.categories.scripting = scripting;
      await writeFile(join(historyDir, `s${i}.json`), JSON.stringify(snapshot), 'utf8');
    }

    process.env.PERF_MEDIAN_WINDOW_SIZE = '3';

    try {
      const golden = await loadSnapshots(baseDir);

      assert.equal(golden.medianWindowSize, 3);
      // Newest 3 (by timestamp): 30, 40, 50 -- median 40. Confirms the env var actually
      // narrows the window rather than being read and ignored.
      assert.equal(golden.scenarios.sorting.categories.scripting, 40);
    } finally {
      delete process.env.PERF_MEDIAN_WINDOW_SIZE;
    }
  });
});
