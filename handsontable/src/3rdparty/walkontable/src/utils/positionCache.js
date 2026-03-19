/**
 * Cumulative prefix sum cache for O(log n) scroll-to-index lookups.
 *
 * Works for both row heights and column widths. Builds an array where
 * prefixSum[i] = sum of sizes for items 0..i-1.
 * prefixSum[0] = 0, prefixSum[n] = total size of all n items.
 *
 * Binary search on this array converts a pixel offset to an index in O(log n)
 * instead of O(n) linear iteration.
 *
 * @class PositionCache
 */
export class PositionCache {
  /**
   * @type {Float64Array|null}
   */
  prefixSum = null;
  /**
   * @type {number}
   */
  totalItems = 0;

  /**
   * Builds the prefix sum from a size function.
   *
   * @param {number} totalItems The total number of items (rows or columns).
   * @param {Function} sizeFn A function that returns the size for a given index.
   * @param {number} defaultSize The default size for items that return NaN/undefined.
   */
  build(totalItems, sizeFn, defaultSize) {
    this.totalItems = totalItems;
    this.prefixSum = new Float64Array(totalItems + 1);
    this.prefixSum[0] = 0;

    for (let i = 0; i < totalItems; i++) {
      const s = sizeFn(i);

      this.prefixSum[i + 1] = this.prefixSum[i] + (isNaN(s) ? defaultSize : s);
    }
  }

  /**
   * Returns the cumulative size at an index (sum of items 0..index-1).
   *
   * @param {number} index The item index.
   * @returns {number} The cumulative size before this index.
   */
  getOffset(index) {
    if (!this.prefixSum || index <= 0) {
      return 0;
    }
    if (index >= this.totalItems) {
      return this.prefixSum[this.totalItems];
    }

    return this.prefixSum[index];
  }

  /**
   * Finds the item index at a given pixel offset using binary search.
   *
   * @param {number} offset The pixel offset.
   * @returns {number} The index whose cumulative start position is at or just before the offset.
   */
  findIndexAtOffset(offset) {
    if (!this.prefixSum || offset <= 0) {
      return 0;
    }

    let lo = 0;
    let hi = this.totalItems;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;

      if (this.prefixSum[mid + 1] <= offset) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    return Math.min(lo, this.totalItems - 1);
  }

  /**
   * Returns the total size of all items.
   *
   * @returns {number}
   */
  getTotalSize() {
    if (!this.prefixSum) {
      return 0;
    }

    return this.prefixSum[this.totalItems];
  }

  /**
   * Invalidates the cache.
   */
  invalidate() {
    this.prefixSum = null;
    this.totalItems = 0;
  }

  /**
   * Returns whether the cache has been built.
   *
   * @returns {boolean}
   */
  isBuilt() {
    return this.prefixSum !== null;
  }
}
