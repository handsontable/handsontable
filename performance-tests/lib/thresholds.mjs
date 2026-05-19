// Shared classification logic for performance change percentages.
// Used by both the markdown report builder and the HTML report builder.

export const REGRESSION_CALLOUT_THRESHOLD = 5;

/**
 * @param {number | null} pctChange -- percentage change (positive = regression)
 * @returns {{ status: string, emoji: string, cssClass: string }}
 */
export function classifyChange(pctChange) {
  if (pctChange == null) {
    return { status: 'unknown', emoji: '', cssClass: 'unknown' };
  }

  if (pctChange > 10) {
    return { status: 'regression', emoji: '\u{1F534}', cssClass: 'regression' };
  }

  if (pctChange > 0) {
    return { status: 'neutral-up', emoji: '\u{1F7E1}', cssClass: 'neutral-up' };
  }

  if (pctChange < -10) {
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
 * @returns {string}
 */
export function fmtPctWithEmoji(pct) {
  if (pct == null) {
    return '--';
  }

  const text = fmtPct(pct);
  const { emoji } = classifyChange(pct);

  if (Math.abs(pct) < 1) {
    return text;
  }

  return emoji ? `${text} ${emoji}` : text;
}

/**
 * @param {string} name -- kebab-case scenario name
 * @returns {string}
 */
export function formatTitle(name) {
  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * @param {number[]} values
 * @returns {string}
 */
export function fmtCv(values) {
  if (!values || values.length < 2) {
    return '';
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  if (mean === 0) {
    return '';
  }

  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  const cv = (stddev / Math.abs(mean)) * 100;
  const warning = cv > 15 ? ' !!!' : '';

  return `${cv.toFixed(1)}%${warning}`;
}
