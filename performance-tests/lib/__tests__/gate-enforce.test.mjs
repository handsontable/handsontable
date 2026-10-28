// Unit tests for the step that turns the gate's verdict into the job's outcome.
//
// What this pins: a regression in block mode exports `regressed` and keeps the job green, so the
// `approve` job can ask a reviewer; warn mode never asks; a missing verdict fails the job in block
// mode, which is the only non-zero exit, so an unset output always comes with a red job.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVAL_ENVIRONMENT,
  OUTCOMES,
  describeFailure,
  enforcement,
} from '../gate-enforce.mjs';

/**
 * @param {object} [overrides]
 * @returns {object} a verdict shaped like decideGate's
 */
function verdict(overrides = {}) {
  return {
    mode: 'warn',
    status: 'pass',
    blocking: false,
    reason: null,
    failing: [],
    absorbed: [],
    watching: [],
    notAssessed: [],
    shift: 0,
    shiftFailed: false,
    rerun: null,
    ...overrides,
  };
}

const SORTING = {
  name: 'sorting',
  title: 'Sorting',
  timingPct: 26.79,
  deltaMs: 30,
  heapPct: 0.4,
  overTiming: true,
  overHeap: false,
};

const failing = (mode = 'block') => verdict({ mode, status: 'fail', blocking: mode === 'block', failing: [SORTING] });

describe('describeFailure', () => {
  test('names each failing scenario with its delta', () => {
    assert.equal(describeFailure(failing()), 'Sorting +26.8% (+30.0 ms)');
  });

  test('names a heap failure and a run-shift failure', () => {
    const v = verdict({
      status: 'fail',
      failing: [{ ...SORTING, overTiming: false, overHeap: true, heapPct: 6.2 }],
      shiftFailed: true,
      reason: 'every scenario ran slower',
    });

    assert.equal(describeFailure(v), 'Sorting heap +6.2%; every scenario ran slower');
  });
});

describe('describeFailure -- what develop shares', () => {
  test('a heap failure names the heap only when develop already shows the timing', async() => {
    const { decideGate } = await import('../gate.mjs');
    const { assessReport } = await import('../report-builder.mjs');
    const at = (scripting, heap = 100_000_000) => ({
      sorting: {
        categories: { scripting, rendering: 10, painting: 2 },
        windowSource: 'marks',
        updateCounters: { jsHeapMaxBytes: heap },
      },
    });
    const baseline = { timestamp: '2026-10-20T00:00:00.000Z', scenarios: at(100) };
    const v = decideGate({
      assessment: assessReport(at(130, 110_000_000), baseline, {}),
      newestAssessment: assessReport(at(130), baseline, {}),
      baseline,
    });

    assert.equal(describeFailure(v), 'Sorting heap +10.0%');
  });
});

describe('enforcement', () => {
  test('block mode hands a regression to the approval, and keeps the job green for it', () => {
    const { outcome, exitCode, lines } = enforcement({ verdict: failing('block') });

    assert.equal(outcome, OUTCOMES.REGRESSED);
    assert.equal(outcome, 'regressed', 'performance.yml\'s approve job keys on this exact string');
    assert.equal(exitCode, 0);
    assert.equal(lines.length, 1);
    // `%` is the workflow command's escape character, so it travels as %25 and displays as %.
    assert.match(lines[0], /^::warning title=Performance gate::Sorting \+26\.8%25 \(\+30\.0 ms\)\. Waiting/);
    assert.ok(lines[0].includes(APPROVAL_ENVIRONMENT));
  });

  test('warn mode never asks for an approval', () => {
    const { outcome, exitCode, lines } = enforcement({ verdict: failing('warn') });

    assert.equal(outcome, OUTCOMES.WARNED);
    assert.equal(exitCode, 0);
    assert.match(lines[0], /^::warning title=Performance gate \(warn mode\)::would need an approval: Sorting/);
  });

  test('a missing verdict fails the job in block mode and warns in warn mode', () => {
    const block = enforcement({ verdict: null, env: { PERF_GATE_MODE: 'block' } });

    assert.deepEqual([block.outcome, block.exitCode], [OUTCOMES.MISSING, 1]);
    assert.match(block.lines[0], /^::error title=Performance gate::the performance teardown wrote no verdict/);

    const warn = enforcement({ verdict: null, env: {} });

    assert.deepEqual([warn.outcome, warn.exitCode], [OUTCOMES.MISSING, 0]);
    assert.match(warn.lines[0], /^::warning title=Performance gate::the performance teardown wrote no verdict/);
  });

  test('passes, watches and not-assessed runs never ask and never fail, in either mode', () => {
    for (const mode of ['warn', 'block']) {
      for (const [status, expected] of [
        ['pass', OUTCOMES.PASSED], ['watch', OUTCOMES.PASSED], ['not-assessed', OUTCOMES.NOT_ASSESSED],
      ]) {
        const result = enforcement({ verdict: verdict({ mode, status, reason: 'x' }) });

        assert.deepEqual([result.outcome, result.exitCode], [expected, 0], `${mode}/${status}`);
      }
    }
  });

  test('only a missing verdict in block mode exits non-zero', () => {
    const verdicts = [
      null, failing('block'), failing('warn'),
      verdict({ status: 'pass' }), verdict({ status: 'watch' }), verdict({ status: 'not-assessed', reason: 'x' }),
    ];

    for (const v of verdicts) {
      for (const env of [{}, { PERF_GATE_MODE: 'block' }]) {
        const { outcome, exitCode } = enforcement({ verdict: v, env });
        const red = v === null && env.PERF_GATE_MODE === 'block';

        assert.equal(exitCode, red ? 1 : 0, `${outcome} with ${JSON.stringify(env)}`);
      }
    }
  });

  test('says why a run was not assessed', () => {
    const reason = 'the pull request targets master, and the baseline is develop';
    const { lines } = enforcement({ verdict: verdict({ status: 'not-assessed', reason }) });

    assert.equal(lines[0], `::notice title=Performance gate::not assessed: ${reason}`);
  });

  test('keeps a multi-line reason in one annotation', () => {
    const { lines } = enforcement({
      verdict: verdict({ status: 'not-assessed', reason: '100% sure,\nsecond line' }),
    });

    assert.equal(lines.length, 1);
    assert.ok(lines[0].includes('100%25 sure,%0Asecond line'), 'a % and a newline are percent-encoded');
  });
});
