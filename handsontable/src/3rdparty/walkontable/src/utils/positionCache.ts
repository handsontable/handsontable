export interface PositionCacheConfig {
  totalItemsFn: () => number;
  sizeFn: (index: number) => number;
  defaultSizeFn: () => number;
  isUniformFn?: () => boolean;
}

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
   * The prefix sum array. Contains the cumulative size of all items up to the index.
   *
   * @type {Float64Array|null}
   */
  prefixSum: Float64Array | null = null;
  /**
   * The total number of items (rows or columns).
   *
   * @type {number}
   */
  totalItems: number = 0;
  /**
   * A function that returns the total number of items (rows or columns).
   *
   * @type {Function}
   */
  readonly #totalItemsFn: () => number;
  /**
   * A function that returns the size for a given index.
   *
   * @type {Function}
   */
  readonly #sizeFn: (index: number) => number;
  /**
   * A function that returns the default size for items that return NaN/undefined.
   *
   * @type {Function}
   */
  readonly #defaultSizeFn: () => number;
  /**
   * Optional predicate. When it returns `true`, every item is guaranteed to have the same size,
   * so the prefix sum array and the O(n) build loop are skipped and offsets are computed
   * arithmetically. The predicate must be conservative: return `false` whenever any per-item
   * size override may exist.
   *
   * @type {Function|undefined}
   */
  readonly #isUniformFn?: () => boolean;
  /**
   * The shared size used when the cache is in uniform mode. `null` when the cache is in
   * prefix-sum mode (heterogeneous sizes) or not yet built.
   *
   * @type {number|null}
   */
  #uniformSize: number | null = null;
  /**
   * Whether the cache has been built in either mode (prefix-sum or uniform). Tracked separately
   * from `prefixSum` because uniform mode keeps `prefixSum` as `null`.
   *
   * @type {boolean}
   */
  #built: boolean = false;

  /**
   * @param {object} config The configuration object.
   * @param {Function} config.totalItemsFn A function that returns the total number of items (rows or columns).
   * @param {Function} config.sizeFn A function that returns the size for a given index.
   * @param {Function} config.defaultSizeFn A function that returns the default size for items
   *   that return NaN/undefined.
   * @param {Function} [config.isUniformFn] Optional predicate; when `true`, all items share one size.
   */
  constructor({ totalItemsFn, sizeFn, defaultSizeFn, isUniformFn }: PositionCacheConfig) {
    this.#totalItemsFn = totalItemsFn;
    this.#sizeFn = sizeFn;
    this.#defaultSizeFn = defaultSizeFn;
    this.#isUniformFn = isUniformFn;
  }

  /**
   * Builds the prefix sum by reading the current total items, size function,
   * and default size from the configured providers. When the optional uniform predicate
   * reports that all items share one size, the array allocation and the O(n) loop are skipped.
   */
  build() {
    const totalItems = this.#totalItemsFn();
    const sizeFn = this.#sizeFn;
    const defaultSize = this.#defaultSizeFn();

    this.totalItems = totalItems;
    this.#built = true;

    if (this.#isUniformFn?.()) {
      // Sample the LAST item, never the first rendered one: `getDefaultRowHeight` adds a 1px
      // border compensation to the first rendered visible row, so sampling index 0 at build time
      // (scroll position 0) would propagate that +1 to every arithmetic offset.
      const sampled = totalItems > 0 ? sizeFn(totalItems - 1) : NaN;

      this.#uniformSize = isNaN(sampled) ? defaultSize : sampled;
      this.prefixSum = null;

      return;
    }

    this.#uniformSize = null;
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
  getOffset(index: number): number {
    if (this.#uniformSize !== null) {
      if (index <= 0) {
        return 0;
      }

      return Math.min(index, this.totalItems) * this.#uniformSize;
    }

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
   *   Returns `0` when there are no items (`totalItems === 0`), including when `offset > 0`.
   */
  findIndexAtOffset(offset: number): number {
    if (this.#uniformSize !== null) {
      if (offset <= 0 || this.totalItems === 0) {
        return 0;
      }

      return Math.min(Math.floor(offset / this.#uniformSize), this.totalItems - 1);
    }

    if (!this.isBuilt() || offset <= 0 || this.totalItems === 0) {
      return 0;
    }

    let lo = 0;
    let hi = this.totalItems;

    while (lo < hi) {
      // eslint-disable-next-line no-bitwise
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
   * Returns the size of a single item at the given index.
   *
   * @param {number} index The item index.
   * @returns {number} The size of the item (difference between consecutive prefix sums).
   */
  getSizeAt(index: number): number {
    if (index < 0 || index >= this.totalItems) {
      return 0;
    }

    if (this.#uniformSize !== null) {
      return this.#uniformSize;
    }

    if (!this.prefixSum) {
      return 0;
    }

    return this.prefixSum[index + 1] - this.prefixSum[index];
  }

  /**
   * Builds the prefix sum only when the cache is not yet built or the item
   * count has changed.
   */
  ensureBuilt() {
    if (!this.#built || this.totalItems !== this.#totalItemsFn()) {
      this.build();
    }
  }

  /**
   * Returns the total size of all items.
   *
   * @returns {number}
   */
  getTotalSize() {
    if (this.#uniformSize !== null) {
      return this.totalItems * this.#uniformSize;
    }

    if (!this.prefixSum) {
      return 0;
    }

    return this.prefixSum[this.totalItems];
  }

  /**
   * Invalidates the cache so it will be rebuilt on the next
   * {@link PositionCache#ensureBuilt} call.
   */
  invalidate() {
    this.prefixSum = null;
    this.#uniformSize = null;
    this.#built = false;
    this.totalItems = 0;
  }

  /**
   * Returns whether the cache holds a prefix-sum array (heterogeneous mode). Uniform mode keeps
   * `prefixSum` as `null`, so this is `false` there; use it only as the prefix-sum type guard.
   *
   * @returns {boolean}
   */
  isBuilt(): this is PositionCache & { prefixSum: Float64Array } {
    return this.prefixSum !== null;
  }
}
