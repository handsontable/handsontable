/**
 * The contract every position-lookup strategy implements. A strategy is an immutable snapshot
 * built from the sizes read at build time — `PositionCache` (the facade in `index.ts`) constructs
 * exactly one of them per build and delegates every read to it, so no strategy ever branches on
 * "which mode am I in".
 */
export interface PositionStrategy {
  /**
   * The prefix-sum array when the strategy holds one (`PrefixSumPositionStrategy` only); `null`
   * otherwise. Exposed for the facade's `prefixSum` back-compat field and its `isBuilt()` type
   * guard.
   */
  readonly prefixSum: Float64Array | null;

  /**
   * Returns the cumulative size before the given item index.
   */
  getOffset(index: number): number;

  /**
   * Finds the item index whose cumulative start position is at or just before the given offset.
   */
  findIndexAtOffset(offset: number): number;

  /**
   * Returns the size of the single item at the given index.
   */
  getSizeAt(index: number): number;

  /**
   * Returns the total size of all items.
   */
  getTotalSize(): number;
}

/**
 * Samples the size shared by (or defaulted for) the tail of the item list. Samples the LAST
 * item, never the first rendered one: `getDefaultRowHeight` adds a 1px border compensation to the
 * first rendered visible row, so sampling index 0 at build time (scroll position 0) would
 * propagate that +1 to every arithmetic offset. Used by the uniform and sparse strategies.
 *
 * @param {number} sampleIndex The index to sample; pass a negative value to force the default.
 * @param {Function} sizeFn A function that returns the size for a given index.
 * @param {number} defaultSize The fallback size when the sample is missing (NaN) or out of range.
 * @returns {number} The sampled or default size.
 */
export function sampleBaseSize(sampleIndex: number, sizeFn: (index: number) => number, defaultSize: number): number {
  const sampled = sampleIndex >= 0 ? sizeFn(sampleIndex) : NaN;

  return isNaN(sampled) ? defaultSize : sampled;
}
