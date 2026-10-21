// Unit tests for the explicit measurement window.
//
// The window decides which slice of a CDP trace the published numbers describe.
// Before it existed the parser auto-zoomed onto the busiest region, which for a
// page.evaluate-driven scenario can be the V8 interrupt CDP uses to enter the isolate
// (426.9 ms in a real `sorting` trace). The window then closed before the Paint and
// Commit events the action caused, so rendering and painting were published as 0 ms
// while the harness overhead was published as System.
//
// The fixtures below mirror the real event shapes, checked against a recorded trace:
// performance.mark arrives as `ph: 'I'`, `s: 't'`, `cat: 'blink.user_timing'`. Keeping
// them faithful is what lets these tests fail when the matcher or the window changes.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTrace,
  measurementWindowFromMarks,
  MEASURE_START_MARK,
  MEASURE_END_MARK,
} from '../../trace-parser.mjs';

const PID = 100;
const TID = 200;

/**
 * @param {string} name
 * @param {number} ts -- microseconds, matching the trace format
 * @param {object} [overrides]
 * @returns {object} a user-timing mark as Chrome emits it
 */
function markEvent(name, ts, overrides = {}) {
  return { name, ts, ph: 'I', s: 't', cat: 'blink.user_timing', pid: PID, tid: TID, ...overrides };
}

/**
 * @param {string} name
 * @param {number} ts -- microseconds
 * @param {number} dur -- microseconds
 * @param {object} [overrides]
 * @returns {object} a complete (ph 'X') main-thread event
 */
function durationEvent(name, ts, dur, overrides = {}) {
  return { name, ts, dur, ph: 'X', cat: 'devtools.timeline', pid: PID, tid: TID, ...overrides };
}

/**
 * Build a trace shaped like the defect this window exists to fix: a large interrupt
 * blob that the auto-zoom would settle on, and the real work plus its paint sitting
 * after it, inside the marks.
 *
 * @param {object} [options]
 * @param {boolean} [options.withMarks=true]
 * @returns {{traceEvents: Array<object>}} a parseable trace
 */
function buildTrace({ withMarks = true } = {}) {
  const events = [
    { name: 'thread_name', ph: 'M', pid: PID, tid: TID, args: { name: 'CrRendererMain' } },
    { name: 'TracingStartedInBrowser', ph: 'I', ts: 0, pid: PID, tid: TID },

    // The decoy: harness overhead, far larger than the work, and first in the trace.
    durationEvent('RunTask', 1_000, 500_000),
    durationEvent('V8.InvokeApiInterruptCallbacks', 1_100, 499_000),

    // The work the scenario actually performs, and the frame it produces.
    durationEvent('RunTask', 600_000, 100_000),
    durationEvent('FunctionCall', 600_500, 99_000),
    durationEvent('Layout', 720_000, 30_000),
    durationEvent('Paint', 760_000, 40_000),
  ];

  if (withMarks) {
    events.push(markEvent(MEASURE_START_MARK, 600_000));
    events.push(markEvent(MEASURE_END_MARK, 900_000));
  }

  return { traceEvents: events };
}

describe('measurementWindowFromMarks', () => {
  test('returns the span between the runner marks, in microseconds', () => {
    const window = measurementWindowFromMarks([
      durationEvent('RunTask', 500, 100),
      markEvent(MEASURE_START_MARK, 1000),
      durationEvent('Paint', 1500, 100),
      markEvent(MEASURE_END_MARK, 3000),
    ]);

    assert.deepEqual(window, { min: 1000, max: 3000, range: 2000 });
  });

  test('returns null when the trace carries no marks, so the caller falls back to auto-zoom', () => {
    assert.equal(measurementWindowFromMarks([durationEvent('RunTask', 500, 100)]), null);
  });

  test('returns null when only one side of the window was marked', () => {
    assert.equal(measurementWindowFromMarks([markEvent(MEASURE_START_MARK, 1000)]), null);
    assert.equal(measurementWindowFromMarks([markEvent(MEASURE_END_MARK, 1000)]), null);
  });

  test('returns null on a zero-width or inverted window rather than a bogus range', () => {
    assert.equal(measurementWindowFromMarks([
      markEvent(MEASURE_START_MARK, 1000),
      markEvent(MEASURE_END_MARK, 1000),
    ]), null);

    assert.equal(measurementWindowFromMarks([
      markEvent(MEASURE_START_MARK, 3000),
      markEvent(MEASURE_END_MARK, 1000),
    ]), null);
  });

  test('spans the outermost pair when a trace carries more than one of each mark', () => {
    const window = measurementWindowFromMarks([
      markEvent(MEASURE_START_MARK, 2000),
      markEvent(MEASURE_END_MARK, 3000),
      markEvent(MEASURE_START_MARK, 1000),
      markEvent(MEASURE_END_MARK, 4000),
    ]);

    assert.deepEqual(window, { min: 1000, max: 4000, range: 3000 });
  });

  test('matches mark names exactly, not by substring', () => {
    // Each case pairs one near-miss name with one real mark, so a substring match
    // on either side alone produces a window and fails the assertion.
    assert.equal(measurementWindowFromMarks([
      markEvent(`${MEASURE_START_MARK}-nested`, 1000),
      markEvent(MEASURE_END_MARK, 3000),
    ]), null, 'a name containing the start mark must not open the window');

    assert.equal(measurementWindowFromMarks([
      markEvent(MEASURE_START_MARK, 1000),
      markEvent(`prefixed-${MEASURE_END_MARK}`, 3000),
    ]), null, 'a name containing the end mark must not close the window');
  });

  test('ignores marks from a thread whose stats are never computed', () => {
    // An out-of-process frame carrying the same name would otherwise set bounds over
    // a thread this parse does not read, and the near-empty categories that produces
    // would be published as a real improvement.
    const foreign = { pid: PID + 1, tid: TID + 1 };
    const events = [
      markEvent(MEASURE_START_MARK, 1000, foreign),
      markEvent(MEASURE_END_MARK, 3000, foreign),
    ];

    assert.equal(measurementWindowFromMarks(events, { pid: PID, tid: TID }), null);
    assert.deepEqual(measurementWindowFromMarks(events, foreign), { min: 1000, max: 3000, range: 2000 });
  });

  test('ignores same-named events that are not user-timing marks', () => {
    // performance.measure emits ph 'b'/'e' on the same category, and other tooling can
    // emit anything at all. Only the instant user-timing mark bounds the window.
    assert.equal(measurementWindowFromMarks([
      markEvent(MEASURE_START_MARK, 1000, { ph: 'b' }),
      markEvent(MEASURE_END_MARK, 3000, { ph: 'e' }),
    ]), null);

    assert.equal(measurementWindowFromMarks([
      markEvent(MEASURE_START_MARK, 1000, { cat: 'devtools.timeline' }),
      markEvent(MEASURE_END_MARK, 3000, { cat: 'devtools.timeline' }),
    ]), null);
  });
});

describe('parseTrace window selection', () => {
  test('measures between the marks, not the busiest region of the trace', () => {
    const parsed = parseTrace(buildTrace());

    assert.equal(parsed._debug.windowSource, 'marks');
    assert.equal(parsed.rangeEnd, 300, 'window is the 300 ms between the marks');

    // The work and its frame are inside the window; the 499 ms interrupt blob is not.
    assert.ok(parsed.categories.rendering > 0, 'Layout inside the window must be scored');
    assert.ok(parsed.categories.painting > 0, 'Paint inside the window must be scored');
    assert.ok(
      parsed.categories.other < 100,
      `the interrupt blob must stay outside the window, got other=${parsed.categories.other}`
    );
  });

  test('falls back to the auto-zoomed window when a trace carries no marks, and says so', () => {
    const parsed = parseTrace(buildTrace({ withMarks: false }));

    assert.equal(parsed._debug.windowSource, 'auto-zoom');

    // This is the defect the marks exist to avoid, asserted so the fallback's cost is
    // visible: the auto-zoom lands on the interrupt blob and scores it as System.
    assert.ok(
      parsed.categories.other > 100,
      `auto-zoom is expected to absorb the interrupt blob, got other=${parsed.categories.other}`
    );
  });

  test('ignores marks belonging to another renderer and falls back instead', () => {
    // parseTrace computes every statistic for one resolved main thread. Marks from an
    // out-of-process frame must not bound a window over a thread it never reads, or the
    // near-empty categories that produces get published as a real improvement -- with
    // windowSource: 'marks' vouching for them.
    const trace = buildTrace({ withMarks: false });

    trace.traceEvents.push(markEvent(MEASURE_START_MARK, 600_000, { pid: PID + 1, tid: TID + 1 }));
    trace.traceEvents.push(markEvent(MEASURE_END_MARK, 900_000, { pid: PID + 1, tid: TID + 1 }));

    const parsed = parseTrace(trace);

    assert.equal(parsed._debug.windowSource, 'auto-zoom', 'a foreign thread must not supply the window');
  });

  test('confines UpdateCounters extrema to the measured window', () => {
    // Heap, nodes and listeners are running extrema. Unwindowed, a longer trace can only
    // push a maximum up, so work after the end mark -- the settle, a readback, teardown --
    // would inflate jsHeapMaxBytes with no timing change at all. report-builder runs that
    // number through the same regression threshold as timing.
    const trace = buildTrace();
    const counter = (ts, jsHeapSizeUsed) => ({
      name: 'UpdateCounters',
      ph: 'I',
      ts,
      pid: PID,
      tid: TID,
      cat: 'disabled-by-default-devtools.timeline',
      args: { data: { jsHeapSizeUsed, documents: 1, nodes: 10, jsEventListeners: 5 } },
    });

    trace.traceEvents.push(counter(700_000, 1_000_000));
    trace.traceEvents.push(counter(950_000, 9_000_000)); // after the end mark

    const parsed = parseTrace(trace);

    assert.equal(
      parsed.updateCounters.jsHeapMaxBytes,
      1_000_000,
      'a sample taken after the end mark must not raise the maximum'
    );
  });
});
