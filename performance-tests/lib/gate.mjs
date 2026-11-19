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

// The confirm re-run. A scenario that fails is run once more on its own before the verdict stands,
// and it fails only when the second run fails too: the self-hosted runner has short slow spells
// that move one scenario and nothing else (PR #13917, Scroll Down +21.4% at a run-to-run spread of
// 0.6% and a run shift of +0.2%), and no replay of the develop goldens can see them. The cap keeps
// the job's worst case bounded; a run with more failing scenarios than this is not one slow spell,
// and its verdict stands. A run-shift failure is not re-run: it is already a median across every
// scenario, which one slow spell does not move. The re-run does not recompute it either
// (confirmVerdict): the second pass's rows mix two runs, and their median says nothing about either.
export const CONFIRM_MAX_SCENARIOS = 4;
// The first pass's verdict and traces, kept beside the confirmed ones for the artifact.
export const GATE_FIRST_PASS_FILE = 'verdict-first-pass.json';
export const GATE_FIRST_PASS_DIR = 'first-pass';

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
 * Whether this run is one the gate acts on: a compare run the performance-run composite started for
 * a pull request, the only path with the enforce step and the `approve` job behind it. It turns on
 * the confirm re-run and the comment's gate text. performance-tests.yml also compares on one
 * pull_request path, but it has neither, nor the re-run's time budget, so it never sets PERF_GATED.
 *
 * @param {Record<string, string | undefined>} [env]
 * @returns {boolean}
 */
export function isGatedRun(env = process.env) {
  return env.PERF_MODE === 'compare' && env.PERF_GATED === '1';
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
 * @param {object | null} [failedAgainst] -- a failing scenario's newest develop comparison: a metric
 *   develop is over the line on too did not fail it, so it is not flagged. Omitted for the other
 *   lists, where `overTiming`/`overHeap` say which metric is over the line.
 * @returns {object} what the verdict file and the comment say about one listed scenario
 */
function describeScenario(row, rules, failedAgainst = null) {
  const over = overLine(comparisonOf(row), rules);
  const shared = overLine(failedAgainst, rules);

  return {
    name: row.name,
    title: row.title,
    timingPct: row.totalPct ?? null,
    deltaMs: row.baselineMs != null && row.currentMs != null ? row.currentMs - row.baselineMs : null,
    heapPct: row.heapPct ?? null,
    overTiming: over.timing && !shared.timing,
    overHeap: over.heap && !shared.heap,
  };
}

/**
 * @param {{ failing: Array<object>, absorbed: Array<object>, watching: Array<object>,
 *   shiftFailed: boolean }} verdict
 * @returns {'fail' | 'watch' | 'pass'}
 */
function statusOf(verdict) {
  if (verdict.failing.length > 0 || verdict.shiftFailed) {
    return 'fail';
  }

  return verdict.watching.length > 0 || verdict.absorbed.length > 0 ? 'watch' : 'pass';
}

/**
 * Decides the gate for one run.
 *
 * The whole run is `not-assessed` -- never failed -- when the pull request targets a branch other
 * than develop, when there is no develop baseline to compare against, or when the report withholds
 * every scenario. Within a run, a scenario
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
 * @param {string | null} [input.baseSha] -- the pull request's base commit, recorded beside the
 *   newest golden's commit so a would-fail can be checked for a baseline that lags develop
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
  baseSha = null,
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
    // Every scenario judged on complete data. The confirm re-run clears a scenario only from here:
    // one its second pass could not judge, or never saw, is not cleared (confirmVerdict).
    judged: [],
    shift: null,
    newestShift: null,
    shiftFailed: false,
    // Set by confirmVerdict when failing scenarios were re-run.
    rerun: null,
    baseline: {
      timestamp: baseline?.timestamp ?? null,
      newestTimestamp: newest?.timestamp ?? null,
      newestCommit: newest?.commit ?? null,
      baseSha,
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
    } else {
      verdict.judged.push(row.name);
    }

    const newestRow = newestRows.get(row.name);
    const newestComparison = newestRow ? comparisonOf(newestRow) : null;
    const status = classifyScenario(comparisonOf(row), newestComparison, rules);

    if (status === 'fail') {
      verdict.failing.push(describeScenario(row, rules, newestComparison));
    } else if (status === 'absorbed') {
      verdict.absorbed.push(describeScenario(row, rules));
    } else if (status === 'watch') {
      verdict.watching.push(describeScenario(row, rules));
    }
  }

  verdict.shift = assessment.shift ?? null;
  verdict.newestShift = newestAssessment?.shift ?? null;
  verdict.shiftFailed = isShiftFail(verdict.shift, verdict.newestShift, rules);

  verdict.status = statusOf(verdict);

  // A baseline in hand but no scenario judged: "pass" would claim a comparison nothing made. A
  // failure still stands, because an incomplete capture's heap is judged.
  if (verdict.status !== 'fail' && verdict.judged.length === 0) {
    verdict.status = 'not-assessed';
    verdict.reason = `no scenario could be compared with the ${GATE_BASE_BRANCH} baseline`;
  }

  // A median, so some scenarios can have run faster: this must not say that every one ran slower.
  if (verdict.shiftFailed) {
    verdict.reason = `the run shift of +${verdict.shift.toFixed(1)}% is above the `
      + `+${rules.shiftThreshold}% line. That is a slowdown most scenarios share, or a change on the `
      + 'runner; re-run the job to tell them apart';
  }

  verdict.blocking = verdict.status === 'fail' && mode === 'block';

  return verdict;
}

/**
 * The scenarios to re-run before a verdict stands: every failing one, unless there are more than
 * the cap, in which case none (see CONFIRM_MAX_SCENARIOS).
 *
 * @param {object | null | undefined} verdict -- from decideGate
 * @param {number} [max]
 * @returns {string[]} scenario names, in the verdict's order
 */
export function confirmCandidates(verdict, max = CONFIRM_MAX_SCENARIOS) {
  const names = (verdict?.failing ?? []).map(scenario => scenario.name);

  return names.length <= max ? names : [];
}

/**
 * The verdict after the re-run. The second pass judges every scenario on the data it holds -- the
 * re-run traces for the scenarios that were re-run, the first pass's for the rest -- so a scenario
 * fails when it failed both times. A scenario the re-run cleared is listed with the first pass's
 * numbers, which is what a reader of the warn period needs to tell a slow spell from noise.
 *
 * Cleared means measured again and found under the line. A re-run scenario the second pass could
 * not judge -- an incomplete capture, or no traces at all -- keeps its first-pass failure as
 * `unconfirmed`: the gate never passes what it could not see.
 *
 * The run's shift stays the first pass's, the one median over rows measured together. Recomputed
 * here it would mix re-run rows with first-pass rows, so re-running up to four scenarios could clear
 * a shift failure or invent one.
 *
 * @param {object} firstPass -- the verdict that chose the scenarios to re-run
 * @param {object} secondPass -- the verdict decided over the re-run data
 * @returns {object} the second pass, with `rerun` set
 */
export function confirmVerdict(firstPass, secondPass) {
  const scenarios = confirmCandidates(firstPass);
  const stillFailing = new Set(secondPass.failing.map(scenario => scenario.name));
  const judged = new Set(secondPass.judged ?? []);
  const rerunFailures = firstPass.failing.filter(scenario => scenarios.includes(scenario.name)
    && !stillFailing.has(scenario.name));
  const unconfirmed = rerunFailures.filter(scenario => !judged.has(scenario.name));
  const kept = new Set(unconfirmed.map(scenario => scenario.name));
  const verdict = {
    ...secondPass,
    shift: firstPass.shift,
    newestShift: firstPass.newestShift,
    shiftFailed: firstPass.shiftFailed,
    reason: firstPass.reason,
    failing: [...secondPass.failing, ...unconfirmed],
    // Listed once, as failing: a heap the incomplete re-run still judged can have put it here too.
    absorbed: secondPass.absorbed.filter(scenario => !kept.has(scenario.name)),
    watching: secondPass.watching.filter(scenario => !kept.has(scenario.name)),
    rerun: {
      scenarios,
      confirmed: scenarios.filter(name => stillFailing.has(name)),
      cleared: rerunFailures.filter(scenario => judged.has(scenario.name)),
      unconfirmed: unconfirmed.map(scenario => scenario.name),
    },
  };

  verdict.status = statusOf(verdict);
  verdict.blocking = verdict.status === 'fail' && verdict.mode === 'block';

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
  // `+ 0` turns a -0 left by rounding a tiny negative shift into 0, so it never prints as "-0.0".
  const shift = value => (Number(value.toFixed(1)) + 0).toFixed(1);
  const parts = [
    `status=${verdict.status}`,
    `mode=${verdict.mode}`,
    `failing=${names(verdict.failing)}`,
    `absorbed=${names(verdict.absorbed)}`,
    `watching=${names(verdict.watching)}`,
    `shift=${verdict.shift == null ? '-' : shift(verdict.shift)}`,
    `rerun=${verdict.rerun?.scenarios.length ? verdict.rerun.scenarios.join(',') : '-'}`,
    `cleared=${names(verdict.rerun?.cleared ?? [])}`,
    `unconfirmed=${verdict.rerun?.unconfirmed?.length ? verdict.rerun.unconfirmed.join(',') : '-'}`,
  ];

  return `::notice title=perf-gate::${parts.join(' ')}`;
}
