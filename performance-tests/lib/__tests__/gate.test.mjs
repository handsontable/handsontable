// Unit tests for the performance regression gate.
//
// The verdict is fed from report-builder's real assessReport, the same object the comment renders
// from, so these also pin that the assessment carries what the gate decides on (the two totals in
// ms, for the floor). Each rule gets its own case: both parts of the timing line, heap, the
// newest-golden absorption and its fail-safe without a newest golden, the run shift, and the three
// run-level reasons the gate stays out of it.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONFIRM_MAX_SCENARIOS,
  GATE_BASE_BRANCH,
  GATE_MODE,
  classifyScenario,
  confirmCandidates,
  confirmVerdict,
  decideGate,
  formatGateNotice,
  gateMode,
  isGatedRun,
  isShiftFail,
  overLine,
} from '../gate.mjs';
import { assessReport } from '../report-builder.mjs';
import { GATE_RUN_SHIFT_THRESHOLD } from '../thresholds.mjs';

const NAMES = ['sorting', 'filtering', 'cell-editing', 'undo-sort', 'scroll-left'];

/**
 * A scenario entry shaped like the teardown's: scripting set, rendering 10 and painting 2 on top.
 *
 * @param {number} scripting -- ms
 * @param {number} [heap] -- jsHeapMaxBytes
 * @returns {object}
 */
function entry(scripting, heap = 100_000_000) {
  return {
    categories: { scripting, rendering: 10, painting: 2 },
    windowSource: 'marks',
    updateCounters: { jsHeapMaxBytes: heap },
  };
}

/**
 * @param {Record<string, object>} [overrides] -- per-scenario entries
 * @returns {Record<string, object>} every scenario at 100 ms scripting (112 ms active) unless overridden
 */
function scenarios(overrides = {}) {
  return Object.fromEntries(NAMES.map(name => [name, overrides[name] ?? entry(100)]));
}

/**
 * @param {Record<string, object>} [overrides]
 * @returns {object} a median baseline snapshot
 */
function median(overrides = {}) {
  return { timestamp: '2026-10-20T00:00:00.000Z', isMedian: true, scenarios: scenarios(overrides) };
}

/**
 * Runs the gate the way the teardown does.
 *
 * @param {object} options
 * @param {Record<string, object>} [options.current] -- this run's scenario overrides
 * @param {Record<string, object> | null} [options.newest] -- the newest golden's overrides; null for none
 * @param {object} [options.baseline]
 * @param {object} [options.extra] -- passed to decideGate
 * @returns {object} the verdict
 */
function gate({ current = {}, newest = {}, baseline = median(), extra = {} } = {}) {
  const newestSnapshot = newest === null
    ? null
    : { timestamp: '2026-10-21T00:00:00.000Z', commit: 'abc1234', scenarios: scenarios(newest) };

  return decideGate({
    assessment: assessReport(scenarios(current), baseline, {}),
    newestAssessment: newestSnapshot ? assessReport(newestSnapshot.scenarios, baseline, {}) : null,
    baseline,
    newest: newestSnapshot,
    ...extra,
  });
}

/**
 * The gate over a run whose traces for one scenario are missing, as when a re-run wrote none.
 *
 * @param {string} name -- the scenario left out
 * @returns {object} the verdict
 */
function gateWithout(name) {
  const baseline = median();
  const current = scenarios();

  delete current[name];

  return decideGate({ assessment: assessReport(current, baseline, {}), baseline });
}

describe('gateMode', () => {
  test('ships in warn mode', () => {
    assert.equal(GATE_MODE, 'warn');
    assert.equal(gateMode({}), 'warn');
  });

  test('takes a named mode from PERF_GATE_MODE and ignores anything else', () => {
    assert.equal(gateMode({ PERF_GATE_MODE: 'block' }), 'block');
    assert.equal(gateMode({ PERF_GATE_MODE: 'fail' }), GATE_MODE);
  });
});

describe('isGatedRun', () => {
  test('is a compare run the composite marked for a pull request, and nothing else', () => {
    assert.equal(isGatedRun({ PERF_MODE: 'compare', PERF_GATED: '1' }), true);
    assert.equal(isGatedRun({ PERF_MODE: 'compare' }), false, 'performance-tests.yml on a pull_request');
    assert.equal(isGatedRun({ PERF_MODE: 'compare', PERF_GATED: '' }), false, 'the composite off a pull request');
    assert.equal(isGatedRun({ PERF_MODE: 'golden', PERF_GATED: '1' }), false);
    assert.equal(isGatedRun({}), false);
  });
});

describe('overLine', () => {
  const timing = (baselineMs, currentMs) => ({ scenario: 'sorting', baselineMs, currentMs, heapPct: 0 });

  test('needs both parts of the timing line', () => {
    assert.equal(overLine(timing(100, 112)).timing, true);
    assert.equal(overLine(timing(13, 14.6)).timing, false, '+12%, but only +1.6 ms');
    assert.equal(overLine(timing(1000, 1050)).timing, false, '+50 ms, but only +5%');
  });

  test('reads heap against the scenario\'s own line', () => {
    assert.equal(overLine({ scenario: 'sorting', heapPct: 6 }).heap, true);
    assert.equal(overLine({ scenario: 'scroll-left', heapPct: 6 }).heap, false);
  });

  test('a missing comparison is over nothing', () => {
    assert.deepEqual(overLine(null), { timing: false, heap: false });
  });
});

describe('classifyScenario', () => {
  const c = (currentMs, { heapPct = 0, scenario = 'sorting' } = {}) => ({
    scenario, baselineMs: 100, currentMs, timingPct: currentMs - 100, heapPct,
  });

  test('fails a slowdown develop does not show', () => {
    assert.equal(classifyScenario(c(120), c(100)), 'fail');
  });

  test('absorbs a slowdown develop already shows', () => {
    assert.equal(classifyScenario(c(120), c(120)), 'absorbed');
  });

  test('fails without a newest comparison', () => {
    assert.equal(classifyScenario(c(120), null), 'fail');
  });

  test('absorbs each metric on its own', () => {
    // Timing is develop's, heap is this run's.
    assert.equal(classifyScenario(c(120, { heapPct: 8 }), c(120)), 'fail');
  });

  test('watches above the watch line, passes below it', () => {
    assert.equal(classifyScenario(c(106), c(100)), 'watch');
    assert.equal(classifyScenario(c(104), c(100)), 'pass');
  });

  test('a speed-up passes', () => {
    assert.equal(classifyScenario(c(50), c(100)), 'pass');
  });
});

describe('isShiftFail', () => {
  const over = GATE_RUN_SHIFT_THRESHOLD + 1;

  test('fails a shift above the line that develop does not share', () => {
    assert.equal(isShiftFail(over, 0), true);
    assert.equal(isShiftFail(over, null), true);
  });

  test('does not fail a shared shift, one at the line, or none', () => {
    assert.equal(isShiftFail(over, over), false);
    assert.equal(isShiftFail(GATE_RUN_SHIFT_THRESHOLD, 0), false);
    assert.equal(isShiftFail(null, 0), false);
  });
});

describe('decideGate', () => {
  test('a quiet run passes', () => {
    const verdict = gate();

    assert.equal(verdict.status, 'pass');
    assert.equal(verdict.blocking, false);
    assert.equal(verdict.scenarioCount, NAMES.length);
    assert.deepEqual([verdict.failing, verdict.absorbed, verdict.watching, verdict.notAssessed], [[], [], [], []]);
  });

  test('fails a scenario over the line, with its delta in percent and ms', () => {
    // Active 112 -> 142 ms.
    const verdict = gate({ current: { sorting: entry(130) } });

    assert.equal(verdict.status, 'fail');
    assert.equal(verdict.failing.length, 1);

    const [sorting] = verdict.failing;

    assert.equal(sorting.name, 'sorting');
    assert.equal(sorting.deltaMs, 30);
    assert.ok(Math.abs(sorting.timingPct - 26.79) < 0.01);
    assert.equal(sorting.overTiming, true);
    assert.equal(sorting.overHeap, false);
  });

  test('blocks only in block mode', () => {
    const current = { sorting: entry(130) };

    assert.equal(gate({ current }).blocking, false);
    assert.equal(gate({ current, extra: { mode: 'block' } }).blocking, true);
    assert.equal(gate({ extra: { mode: 'block' } }).blocking, false, 'a passing run never blocks');
  });

  test('watches a slowdown under the floor on a small scenario', () => {
    // undo-sort at 1 ms scripting: active 13 -> 14.6 ms, +12.3% but only +1.6 ms.
    const verdict = gate({
      current: { 'undo-sort': entry(2.6) },
      baseline: median({ 'undo-sort': entry(1) }),
      newest: { 'undo-sort': entry(1) },
    });

    assert.equal(verdict.status, 'watch');
    assert.deepEqual(verdict.watching.map(s => s.name), ['undo-sort']);
  });

  test('fails on heap over the scenario\'s line', () => {
    const verdict = gate({ current: { sorting: entry(100, 106_000_000) } });

    assert.equal(verdict.status, 'fail');
    assert.equal(verdict.failing[0].overHeap, true);
  });

  test('records the pull request\'s base commit beside the newest golden\'s', () => {
    const verdict = gate({ extra: { baseSha: 'def5678' } });

    assert.deepEqual(
      [verdict.baseline.baseSha, verdict.baseline.newestCommit],
      ['def5678', 'abc1234']
    );
  });

  test('a level the newest develop golden already shows is watched, not failed', () => {
    const verdict = gate({ current: { sorting: entry(130) }, newest: { sorting: entry(130) } });

    assert.equal(verdict.status, 'watch');
    assert.deepEqual(verdict.absorbed.map(s => s.name), ['sorting']);
    assert.equal(verdict.baseline.newestCommit, 'abc1234');
  });

  test('fails safe without a newest develop golden', () => {
    const verdict = gate({ current: { sorting: entry(130) }, newest: null });

    assert.equal(verdict.status, 'fail');
    assert.equal(verdict.baseline.newestCommit, null);
  });

  test('fails the run when every scenario slows alike above the shift line', () => {
    // 112 -> 119 ms everywhere: +6.25%, under each scenario's own line.
    const slower = Object.fromEntries(NAMES.map(name => [name, entry(107)]));
    const verdict = gate({ current: slower });

    assert.deepEqual(verdict.failing, []);
    assert.equal(verdict.shiftFailed, true);
    assert.equal(verdict.status, 'fail');
    assert.match(verdict.reason, /every scenario ran slower/);
  });

  test('does not fail a shift the newest develop golden shares', () => {
    const slower = Object.fromEntries(NAMES.map(name => [name, entry(107)]));
    const verdict = gate({ current: slower, newest: slower });

    assert.equal(verdict.shiftFailed, false);
    assert.equal(verdict.status, 'watch');
  });

  test('is not assessed on a pull request into another branch', () => {
    const verdict = gate({ current: { sorting: entry(200) }, extra: { baseRef: 'prod-docs/18.1', mode: 'block' } });

    assert.equal(verdict.status, 'not-assessed');
    assert.equal(verdict.blocking, false);
    assert.match(verdict.reason, /targets prod-docs\/18\.1/);
    assert.deepEqual(verdict.failing, []);
  });

  test('is assessed on a pull request into develop, and off a pull request', () => {
    const current = { sorting: entry(130) };

    assert.equal(gate({ current, extra: { baseRef: GATE_BASE_BRANCH } }).status, 'fail');
    assert.equal(gate({ current, extra: { baseRef: null } }).status, 'fail');
  });

  test('is not assessed without a baseline, and says why', () => {
    const verdict = decideGate({
      assessment: assessReport(scenarios(), null, {}),
      unavailableReason: 'the develop goldens were recorded on a different environment',
    });

    assert.equal(verdict.status, 'not-assessed');
    assert.match(verdict.reason, /^no comparable develop baseline: the develop goldens/);
  });

  test('is not assessed on a self-comparison', () => {
    const self = { timestamp: '2026-10-27T00:00:00.000Z', isSelfCompare: true, scenarios: scenarios() };

    assert.equal(gate({ baseline: self }).status, 'not-assessed');
  });

  test('lists a scenario the baseline does not have as not assessed', () => {
    const baseline = median();

    delete baseline.scenarios.filtering;

    const verdict = gate({ baseline, current: { filtering: entry(500) } });

    assert.equal(verdict.status, 'pass');
    assert.deepEqual(verdict.notAssessed, [{ name: 'filtering', title: 'Filtering', reason: 'no baseline yet' }]);
  });

  test('a heap failure is not blamed on a timing level develop already shows', () => {
    // Timing +26.8% and heap +10%; develop's newest golden shares the timing level, not the heap.
    const verdict = gate({
      current: { sorting: entry(130, 110_000_000) },
      newest: { sorting: entry(130) },
    });

    assert.equal(verdict.status, 'fail');
    assert.equal(verdict.failing[0].overTiming, false);
    assert.equal(verdict.failing[0].overHeap, true);
  });

  test('lists an incomplete capture as not assessed, and still judges its heap', () => {
    const broken = entry(100, 110_000_000);

    broken.categories.painting = 0;

    const verdict = gate({ current: { sorting: broken } });

    assert.deepEqual(verdict.notAssessed.map(s => s.name), ['sorting']);
    assert.equal(verdict.status, 'fail');
    assert.equal(verdict.failing[0].overTiming, false);
    assert.equal(verdict.failing[0].overHeap, true);
  });
});

describe('formatGateNotice', () => {
  test('is one fixed-prefix line naming the listed scenarios', () => {
    const verdict = gate({ current: { sorting: entry(130), filtering: entry(107) } });

    assert.equal(
      formatGateNotice(verdict),
      '::notice title=perf-gate::status=fail mode=warn failing=sorting absorbed=- watching=filtering '
        + `shift=${verdict.shift.toFixed(1)} rerun=- cleared=- unconfirmed=-`
    );
  });

  test('prints a tiny negative shift as 0.0, never -0.0', () => {
    const notice = formatGateNotice({ ...gate(), shift: -0.036 });

    assert.match(notice, / shift=0\.0 /);
  });

  test('prints a dash for an unknown shift', () => {
    const verdict = gate({ extra: { baseRef: 'master' } });

    assert.match(formatGateNotice(verdict), /^::notice title=perf-gate::status=not-assessed .* shift=- /);
  });

  test('names what the confirm re-run re-ran and cleared', () => {
    const first = gate({ current: { sorting: entry(130), filtering: entry(130) } });
    const second = gate({ current: { sorting: entry(130) } });

    // In the assessment's order, which is alphabetical.
    assert.match(
      formatGateNotice(confirmVerdict(first, second)), / rerun=filtering,sorting cleared=filtering unconfirmed=-$/
    );
  });

  test('names a re-run scenario the second pass could not measure', () => {
    const first = gate({ current: { sorting: entry(130) } });

    assert.match(formatGateNotice(confirmVerdict(first, gateWithout('sorting'))),
      /^::notice title=perf-gate::status=fail .*failing=sorting .* cleared=- unconfirmed=sorting$/);
  });
});

describe('confirmCandidates', () => {
  const failing = count => ({ failing: NAMES.slice(0, count).map(name => ({ name })) });

  test('re-runs every failing scenario up to the cap', () => {
    assert.equal(CONFIRM_MAX_SCENARIOS, 4, 'test assumes a cap of 4');
    assert.deepEqual(confirmCandidates(failing(1)), ['sorting']);
    assert.deepEqual(confirmCandidates(failing(4)), NAMES.slice(0, 4));
  });

  test('re-runs nothing above the cap, and nothing when nothing failed', () => {
    assert.deepEqual(confirmCandidates(failing(5)), []);
    assert.deepEqual(confirmCandidates(failing(0)), []);
    assert.deepEqual(confirmCandidates(null), []);
  });

  test('does not re-run a run that failed only on its shift', () => {
    const slower = Object.fromEntries(NAMES.map(name => [name, entry(107)]));
    const verdict = gate({ current: slower });

    assert.equal(verdict.status, 'fail');
    assert.deepEqual(confirmCandidates(verdict), []);
  });
});

describe('confirmVerdict', () => {
  test('a slowdown the re-run repeats still fails', () => {
    const first = gate({ current: { sorting: entry(130) } });
    const verdict = confirmVerdict(first, gate({ current: { sorting: entry(131) } }));

    assert.equal(verdict.status, 'fail');
    assert.deepEqual(verdict.rerun, {
      scenarios: ['sorting'], confirmed: ['sorting'], cleared: [], unconfirmed: [],
    });
  });

  test('a slowdown the re-run does not repeat passes, and is listed with its first numbers', () => {
    const first = gate({ current: { sorting: entry(130) } });
    const verdict = confirmVerdict(first, gate());

    assert.equal(verdict.status, 'pass');
    assert.deepEqual(verdict.failing, []);
    assert.deepEqual(verdict.rerun.confirmed, []);
    assert.deepEqual(verdict.rerun.cleared.map(s => [s.name, s.deltaMs]), [['sorting', 30]]);
  });

  test('judges each re-run scenario on its own', () => {
    const first = gate({ current: { sorting: entry(130), filtering: entry(130) } });
    const verdict = confirmVerdict(first, gate({ current: { sorting: entry(130) } }));

    assert.equal(verdict.status, 'fail');
    assert.deepEqual(verdict.failing.map(s => s.name), ['sorting']);
    assert.deepEqual(verdict.rerun.confirmed, ['sorting']);
    assert.deepEqual(verdict.rerun.cleared.map(s => s.name), ['filtering']);
  });

  test('a re-run scenario whose second capture is incomplete stays failed, as unconfirmed', () => {
    const first = gate({ current: { sorting: entry(130) } });
    // Back at the baseline's level, but a category was missed, so the re-run judged nothing.
    const incomplete = entry(100);

    incomplete.categories.painting = 0;

    const verdict = confirmVerdict(first, gate({ current: { sorting: incomplete } }));

    assert.equal(verdict.status, 'fail');
    assert.deepEqual(verdict.failing.map(s => [s.name, s.deltaMs]), [['sorting', 30]]);
    assert.deepEqual(verdict.rerun.cleared, []);
    assert.deepEqual(verdict.rerun.unconfirmed, ['sorting']);
  });

  test('a re-run scenario that left no traces stays failed, as unconfirmed', () => {
    const first = gate({ current: { sorting: entry(130) } });
    const verdict = confirmVerdict(first, gateWithout('sorting'));

    assert.equal(verdict.status, 'fail');
    assert.deepEqual(verdict.failing.map(s => s.name), ['sorting']);
    assert.deepEqual(verdict.rerun.cleared, []);
    assert.deepEqual(verdict.rerun.unconfirmed, ['sorting']);
  });

  test('an unconfirmed failure blocks in block mode, and is listed once', () => {
    const first = gate({ current: { sorting: entry(130) }, extra: { mode: 'block' } });
    // The incomplete re-run still judges heap: +10%, which develop shares, so it is absorbed there.
    const incomplete = entry(100, 110_000_000);

    incomplete.categories.painting = 0;

    const second = gate({
      current: { sorting: incomplete }, newest: { sorting: entry(100, 110_000_000) }, extra: { mode: 'block' },
    });

    assert.deepEqual(second.absorbed.map(s => s.name), ['sorting']);

    const verdict = confirmVerdict(first, second);

    assert.equal(verdict.blocking, true);
    assert.deepEqual(verdict.failing.map(s => s.name), ['sorting']);
    assert.deepEqual(verdict.absorbed, []);
  });

  test('a run without a re-run says so', () => {
    assert.equal(gate().rerun, null);
  });
});
