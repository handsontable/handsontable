// Unit tests for the explicit measurement window.
//
// The window decides which slice of a CDP trace the published numbers describe.
// Before it existed the parser auto-zoomed onto the busiest region, which for a
// page.evaluate-driven scenario is the V8 interrupt CDP uses to enter the isolate:
// the window then closed before the Paint and Commit events the action caused, so
// rendering and painting were published as 0 ms while ~420 ms of harness overhead
// was published as System.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  measurementWindowFromMarks,
  MEASURE_START_MARK,
  MEASURE_END_MARK,
} from '../../trace-parser.mjs';

/**
 * @param {string} name
 * @param {number} ts -- microseconds, matching the trace format
 * @returns {object} a trace event
 */
function markEvent(name, ts) {
  return { name, ts, ph: 'R', pid: 1, tid: 1 };
}

describe('measurementWindowFromMarks', () => {
  test('returns the span between the runner marks, in microseconds', () => {
    const window = measurementWindowFromMarks([
      markEvent('RunTask', 500),
      markEvent(MEASURE_START_MARK, 1000),
      markEvent('Paint', 1500),
      markEvent(MEASURE_END_MARK, 3000),
      markEvent('RunTask', 4000),
    ]);

    assert.deepEqual(window, { min: 1000, max: 3000, range: 2000 });
  });

  test('returns null when the trace carries no marks, so the caller falls back to auto-zoom', () => {
    assert.equal(measurementWindowFromMarks([markEvent('RunTask', 500)]), null);
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

  test('the mark names are stable -- the runner and the parser must agree on them', () => {
    // Emitted by lib/trace-runner.mjs, read back here. A rename on one side only
    // sends every scenario silently back to auto-zoom.
    assert.equal(MEASURE_START_MARK, 'hot-perf-measure-start');
    assert.equal(MEASURE_END_MARK, 'hot-perf-measure-end');
  });
});
