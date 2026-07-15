import type { PositionStrategy } from './strategy';

/**
 * Position lookups over fully heterogeneous sizes: one prefix-sum array entry per item, where
 * `prefixSum[i]` is the summed size of items `0..i-1`. Building walks every item once (O(n) time
 * and memory); offset reads are O(1) and offset-to-index lookups are an O(log n) binary search.
 * This is the general fallback when neither the uniform nor the sparse strategy applies (per-item
 * size settings or a size-modifying hook exist).
 */
export class PrefixSumPositionStrategy implements PositionStrategy {
  /**
   * The prefix sum array. `prefixSum[0] = 0`, `prefixSum[n]` = total size of all `n` items.
   *
   * @type {Float64Array}
   */
  readonly prefixSum: Float64Array;
  /**
   * The total item count read at build time.
   *
   * @type {number}
   */
  readonly #totalItems: number;

  /**
   * @param {number} totalItems The total item count read at build time.
   * @param {Function} sizeFn A function that returns the size for a given index.
   * @param {number} defaultSize The default size for items that report NaN.
   */
  constructor(totalItems: number, sizeFn: (index: number) => number, defaultSize: number) {
    const prefixSum = new Float64Array(totalItems + 1);

    prefixSum[0] = 0;

    for (let i = 0; i < totalItems; i++) {
      const size = sizeFn(i);

      prefixSum[i + 1] = prefixSum[i] + (isNaN(size) ? defaultSize : size);
    }

    this.prefixSum = prefixSum;
    this.#totalItems = totalItems;
  }

  /**
   * Returns the cumulative size before the given item index.
   *
   * @param {number} index The item index.
   * @returns {number} The cumulative size before this index.
   */
  getOffset(index: number): number {
    if (index <= 0) {
      return 0;
    }
    if (index >= this.#totalItems) {
      return this.prefixSum[this.#totalItems];
    }

    return this.prefixSum[index];
  }

  /**
   * Finds the item index at a given pixel offset using binary search over the prefix sums.
   *
   * @param {number} offset The pixel offset.
   * @returns {number} The index whose cumulative start position is at or just before the offset.
   */
  findIndexAtOffset(offset: number): number {
    if (offset <= 0 || this.#totalItems === 0) {
      return 0;
    }

    let lo = 0;
    let hi = this.#totalItems;

    while (lo < hi) {
      // eslint-disable-next-line no-bitwise
      const mid = (lo + hi) >>> 1;

      if (this.prefixSum[mid + 1] <= offset) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    return Math.min(lo, this.#totalItems - 1);
  }

  /**
   * Returns the size of the single item at the given index.
   *
   * @param {number} index The item index.
   * @returns {number} The size (difference between consecutive prefix sums), or `0` outside the
   *   item range.
   */
  getSizeAt(index: number): number {
    if (index < 0 || index >= this.#totalItems) {
      return 0;
    }

    return this.prefixSum[index + 1] - this.prefixSum[index];
  }

  /**
   * Returns the total size of all items.
   *
   * @returns {number}
   */
  getTotalSize(): number {
    return this.prefixSum[this.#totalItems];
  }
}
