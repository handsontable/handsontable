// Unit tests for the replay that calibrates the callout and gate thresholds.
//
// The replay's numbers are only worth quoting if it decides exactly what the gate decides. These
// pin the rules it replays: the fail line needs both its relative and its absolute part, a level
// the newest develop golden already shows is not this run's fault, a shift shared by every scenario
// fails the run as a whole, and the per-run count is what a gate is judged on.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArgs,
  percentile,
  replay,
  replayGate,
  scenarioNoise,
  thresholdCurve,
} from '../../scripts/replay-goldens.mjs';
import {
  GATE_RUN_SHIFT_THRESHOLD,
  GATE_TIMING_FLOOR_MS,
  GATE_TIMING_THRESHOLD,
  WATCH_TIMING_THRESHOLD,
} from '../thresholds.mjs';

const SCENARIOS = ['sorting', 'filtering', 'cell-editing', 'undo-sort', 'scroll-left'];

/**
 * A golden shaped like the ones on gh-pages, one compatibility key for all.
 *
 * @param {number} day -- day of October 2026
 * @param {Record<string, number>} [scripting] -- per-scenario scripting ms, default 100
 * @returns {{ timestamp: string, snapshot: object }}
 */
function golden(day, scripting = {}) {
  const iso = `2026-10-${String(day).padStart(2, '0')}T00:00:00.000Z`;

  return {
    timestamp: `2026-10-${String(day).padStart(2, '0')}T00-00-00Z`,
    snapshot: {
      timestamp: iso,
      harnessVersion: 2,
      environment: { chromium: '151.0.7922.34', platform: 'darwin arm64' },
      scenarios: Object.fromEntries(SCENARIOS.map(name => [name, {
        categories: { scripting: scripting[name] ?? 100, rendering: 10, painting: 2 },
        windowSource: 'marks',
        updateCounters: { jsHeapMaxBytes: 100_000_000 },
      }])),
    },
  };
}

/**
 * A replayed delta, built directly, for the gate rules.
 *
 * @param {string} run
 * @param {string} scenario
 * @param {number} timing -- percent
 * @param {object} [extra]
 * @param {number} [extra.baseMs] -- the baseline's active time
 * @param {number} [extra.heap] -- heap delta, percent
 * @param {object | null} [extra.newest] -- the newest golden's comparison
 * @returns {object}
 */
function delta(run, scenario, timing, { baseMs = 100, heap = 0, newest = null } = {}) {
  return {
    run,
    scenario,
    timing,
    timingMs: (baseMs * timing) / 100,
    baseMs,
    heap,
    newest,
  };
}

/**
 * A quiet newest-golden comparison.
 *
 * @param {number} [timing]
 * @returns {object}
 */
function quietNewest(timing = 0) {
  return { timing, timingMs: timing, baseMs: 100, heap: 0 };
}

describe('percentile', () => {
  test('is nearest-rank', () => {
    const values = Array.from({ length: 20 }, (_, i) => i + 1);

    assert.equal(percentile(values, 50), 10);
    assert.equal(percentile(values, 95), 19);
    assert.equal(percentile(values, 100), 20);
  });

  test('returns null for no values', () => {
    assert.equal(percentile([], 95), null);
  });
});

describe('thresholdCurve', () => {
  test('counts runs with any firing comparison, not only the comparisons', () => {
    const deltas = [
      delta('run-a', 'sorting', 12),
      delta('run-a', 'filtering', 11),
      delta('run-b', 'sorting', 1),
      delta('run-c', 'sorting', 2),
    ];
    const [row] = thresholdCurve(deltas, 'timing', [10]);

    assert.deepEqual(row, { threshold: 10, comparisons: 4, fired: 2, runs: 3, runsFired: 1 });
  });

  test('a floor drops a slowdown that is large in percent but small in ms', () => {
    const deltas = [
      delta('run-a', 'undo-sort', 12, { baseMs: 13 }),
      delta('run-b', 'sorting', 12, { baseMs: 100 }),
    ];

    assert.equal(thresholdCurve(deltas, 'timing', [10])[0].runsFired, 2);
    assert.equal(thresholdCurve(deltas, 'timing', [10], { floorMs: 2 })[0].runsFired, 1);
  });

  test('is one-sided: a speed-up never fires', () => {
    const [row] = thresholdCurve([delta('run-a', 'sorting', -50)], 'timing', [10]);

    assert.equal(row.fired, 0);
  });

  test('reads heap by its own key', () => {
    const [row] = thresholdCurve([delta('run-a', 'sorting', 0, { heap: 6 })], 'heap', [5]);

    assert.equal(row.fired, 1);
  });
});

describe('replayGate', () => {
  const quietRun = (run, overrides = {}) => SCENARIOS.map(name => (
    overrides[name] ?? delta(run, name, 1, { newest: quietNewest() })
  ));

  test('a quiet run passes', () => {
    const [run] = replayGate(quietRun('run-a'));

    assert.equal(run.fails, false);
    assert.deepEqual([run.failing, run.absorbed, run.watching], [[], [], []]);
  });

  test('fails a scenario above both parts of the timing line', () => {
    const [run] = replayGate(quietRun('run-a', {
      sorting: delta('run-a', 'sorting', GATE_TIMING_THRESHOLD + 2, { newest: quietNewest() }),
    }));

    assert.equal(run.fails, true);
    assert.deepEqual(run.failing.map(d => d.scenario), ['sorting']);
  });

  test('does not fail a slowdown at the line itself', () => {
    const [run] = replayGate(quietRun('run-a', {
      sorting: delta('run-a', 'sorting', GATE_TIMING_THRESHOLD, { newest: quietNewest() }),
    }));

    assert.equal(run.fails, false);
  });

  test('does not fail a small scenario whose slowdown stays under the ms floor', () => {
    // 13 ms * 12% = 1.56 ms, under the 2 ms floor.
    assert.ok((13 * 0.12) < GATE_TIMING_FLOOR_MS);

    const [run] = replayGate(quietRun('run-a', {
      'undo-sort': delta('run-a', 'undo-sort', 12, { baseMs: 13, newest: quietNewest() }),
    }));

    assert.equal(run.fails, false);
    assert.deepEqual(run.watching.map(d => d.scenario), ['undo-sort']);
  });

  test('does not blame the run for a level the newest develop golden already shows', () => {
    const [run] = replayGate(quietRun('run-a', {
      sorting: delta('run-a', 'sorting', 20, { newest: quietNewest(20) }),
    }));

    assert.equal(run.fails, false);
    assert.deepEqual(run.absorbed.map(d => d.scenario), ['sorting']);
  });

  test('fails when the newest golden has no comparison for the scenario', () => {
    const [run] = replayGate(quietRun('run-a', {
      sorting: delta('run-a', 'sorting', 20, { newest: null }),
    }));

    assert.equal(run.fails, true);
  });

  test('fails on heap above the scenario\'s own line', () => {
    const [run] = replayGate(quietRun('run-a', {
      sorting: delta('run-a', 'sorting', 0, { heap: 6, newest: quietNewest() }),
    }));

    assert.equal(run.fails, true);
  });

  test('applies the wider heap line of the horizontal scroll scenarios', () => {
    const [run] = replayGate(quietRun('run-a', {
      'scroll-left': delta('run-a', 'scroll-left', 0, { heap: 7, newest: quietNewest() }),
    }));

    assert.equal(run.fails, false);
  });

  test('lists a scenario above the watch line without failing the run', () => {
    const [run] = replayGate(quietRun('run-a', {
      filtering: delta('run-a', 'filtering', WATCH_TIMING_THRESHOLD + 1, { newest: quietNewest() }),
    }));

    assert.equal(run.fails, false);
    assert.deepEqual(run.watching.map(d => d.scenario), ['filtering']);
  });

  test('fails the run when every scenario slows alike above the run-shift line', () => {
    const slower = GATE_RUN_SHIFT_THRESHOLD + 1;
    const rows = SCENARIOS.map(name => delta('run-a', name, slower, { newest: quietNewest() }));
    const [run] = replayGate(rows);

    assert.deepEqual(run.failing, [], 'no single scenario crosses its own line');
    assert.equal(run.shiftFailed, true);
    assert.equal(run.fails, true);
  });

  test('does not fail a shift the newest develop golden shares', () => {
    const slower = GATE_RUN_SHIFT_THRESHOLD + 1;
    const rows = SCENARIOS.map(name => delta('run-a', name, slower, { newest: quietNewest(slower) }));
    const [run] = replayGate(rows);

    assert.equal(run.shiftFailed, false);
    assert.equal(run.fails, false);
  });

  test('a speed-up shift never fails', () => {
    const rows = SCENARIOS.map(name => delta('run-a', name, -20, { newest: quietNewest() }));

    assert.equal(replayGate(rows)[0].fails, false);
  });

  test('returns one entry per run', () => {
    const runs = replayGate([...quietRun('run-a'), ...quietRun('run-b')]);

    assert.deepEqual(runs.map(r => r.run), ['run-a', 'run-b']);
  });
});

describe('replay', () => {
  test('replays each golden against the median of the goldens before it', () => {
    const goldens = [1, 2, 3, 4, 5, 6].map(day => golden(day));
    const { deltas, skippedThinWindow } = replay(goldens, 5);

    assert.equal(skippedThinWindow, 4, 'runs 2-5 have fewer than five predecessors');
    assert.deepEqual([...new Set(deltas.map(d => d.run))], ['2026-10-06T00-00-00Z']);
    assert.equal(deltas.length, SCENARIOS.length);

    const sorting = deltas.find(d => d.scenario === 'sorting');

    assert.equal(sorting.timing, 0);
    assert.equal(sorting.baseMs, 112);
    assert.equal(sorting.timingMs, 0);
    assert.deepEqual(sorting.newest, { timing: 0, timingMs: 0, baseMs: 112, heap: 0 });
  });

  test('end to end: the gate fails the first golden at a new level, then absorbs the next', () => {
    const quiet = [1, 2, 3, 4, 5].map(day => golden(day));
    // Sorting's scripting 100 -> 130 ms: active 112 -> 142, +26.8%.
    const goldens = [...quiet, golden(6, { sorting: 130 }), golden(7, { sorting: 130 })];
    const runs = replayGate(replay(goldens, 5).deltas);
    const [first, second] = runs;

    assert.equal(first.fails, true);
    assert.deepEqual(first.failing.map(d => d.scenario), ['sorting']);
    assert.ok(Math.abs(first.failing[0].timing - 26.79) < 0.01);

    // Run 7's median (runs 2-6) is still at the old level, but the newest golden in it (run 6)
    // already shows the new one: the slowdown came from develop, not from run 7.
    assert.equal(second.fails, false);
    assert.deepEqual(second.absorbed.map(d => d.scenario), ['sorting']);
  });

  test('skips a comparison the reports would refuse to publish', () => {
    const goldens = [1, 2, 3, 4, 5].map(day => golden(day));
    const broken = golden(6);

    broken.snapshot.scenarios.sorting.categories.painting = 0;

    const { deltas, skippedIncomparable } = replay([...goldens, broken], 5);

    assert.equal(skippedIncomparable, 1);
    assert.equal(deltas.some(d => d.scenario === 'sorting'), false);
  });
});

describe('parseArgs', () => {
  test('defaults the floor to the gate\'s', () => {
    assert.equal(parseArgs([]).floorMs, GATE_TIMING_FLOOR_MS);
  });

  test('takes --floor-ms, including zero', () => {
    assert.equal(parseArgs(['--floor-ms', '5']).floorMs, 5);
    assert.equal(parseArgs(['--floor-ms', '0']).floorMs, 0);
  });

  test('rejects a negative or non-numeric floor', () => {
    assert.throws(() => parseArgs(['--floor-ms', '-1']), /--floor-ms/);
    assert.throws(() => parseArgs(['--floor-ms', 'abc']), /--floor-ms/);
  });
});

describe('scenarioNoise', () => {
  test('reports |delta| percentiles and the baseline level per scenario', () => {
    const deltas = [
      delta('run-a', 'sorting', 2, { baseMs: 40 }),
      delta('run-b', 'sorting', -4, { baseMs: 44 }),
      delta('run-c', 'sorting', 1, { baseMs: 42 }),
    ];
    const [row] = scenarioNoise(deltas);

    assert.deepEqual(row, { scenario: 'sorting', n: 3, baseMs: 42, p95: 4, max: 4 });
  });
});
