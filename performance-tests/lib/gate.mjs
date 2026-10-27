// The performance regression gate: one verdict per run, decided from the same assessment the
// report renders, so the comment and the job result cannot disagree.
//
// The rules are calibrated, not chosen: scripts/replay-goldens.mjs replays them on the develop
// goldens through the same functions exported here, and the lines themselves live in
// lib/thresholds.mjs (GATE_*).

import {
  GATE_RUN_SHIFT_THRESHOLD,
  GATE_TIMING_FLOOR_MS,
  GATE_TIMING_THRESHOLD,
  WATCH_TIMING_THRESHOLD,
  heapThresholdFor,
  isOverTimingLine,
} from './thresholds.mjs';

// 'warn' reports a would-fail and keeps the job green; 'block' fails the job. The gate ships in
// 'warn' and moves to 'block' once the warn period has measured its false-fail rate on real pull
// request runs, which the develop-golden replay cannot see (a transient slowdown of the runner
// during one scenario of one PR run).
export const GATE_MODE = 'warn';
export const GATE_MODES = Object.freeze(['warn', 'block']);

// Every baseline is a median of develop goldens, so a pull request into any other branch is
// measured against code it does not contain.
export const GATE_BASE_BRANCH = 'develop';

export const GATE_VERDICT_FILE = 'verdict.json';

export const GATE_RULES = Object.freeze({
  timingThreshold: GATE_TIMING_THRESHOLD,
  floorMs: GATE_TIMING_FLOOR_MS,
  watchThreshold: WATCH_TIMING_THRESHOLD,
  shiftThreshold: GATE_RUN_SHIFT_THRESHOLD,
  heapThreshold: heapThresholdFor,
});

/**
 * The mode in force: `PERF_GATE_MODE` when it names a mode, otherwise GATE_MODE. The override is
 * for proving the gate on CI (forcing 'block' on a throwaway pull request), not for everyday use.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {'warn' | 'block'}
 */
export function gateMode(env = process.env) {
  return GATE_MODES.includes(env.PERF_GATE_MODE) ? env.PERF_GATE_MODE : GATE_MODE;
}

/**
 * Whether one comparison crosses the fail line, on timing and on heap separately.
 *
 * @param {{ scenario: string, baselineMs: number | null, currentMs: number | null,
 *   heapPct: number | null } | null | undefined} comparison
 * @param {object} [rules]
 * @returns {{ timing: boolean, heap: boolean }}
 */
export function overLine(comparison, rules = GATE_RULES) {
  if (!comparison) {
    return { timing: false, heap: false };
  }

  return {
    timing: isOverTimingLine(comparison.baselineMs, comparison.currentMs, rules.timingThreshold, rules.floorMs),
    heap: comparison.heapPct != null && comparison.heapPct > rules.heapThreshold(comparison.scenario),
  };
}

/**
 * One scenario's verdict.
 *
 * A metric over the line fails, unless the newest develop golden crosses the same line against the
 * same median: then the level came from develop (a median still catching up with a merged change,
 * or a runner change the compatibility key does not see), and the scenario is `absorbed` -- listed,
 * not failed. The known cost: a one-off spike on that newest golden would absorb a real slowdown on
 * the same scenario for one run. The replay found no golden over the line in 109, and the warn
 * period counts absorbed scenarios on their own, so that case stays visible.
 *
 * A missing newest comparison never absorbs, so a gate that lost the newest golden fails safe.
 *
 * @param {object | null} own -- this run against the median, as for overLine
 * @param {object | null} newest -- the newest develop golden against the same median
 * @param {object} [rules]
 * @returns {'fail' | 'absorbed' | 'watch' | 'pass'}
 */
export function classifyScenario(own, newest, rules = GATE_RULES) {
  const mine = overLine(own, rules);
  const develops = overLine(newest, rules);

  if ((mine.timing && !develops.timing) || (mine.heap && !develops.heap)) {
    return 'fail';
  }

  if (mine.timing || mine.heap) {
    return 'absorbed';
  }

  if (own?.timingPct != null && own.timingPct > rules.watchThreshold) {
    return 'watch';
  }

  return 'pass';
}

/**
 * Whether the run fails as a whole on its shift: every scenario slower by about the same amount
 * stays under each one's own line, so the median delta is checked on its own. Absorbed the same
 * way as a scenario when the newest develop golden shares the shift.
 *
 * @param {number | null} shift -- percent, from runShift
 * @param {number | null} newestShift -- the newest develop golden's, against the same median
 * @param {object} [rules]
 * @returns {boolean}
 */
export function isShiftFail(shift, newestShift, rules = GATE_RULES) {
  return shift != null && shift > rules.shiftThreshold
    && !(newestShift != null && newestShift > rules.shiftThreshold);
}

/**
 * @param {object} row -- an assessment row from report-builder's assessReport
 * @returns {{ scenario: string, baselineMs: number | null, currentMs: number | null,
 *   timingPct: number | null, heapPct: number | null }}
 */
function comparisonOf(row) {
  return {
    scenario: row.name,
    baselineMs: row.baselineMs ?? null,
    currentMs: row.currentMs ?? null,
    timingPct: row.totalPct ?? null,
    heapPct: row.heapPct ?? null,
  };
}

/**
 * @param {object} row
 * @param {object} rules
 * @returns {object} what the verdict file and the comment say about one listed scenario
 */
function describeScenario(row, rules) {
  const over = overLine(comparisonOf(row), rules);

  return {
    name: row.name,
    title: row.title,
    timingPct: row.totalPct ?? null,
    deltaMs: row.baselineMs != null && row.currentMs != null ? row.currentMs - row.baselineMs : null,
    heapPct: row.heapPct ?? null,
    overTiming: over.timing,
    overHeap: over.heap,
  };
}

/**
 * Decides the gate for one run.
 *
 * The whole run is `not-assessed` -- never failed -- when the pull request targets a branch other
 * than develop, or when there is no develop baseline to compare against. Within a run, a scenario
 * the report withholds (no baseline yet, a trace or version mismatch, an incomplete capture) is
 * listed as not assessed; heap still counts when only a timing category was missed.
 *
 * @param {object} input
 * @param {{ assessments: Array<object>, shift: number | null, hasGolden: boolean }} input.assessment
 *   -- this run against the baseline, from assessReport
 * @param {{ assessments: Array<object>, shift: number | null } | null} [input.newestAssessment]
 *   -- the newest develop golden against the same baseline, from assessReport
 * @param {object | null} [input.baseline] -- the baseline snapshot
 * @param {object | null} [input.newest] -- the newest develop golden behind it
 * @param {string | null} [input.baseRef] -- the pull request's base branch; empty off a pull request
 * @param {string | null} [input.unavailableReason] -- why there is no baseline, when there is none
 * @param {'warn' | 'block'} [input.mode]
 * @param {object} [input.rules]
 * @returns {object} the verdict, as written to output/verdict.json
 */
export function decideGate({
  assessment,
  newestAssessment = null,
  baseline = null,
  newest = null,
  baseRef = null,
  unavailableReason = null,
  mode = GATE_MODE,
  rules = GATE_RULES,
}) {
  const scenarios = assessment?.assessments ?? [];
  const verdict = {
    mode,
    status: 'pass',
    blocking: false,
    reason: null,
    scenarioCount: scenarios.length,
    failing: [],
    absorbed: [],
    watching: [],
    notAssessed: [],
    shift: null,
    newestShift: null,
    shiftFailed: false,
    baseline: {
      timestamp: baseline?.timestamp ?? null,
      newestTimestamp: newest?.timestamp ?? null,
      newestCommit: newest?.commit ?? null,
    },
    rules: {
      timingThreshold: rules.timingThreshold,
      floorMs: rules.floorMs,
      watchThreshold: rules.watchThreshold,
      shiftThreshold: rules.shiftThreshold,
    },
  };

  if (baseRef && baseRef !== GATE_BASE_BRANCH) {
    return {
      ...verdict,
      status: 'not-assessed',
      reason: `the pull request targets ${baseRef}, and the baseline is ${GATE_BASE_BRANCH}`,
    };
  }

  if (!assessment?.hasGolden || baseline?.isSelfCompare) {
    return {
      ...verdict,
      status: 'not-assessed',
      reason: `no comparable ${GATE_BASE_BRANCH} baseline${unavailableReason ? `: ${unavailableReason}` : ''}`,
    };
  }

  const newestRows = new Map((newestAssessment?.assessments ?? []).map(row => [row.name, row]));

  for (const row of scenarios) {
    if (!row.golden) {
      verdict.notAssessed.push({ name: row.name, title: row.title, reason: 'no baseline yet' });
      continue;
    }

    if (row.incomplete) {
      verdict.notAssessed.push({ name: row.name, title: row.title, reason: row.shortLabel });
    }

    const newestRow = newestRows.get(row.name);
    const status = classifyScenario(
      comparisonOf(row), newestRow ? comparisonOf(newestRow) : null, rules
    );

    if (status === 'fail') {
      verdict.failing.push(describeScenario(row, rules));
    } else if (status === 'absorbed') {
      verdict.absorbed.push(describeScenario(row, rules));
    } else if (status === 'watch') {
      verdict.watching.push(describeScenario(row, rules));
    }
  }

  verdict.shift = assessment.shift ?? null;
  verdict.newestShift = newestAssessment?.shift ?? null;
  verdict.shiftFailed = isShiftFail(verdict.shift, verdict.newestShift, rules);

  if (verdict.failing.length > 0 || verdict.shiftFailed) {
    verdict.status = 'fail';
  } else if (verdict.watching.length > 0 || verdict.absorbed.length > 0) {
    verdict.status = 'watch';
  }

  if (verdict.shiftFailed) {
    verdict.reason = `every scenario ran slower: the run shift is +${verdict.shift.toFixed(1)}%, above `
      + `+${rules.shiftThreshold}%. That is a slowdown shared by every scenario, or a change on the `
      + 'runner; re-run the job to tell them apart';
  }

  verdict.blocking = verdict.status === 'fail' && mode === 'block';

  return verdict;
}

/**
 * One fixed-prefix line per run, so the warn period can be counted from the job logs.
 *
 * @param {object} verdict -- from decideGate
 * @returns {string} a `::notice` workflow command
 */
export function formatGateNotice(verdict) {
  const names = list => (list.length > 0 ? list.map(item => item.name).join(',') : '-');
  const parts = [
    `status=${verdict.status}`,
    `mode=${verdict.mode}`,
    `failing=${names(verdict.failing)}`,
    `absorbed=${names(verdict.absorbed)}`,
    `watching=${names(verdict.watching)}`,
    `shift=${verdict.shift == null ? '-' : verdict.shift.toFixed(1)}`,
  ];

  return `::notice title=perf-gate::${parts.join(' ')}`;
}
