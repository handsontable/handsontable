/**
 * Calculates scroll interval based on distance from viewport edge.
 * Uses logarithmic interpolation for natural feel (fast drop-off near edge, slower further out).
 *
 * @param {number} distance Distance from viewport edge in pixels.
 * @param {{ min: number, max: number }} intervalRange Min/max interval range in milliseconds.
 * @param {number} rampDistance Distance at which interval reaches minimum.
 * @param {number} [logScale] Logarithmic scale factor for natural feel.
 * @returns {number} Interval in milliseconds.
 */
export function calculateInterval(distance, intervalRange, rampDistance, logScale = 200) {
  const clampedDistance = Math.min(Math.abs(distance), rampDistance);
  const ratio = clampedDistance / rampDistance;
  const range = intervalRange.max - intervalRange.min;

  return Math.round(
    intervalRange.max - ((Math.log(1 + (ratio * logScale)) / Math.log(1 + logScale)) * range)
  );
}
