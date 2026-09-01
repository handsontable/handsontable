// Shared classification logic for performance change percentages.
// Used by both the markdown report builder and the HTML report builder.

// Timing and heap need separate thresholds: replaying the 18 post-PR1 develop goldens on gh-pages
// against a trailing median-of-5 baseline, timing's run-to-run CV is 11-19% per scenario while
// heap's is 0.4-3.6%. A shared value cannot serve both -- at 15 a genuine +10% heap leak is detected
// 9% of the time instead of 93%.
//
// The timing number is interim. It is set at the knee of the false-positive curve measured against
// a cross-runner baseline (34% of no-change comparisons fire a callout at 5, 3% at 15). Once the
// suite compares two builds on the same runner in one job, re-derive it against that noise floor.
export const REGRESSION_CALLOUT_THRESHOLD_TIMING = 15;
export const REGRESSION_CALLOUT_THRESHOLD_HEAP = 5;

// Coefficient of variation above which a measurement is flagged as unreliable.
export const CV_WARNING_THRESHOLD = 15;

// Rendered in place of a percentage when the baseline did not capture a category that the current
// run did. A failed capture must not read as "no data", which is what a bare "--" would say.
export const BASELINE_INCOMPLETE_LABEL = 'baseline incomplete';

// The categories that make up "active" time. Loading, other, experience and idle are excluded.
export const ACTIVE_CATEGORIES = ['scripting', 'rendering', 'painting'];

/**
 * Classifies a percentage change into a status, emoji and CSS class.
 *
 * The band is the callout threshold, so the colour a row is painted and the callout the comment
 * makes can never disagree.
 *
 * @param {number | null} pctChange -- percentage change (positive = regression)
 * @param {number} [threshold] -- band edge; defaults to the timing callout threshold
 * @returns {{ status: string, emoji: string, cssClass: string }}
 */
export function classifyChange(pctChange, threshold = REGRESSION_CALLOUT_THRESHOLD_TIMING) {
  if (pctChange == null) {
    return { status: 'unknown', emoji: '', cssClass: 'unknown' };
  }

  if (pctChange > threshold) {
    return { status: 'regression', emoji: '\u{1F534}', cssClass: 'regression' };
  }

  if (pctChange > 0) {
    return { status: 'neutral-up', emoji: '\u{1F7E1}', cssClass: 'neutral-up' };
  }

  if (pctChange < -threshold) {
    return { status: 'improvement', emoji: '\u{1F7E2}', cssClass: 'improvement' };
  }

  if (pctChange < 0) {
    return { status: 'neutral-down', emoji: '\u{1F535}', cssClass: 'neutral-down' };
  }

  return { status: 'neutral', emoji: '', cssClass: 'neutral' };
}

/**
 * @param {number | null} baseline
 * @param {number | null} current
 * @returns {number | null}
 */
export function pctChange(baseline, current) {
  if (baseline == null || current == null || baseline === 0) {
    return null;
  }

  return ((current - baseline) / baseline) * 100;
}

/**
 * @param {object} categories -- { scripting, rendering, painting, ... }
 * @returns {number}
 */
export function sumActive(categories) {
  return (categories.scripting || 0) + (categories.rendering || 0) + (categories.painting || 0);
}

/**
 * Sums active time on both sides of a comparison and reports whether the two are comparable.
 *
 * A baseline that recorded zero for a category the current run did record is a failed capture, not
 * a cheap operation. `pctChange` already refuses to divide by such a category; without this check
 * `sumActive` would fold it into the total anyway and publish the resulting percentage.
 *
 * @param {object | null | undefined} baselineCategories
 * @param {object | null | undefined} currentCategories
 * @returns {{ baseline: number, current: number, incompleteCategories: string[], comparable: boolean }}
 */
export function sumActiveComparable(baselineCategories, currentCategories) {
  const baseline = baselineCategories ?? {};
  const current = currentCategories ?? {};
  const incompleteCategories = ACTIVE_CATEGORIES.filter(
    key => (baseline[key] || 0) === 0 && (current[key] || 0) > 0
  );

  return {
    baseline: sumActive(baseline),
    current: sumActive(current),
    incompleteCategories,
    comparable: incompleteCategories.length === 0,
  };
}

/**
 * Recombines per-category iteration arrays into one active-time total per iteration.
 *
 * Lives here rather than in either report builder so the set of active categories is stated once.
 * A category array shorter than the others means that iteration recorded no time for it, which is
 * a zero at that index, not a shift of every later value onto the wrong iteration.
 *
 * @param {Record<string, number[]> | null | undefined} categories
 * @returns {number[]}
 */
export function activeTotalsPerIteration(categories) {
  if (!categories) {
    return [];
  }

  const length = Math.max(0, ...ACTIVE_CATEGORIES.map(key => categories[key]?.length ?? 0));

  return Array.from({ length }, (_, i) => ACTIVE_CATEGORIES.reduce((sum, key) => {
    const value = categories[key]?.[i];

    return sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  }, 0));
}

/**
 * @param {number | null} v -- milliseconds
 * @returns {string}
 */
export function fmtMs(v) {
  if (v == null || !Number.isFinite(v)) {
    return '--';
  }

  return `${Math.round(v)} ms`;
}

/**
 * @param {number | null} pct
 * @returns {string}
 */
export function fmtPct(pct) {
  if (pct == null) {
    return '--';
  }

  const sign = pct >= 0 ? '+' : '';

  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * @param {number | null} pct
 * @param {number} [threshold] -- band edge passed through to `classifyChange`
 * @returns {string}
 */
export function fmtPctWithEmoji(pct, threshold = REGRESSION_CALLOUT_THRESHOLD_TIMING) {
  if (pct == null) {
    return '--';
  }

  const text = fmtPct(pct);
  const { emoji } = classifyChange(pct, threshold);

  if (Math.abs(pct) < 1) {
    return text;
  }

  return emoji ? `${text} ${emoji}` : text;
}

// Display titles that cannot be derived from the kebab-case scenario name (e.g. need punctuation
// or inline code). Keyed by scenario name.
const TITLE_OVERRIDES = {
  'source-data-validator-load': 'Initial Load (`sourceDataValidator`)',
};

/**
 * @param {string} name -- kebab-case scenario name
 * @returns {string}
 */
export function formatTitle(name) {
  if (TITLE_OVERRIDES[name]) {
    return TITLE_OVERRIDES[name];
  }

  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Coefficient of variation, as a percentage.
 *
 * Uses the sample standard deviation (n-1). The suite runs three iterations, where the population
 * form understates spread by about 18% -- and this number gates how much trust a reader puts in the
 * delta beside it, so it should not read tighter than the data supports.
 *
 * @param {number[] | null | undefined} values
 * @returns {number | null} -- null when there is too little data or the mean is zero
 */
export function calcCv(values) {
  if (!Array.isArray(values) || values.length < 2) {
    return null;
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  if (mean === 0) {
    return null;
  }

  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);

  return (Math.sqrt(variance) / Math.abs(mean)) * 100;
}

/**
 * Formats an already-computed CV. Renders `n/a` rather than a number when the spread is unknown --
 * a rendered `0.0%` would read as a perfectly stable measurement.
 *
 * @param {number | null | undefined} cv
 * @returns {string}
 */
export function fmtCvValue(cv) {
  if (cv == null || !Number.isFinite(cv)) {
    return 'n/a';
  }

  return `${cv.toFixed(1)}%${cv > CV_WARNING_THRESHOLD ? ' \u26A0\uFE0F' : ''}`;
}

/**
 * @param {number[] | null | undefined} values
 * @returns {string}
 */
export function fmtCv(values) {
  return fmtCvValue(calcCv(values));
}
