/**
 * Calculates auto-scroll interval based on the mouse distance from table viewport.
 *
 * @param {number} diff Distance from viewport edge in pixels (can be negative or positive).
 * @param {object} intervalRange Interval range with min and max values.
 * @param {number} rampDistance Maximum distance in pixels where interval reaches minimum.
 * @param {number} logScale Logarithmic scale factor (higher = steeper initial drop).
 * @returns {number} Calculated interval in milliseconds.
 */
export function calculateScrollInterval(diff, intervalRange, rampDistance, logScale = 200) {
  const absDiff = Math.abs(diff);
  const clampedDiff = Math.min(absDiff, rampDistance);
  const distanceRatio = clampedDiff / rampDistance;
  const intervalRangeSize = intervalRange.max - intervalRange.min;

  // Logarithmic interpolation (higher = steeper initial drop)
  const interval = Math.round(
    intervalRange.max - ((Math.log(1 + (distanceRatio * logScale)) / Math.log(1 + logScale)) * intervalRangeSize)
  );

  return interval;
}
