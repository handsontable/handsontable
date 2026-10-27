// Unit tests for the step that turns the gate's verdict into the job's result.
//
// What this pins: block mode fails the job on a regression and nowhere else; warn mode only warns;
// a missing verdict fails closed in block mode; and the accept marker counts only outside an HTML
// comment, because the pull request template documents it inside one.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCEPT_MARKER_TEMPLATE,
  describeFailure,
  enforcement,
  readAcceptMarker,
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

describe('readAcceptMarker', () => {
  test('reads the reason', () => {
    assert.deepEqual(
      readAcceptMarker('Moves sorting to a stable algorithm.\n\n[accept perf regression: stable sort costs ~10 ms]'),
      { reason: 'stable sort costs ~10 ms' }
    );
  });

  test('is case-insensitive and trims the reason', () => {
    assert.deepEqual(readAcceptMarker('[Accept Perf Regression:   intended  ]'), { reason: 'intended' });
  });

  test('ignores a marker inside an HTML comment, like the template\'s example', () => {
    assert.equal(readAcceptMarker(`<!-- write ${ACCEPT_MARKER_TEMPLATE} -->`), null);
  });

  test('needs a reason', () => {
    assert.equal(readAcceptMarker('[accept perf regression: ]'), null);
    assert.equal(readAcceptMarker('[accept perf regression]'), null);
  });

  test('tolerates no description', () => {
    assert.equal(readAcceptMarker(null), null);
    assert.equal(readAcceptMarker(undefined), null);
  });
});

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

describe('enforcement', () => {
  test('block mode fails the job on a regression, and says how to accept it', () => {
    const { exitCode, lines } = enforcement({ verdict: failing('block') });

    assert.equal(exitCode, 1);
    assert.equal(lines.length, 1);
    // `%` is the workflow command's escape character, so it travels as %25 and displays as %.
    assert.match(lines[0], /^::error title=Performance gate::Sorting \+26\.8%25 \(\+30\.0 ms\)\./);
    assert.ok(lines[0].includes(ACCEPT_MARKER_TEMPLATE));
  });

  test('warn mode only warns on a regression', () => {
    const { exitCode, lines } = enforcement({ verdict: failing('warn') });

    assert.equal(exitCode, 0);
    assert.match(lines[0], /^::warning title=Performance gate \(warn mode\)::would fail: Sorting/);
  });

  test('the accept marker in the live description passes a regression', () => {
    const { exitCode, lines } = enforcement({
      verdict: failing('block'),
      body: '[accept perf regression: stable sort]',
    });

    assert.equal(exitCode, 0);
    assert.match(lines[0], /^::notice title=Performance gate::slowdown accepted .*"stable sort".*Sorting/);
  });

  test('a commented marker does not', () => {
    const { exitCode } = enforcement({
      verdict: failing('block'),
      body: '<!-- [accept perf regression: stable sort] -->',
    });

    assert.equal(exitCode, 1);
  });

  test('a missing verdict fails closed in block mode and warns in warn mode', () => {
    assert.equal(enforcement({ verdict: null, env: { PERF_GATE_MODE: 'block' } }).exitCode, 1);

    const warn = enforcement({ verdict: null, env: {} });

    assert.equal(warn.exitCode, 0);
    assert.match(warn.lines[0], /^::warning title=Performance gate::the performance teardown wrote no verdict/);
  });

  test('passes, watches and not-assessed runs never fail, in either mode', () => {
    for (const mode of ['warn', 'block']) {
      for (const status of ['pass', 'watch', 'not-assessed']) {
        assert.equal(enforcement({ verdict: verdict({ mode, status, reason: 'x' }) }).exitCode, 0, `${mode}/${status}`);
      }
    }
  });

  test('says why a run was not assessed', () => {
    const reason = 'the pull request targets master, and the baseline is develop';
    const { lines } = enforcement({ verdict: verdict({ status: 'not-assessed', reason }) });

    assert.equal(lines[0], '::notice title=Performance gate::not assessed: the pull request targets master, and the '
      + 'baseline is develop');
  });

  test('keeps a multi-line reason in one annotation', () => {
    const { lines } = enforcement({
      verdict: failing('block'),
      body: '[accept perf regression: 100% intended,\nsee the design doc]',
    });

    assert.equal(lines.length, 1);
    assert.ok(
      lines[0].includes('100%25 intended,%0Asee the design doc'), 'a % and a newline are percent-encoded'
    );
    assert.ok(!lines[0].includes('\n'));
  });
});
