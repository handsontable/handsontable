// Unit tests for the shared threshold/formatting layer behind both report builders.
//
// Three invariants are worth pinning here, because each one was a published-wrong-number bug.
// sumActiveComparable() refuses to compare a total against a baseline that never captured one of
// its categories -- the filed defect, where ~4 ms of real work divided against a baseline of zero
// was published as "+115.7% regression". classifyChange() bands on the callout threshold rather
// than a separate hardcoded number, so the HTML report cannot paint a row red at a percentage the
// markdown comment reports as within tolerance. And calcCv() uses the sample standard deviation,
// which at the three iterations the suite actually runs reads meaningfully wider than the
// population form it replaced.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  REGRESSION_CALLOUT_THRESHOLD_TIMING,
  REGRESSION_CALLOUT_THRESHOLD_HEAP,
  CV_WARNING_THRESHOLD,
  BASELINE_INCOMPLETE_LABEL,
  ACTIVE_CATEGORIES,
  activeTotalsPerIteration,
  calcCv,
  comparability,
  classifyChange,
  fmtCv,
  fmtCvValue,
  fmtPct,
  fmtPctWithEmoji,
  pctChange,
  sumActive,
  sumActiveComparable,
} from '../thresholds.mjs';

describe('thresholds -- callout constants', () => {
  test('timing and heap are separate numbers', () => {
    // Heap's run-to-run spread is an order of magnitude tighter than timing's, so a shared
    // constant either drowns the comment in timing noise or goes blind to heap leaks.
    assert.notEqual(REGRESSION_CALLOUT_THRESHOLD_TIMING, REGRESSION_CALLOUT_THRESHOLD_HEAP);
    assert.ok(REGRESSION_CALLOUT_THRESHOLD_HEAP < REGRESSION_CALLOUT_THRESHOLD_TIMING);
  });

  test('active categories are scripting, rendering and painting only', () => {
    assert.deepEqual(ACTIVE_CATEGORIES, ['scripting', 'rendering', 'painting']);
  });
});

describe('sumActive', () => {
  test('adds the three active categories and ignores the rest', () => {
    assert.equal(
      sumActive({ scripting: 10, rendering: 5, painting: 2, idle: 900, other: 400, loading: 7 }),
      17
    );
  });

  test('treats a missing category as zero', () => {
    assert.equal(sumActive({ scripting: 10 }), 10);
  });
});

describe('sumActiveComparable', () => {
  test('reports comparable when both sides captured every active category', () => {
    const result = sumActiveComparable(
      { scripting: 20, rendering: 3, painting: 1 },
      { scripting: 25, rendering: 4, painting: 1 }
    );

    assert.equal(result.comparable, true);
    assert.deepEqual(result.incompleteCategories, []);
    assert.equal(result.baseline, 24);
    assert.equal(result.current, 30);
  });

  test('refuses the comparison when the baseline missed a category the current run recorded', () => {
    // The exact shape from the filed report: the golden captured no rendering and no painting.
    const result = sumActiveComparable(
      { scripting: 20.20, rendering: 0, painting: 0 },
      { scripting: 39.62, rendering: 3.25, painting: 0.69 }
    );

    assert.equal(result.comparable, false);
    assert.deepEqual(result.incompleteCategories, ['rendering', 'painting']);
  });

  test('a category absent from the baseline object counts the same as an explicit zero', () => {
    const result = sumActiveComparable(
      { scripting: 20 },
      { scripting: 25, painting: 2 }
    );

    assert.equal(result.comparable, false);
    assert.deepEqual(result.incompleteCategories, ['painting']);
  });

  test('stays comparable when both sides are zero for a category', () => {
    // A genuinely free category is not a failed capture: nothing was measured on either side.
    const result = sumActiveComparable(
      { scripting: 20, rendering: 0, painting: 0 },
      { scripting: 25, rendering: 0, painting: 0 }
    );

    assert.equal(result.comparable, true);
    assert.deepEqual(result.incompleteCategories, []);
  });

  test('refuses the comparison when the current run missed a category the baseline recorded', () => {
    // The mirror of the filed defect, and equally unsupportable. Publishing it would report a
    // capture failure as a -23% improvement, which a reader cannot tell from a real one. On these
    // scenarios a genuine 0 ms of rendering or painting does not occur.
    const result = sumActiveComparable(
      { scripting: 20, rendering: 5, painting: 1 },
      { scripting: 20, rendering: 0, painting: 0 }
    );

    assert.equal(result.comparable, false);
    assert.equal(result.incompleteSide, 'current');
    assert.deepEqual(result.incompleteCategories, ['rendering', 'painting']);
  });

  test('names which side failed, so a maintainer knows whether to re-run develop', () => {
    const baselineSide = sumActiveComparable(
      { scripting: 20, rendering: 0, painting: 1 },
      { scripting: 20, rendering: 5, painting: 1 }
    );

    assert.equal(baselineSide.incompleteSide, 'baseline');
    assert.equal(sumActiveComparable({ scripting: 1 }, { scripting: 1 }).incompleteSide, null);
  });
});

describe('comparability', () => {
  const complete = { scripting: 20, rendering: 5, painting: 1 };

  test('a window mismatch is incomparable regardless of the categories', () => {
    const verdict = comparability(complete, complete, true);

    assert.equal(verdict.comparable, false);
    assert.equal(verdict.reason, 'window-mismatch');
    assert.equal(verdict.shortLabel, 'window mismatch');
  });

  test('a window mismatch exempts no category, since nothing from the trace is comparable', () => {
    assert.deepEqual(comparability(complete, complete, true).incompleteCategories, ACTIVE_CATEGORIES);
  });

  test('only the uncaptured categories are marked incomparable', () => {
    // The captured categories still describe the same quantity on both sides, so withholding them
    // too would hide usable data behind one failed capture.
    const verdict = comparability(complete, { scripting: 20, rendering: 0, painting: 1 }, false);

    assert.deepEqual(verdict.incompleteCategories, ['rendering']);
  });

  test('a current-side failure is labelled as this run, not as the baseline', () => {
    // "baseline incomplete" on a run whose own capture failed sends a maintainer to re-run develop
    // for nothing.
    const verdict = comparability(complete, { scripting: 20, rendering: 0, painting: 0 }, false);

    assert.equal(verdict.reason, 'current-incomplete');
    assert.equal(verdict.shortLabel, 'capture incomplete');
    assert.ok(verdict.label.includes('this run'));
    assert.ok(!verdict.label.includes('baseline'));
  });

  test('when both sides missed a category, each is named against its own side', () => {
    // The union attributed to one side named a category the other side had actually recorded.
    const verdict = comparability(
      { scripting: 20, rendering: 0, painting: 1 },
      { scripting: 20, rendering: 5, painting: 0 },
      false
    );

    assert.equal(verdict.reason, 'both-incomplete');
    assert.ok(verdict.label.includes('baseline captured no rendering'));
    assert.ok(verdict.label.includes('this run captured no painting'));
  });

  test('tolerates null category objects', () => {
    assert.equal(comparability(null, null, false).comparable, true);
    assert.equal(comparability(undefined, { scripting: 5 }, false).comparable, false);
  });

  test('two complete sides over the same window are comparable', () => {
    const verdict = comparability(complete, complete, false);

    assert.equal(verdict.comparable, true);
    assert.equal(verdict.label, null);
  });

  test('names the missing categories in the label', () => {
    const verdict = comparability(
      { scripting: 20, rendering: 0, painting: 0 }, complete, false
    );

    assert.equal(verdict.comparable, false);
    assert.ok(verdict.label.includes('baseline'));
    assert.ok(verdict.label.includes('rendering'));
    assert.ok(verdict.label.includes('painting'));
  });

  test('attributes a current-side failure to this run, not to the baseline', () => {
    const verdict = comparability(
      complete, { scripting: 20, rendering: 0, painting: 0 }, false
    );

    assert.equal(verdict.comparable, false);
    assert.ok(verdict.label.includes('this run'));
  });

  test('tolerates null category objects', () => {
    assert.equal(sumActiveComparable(null, null).comparable, true);
    assert.equal(sumActiveComparable(undefined, { scripting: 5 }).comparable, false);
  });
});

describe('pctChange', () => {
  test('returns null rather than dividing by a zero baseline', () => {
    assert.equal(pctChange(0, 42), null);
  });

  test('returns null when either side is missing', () => {
    assert.equal(pctChange(null, 42), null);
    assert.equal(pctChange(42, null), null);
  });

  test('computes a percentage', () => {
    assert.equal(pctChange(100, 125), 25);
    assert.equal(pctChange(100, 80), -20);
  });
});

describe('classifyChange', () => {
  test('bands on the timing callout threshold by default', () => {
    const justUnder = classifyChange(REGRESSION_CALLOUT_THRESHOLD_TIMING - 0.1);
    const justOver = classifyChange(REGRESSION_CALLOUT_THRESHOLD_TIMING + 0.1);

    assert.equal(justUnder.status, 'neutral-up');
    assert.equal(justOver.status, 'regression');
  });

  test('a percentage the comment would not call out is never painted as a regression', () => {
    // The bug this guards: the bands sat at +/-10 while the callout fired at a different number,
    // so the HTML report and the markdown comment disagreed about the same scenario.
    assert.notEqual(classifyChange(REGRESSION_CALLOUT_THRESHOLD_TIMING).status, 'regression');
  });

  test('honours an explicit threshold, so heap rows band on the heap number', () => {
    const pct = 8;

    assert.equal(classifyChange(pct, REGRESSION_CALLOUT_THRESHOLD_HEAP).status, 'regression');
    assert.equal(classifyChange(pct, REGRESSION_CALLOUT_THRESHOLD_TIMING).status, 'neutral-up');
  });

  test('mirrors the band on the improvement side', () => {
    assert.equal(classifyChange(-REGRESSION_CALLOUT_THRESHOLD_TIMING - 0.1).status, 'improvement');
    assert.equal(classifyChange(-1).status, 'neutral-down');
  });

  test('null is unknown, exact zero is neutral', () => {
    assert.equal(classifyChange(null).status, 'unknown');
    assert.equal(classifyChange(0).status, 'neutral');
  });
});

describe('calcCv', () => {
  test('uses the sample standard deviation, not the population one', () => {
    // n=3, mean 100, deviations -10/0/+10. Sample variance is 200/2 = 100, so CV is 10%.
    // The population form would divide by 3 and report 8.165%.
    assert.equal(calcCv([90, 100, 110]).toFixed(3), '10.000');
  });

  test('reads wider than the population form at the three iterations the suite runs', () => {
    const values = [90, 100, 110];
    const mean = 100;
    const population = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
    ) / mean * 100;

    assert.ok(calcCv(values) > population);
  });

  test('returns null below two samples', () => {
    assert.equal(calcCv([5]), null);
    assert.equal(calcCv([]), null);
    assert.equal(calcCv(null), null);
    assert.equal(calcCv(undefined), null);
  });

  test('returns null on a zero mean rather than dividing by it', () => {
    assert.equal(calcCv([0, 0, 0]), null);
  });

  test('is zero for identical samples', () => {
    assert.equal(calcCv([7, 7, 7]), 0);
  });
});

describe('fmtCvValue', () => {
  test('renders n/a for an unknown spread rather than a number', () => {
    // A rendered "0.0%" would claim a perfectly stable baseline where there is simply no data.
    assert.equal(fmtCvValue(null), 'n/a');
    assert.equal(fmtCvValue(undefined), 'n/a');
    assert.equal(fmtCvValue(NaN), 'n/a');
  });

  test('flags a spread above the warning threshold', () => {
    assert.ok(fmtCvValue(CV_WARNING_THRESHOLD + 1).includes('\u26A0\uFE0F'));
    assert.ok(!fmtCvValue(CV_WARNING_THRESHOLD - 1).includes('\u26A0\uFE0F'));
  });

  test('does not flag exactly at the threshold', () => {
    assert.equal(fmtCvValue(CV_WARNING_THRESHOLD), '15.0%');
  });
});

describe('fmtCv', () => {
  test('formats straight from a sample array', () => {
    assert.equal(fmtCv([90, 100, 110]), '10.0%');
  });

  test('renders n/a when the array is too short to have a spread', () => {
    assert.equal(fmtCv([100]), 'n/a');
  });
});

describe('fmtPct and fmtPctWithEmoji', () => {
  test('renders a sign and one decimal', () => {
    assert.equal(fmtPct(4.25), '+4.3%');
    assert.equal(fmtPct(-4.25), '-4.3%');
    assert.equal(fmtPct(null), '--');
  });

  test('suppresses the emoji below one percent', () => {
    assert.equal(fmtPctWithEmoji(0.4), '+0.4%');
  });

  test('passes the threshold through to the band', () => {
    const pct = 8;

    assert.ok(fmtPctWithEmoji(pct, REGRESSION_CALLOUT_THRESHOLD_HEAP).includes('\u{1F534}'));
    assert.ok(!fmtPctWithEmoji(pct, REGRESSION_CALLOUT_THRESHOLD_TIMING).includes('\u{1F534}'));
  });
});

describe('activeTotalsPerIteration', () => {
  test('sums the three active categories per iteration', () => {
    assert.deepEqual(
      activeTotalsPerIteration({
        scripting: [10, 20, 30],
        rendering: [1, 2, 3],
        painting: [1, 1, 1],
      }),
      [12, 23, 34]
    );
  });

  test('treats a short array as zero at the missing index, not as a shift', () => {
    // The bug this guards: compacting the arrays would pair iteration 3's scripting with
    // iteration 3's absent painting AND iteration 2's scripting with iteration 3's painting,
    // producing a CV that is wrong rather than merely conservative.
    assert.deepEqual(
      activeTotalsPerIteration({ scripting: [10, 20, 30], painting: [1, 1] }),
      [11, 21, 30]
    );
  });

  test('handles a category missing entirely', () => {
    assert.deepEqual(activeTotalsPerIteration({ scripting: [10, 20] }), [10, 20]);
  });

  test('ignores non-finite entries rather than propagating NaN', () => {
    assert.deepEqual(
      activeTotalsPerIteration({ scripting: [10, NaN, 30], rendering: [1, 1, 1] }),
      [11, 1, 31]
    );
  });

  test('returns an empty array for absent or empty input', () => {
    assert.deepEqual(activeTotalsPerIteration(null), []);
    assert.deepEqual(activeTotalsPerIteration(undefined), []);
    assert.deepEqual(activeTotalsPerIteration({}), []);
  });

  test('ignores categories that are not active time', () => {
    assert.deepEqual(
      activeTotalsPerIteration({ scripting: [10, 10], idle: [900, 900], other: [50, 50] }),
      [10, 10]
    );
  });
});

describe('BASELINE_INCOMPLETE_LABEL', () => {
  test('does not read as "no data"', () => {
    // A failed capture and an absent measurement are different things, and the comment has to
    // distinguish them -- rendering a bare "--" for both was how the original defect stayed hidden.
    assert.notEqual(BASELINE_INCOMPLETE_LABEL, '--');
    assert.ok(BASELINE_INCOMPLETE_LABEL.length > 0);
  });
});
