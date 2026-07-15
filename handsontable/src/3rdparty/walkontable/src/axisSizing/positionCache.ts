export interface PositionCacheConfig {
  totalItemsFn: () => number;
  sizeFn: (index: number) => number;
  defaultSizeFn: () => number;
  isUniformFn?: () => boolean;
  sparseExceptionsFn?: () => Record<number, number | undefined> | null;
  onBuildFn?: () => void;
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
   * Optional provider of "sparse exceptions": a record of per-index size overrides on top of an
   * otherwise uniform base size (e.g. `wtViewport.oversizedRows` when the size source itself is
   * uniform). When it returns a record, the cache builds in sparse mode — O(exceptions) instead of
   * O(totalItems) — storing only the overrides and computing every other offset arithmetically.
   * Return `null` whenever the base sizes are not uniform (per-item size settings or hooks exist).
   *
   * @type {Function|undefined}
   */
  readonly #sparseExceptionsFn?: () => Record<number, number | undefined> | null;
  /**
   * Optional callback invoked whenever the cache is (re)built, in either mode. Lets the owner
   * record the context the sizes were read in (e.g. which row carried the first-rendered-row
   * border compensation at build time).
   *
   * @type {Function|undefined}
   */
  readonly #onBuildFn?: () => void;
  /**
   * The shared size used when the cache is in uniform mode. `null` when the cache is in
   * prefix-sum mode (heterogeneous sizes) or not yet built.
   *
   * @type {number|null}
   */
  #uniformSize: number | null = null;
  /**
   * The base size shared by every non-exception item when the cache is in sparse mode.
   * `null` in every other mode.
   *
   * @type {number|null}
   */
  #sparseBase: number | null = null;
  /**
   * Sorted item indexes that override the sparse base size. Populated only in sparse mode.
   *
   * @type {Float64Array|null}
   */
  #sparseIndexes: Float64Array | null = null;
  /**
   * Prefix sums of the exceptions' size deltas against the base: `#sparseDeltaPrefix[j]` is the
   * summed extra size of the first `j` exceptions. One element longer than `#sparseIndexes`.
   * Populated only in sparse mode.
   *
   * @type {Float64Array|null}
   */
  #sparseDeltaPrefix: Float64Array | null = null;
  /**
   * Exception sizes keyed by item index, for O(1) single-item reads in sparse mode.
   *
   * @type {Map<number, number>|null}
   */
  #sparseSizes: Map<number, number> | null = null;
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
  constructor({
    totalItemsFn, sizeFn, defaultSizeFn, isUniformFn, sparseExceptionsFn, onBuildFn,
  }: PositionCacheConfig) {
    this.#totalItemsFn = totalItemsFn;
    this.#sizeFn = sizeFn;
    this.#defaultSizeFn = defaultSizeFn;
    this.#isUniformFn = isUniformFn;
    this.#sparseExceptionsFn = sparseExceptionsFn;
    this.#onBuildFn = onBuildFn;
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
    this.#onBuildFn?.();
    this.#sparseBase = null;
    this.#sparseIndexes = null;
    this.#sparseDeltaPrefix = null;
    this.#sparseSizes = null;

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

    const exceptions = this.#sparseExceptionsFn?.();

    if (exceptions) {
      this.#buildSparse(exceptions, totalItems, defaultSize);

      return;
    }

    this.prefixSum = new Float64Array(totalItems + 1);
    this.prefixSum[0] = 0;

    for (let i = 0; i < totalItems; i++) {
      const s = sizeFn(i);

      this.prefixSum[i + 1] = this.prefixSum[i] + (isNaN(s) ? defaultSize : s);
    }
  }

  /**
   * Builds the cache in sparse mode: a uniform base size plus per-index overrides. Costs
   * O(exceptions log exceptions), independent of the total item count, and allocates arrays
   * sized by the exception count only — at 1M uniform rows with a few thousand DOM-measured
   * oversized rows this replaces a 1M-iteration loop and an 8 MB allocation per rebuild.
   *
   * @param {Record<number, number|undefined>} exceptions Per-index size overrides.
   * @param {number} totalItems The total item count read at build time.
   * @param {number} defaultSize The default item size read at build time.
   */
  #buildSparse(exceptions: Record<number, number | undefined>, totalItems: number, defaultSize: number) {
    const sizes = new Map<number, number>();

    for (const key of Object.keys(exceptions)) {
      const index = Number(key);
      const size = exceptions[index];

      // Skip wiped records and records of items that no longer exist (item count shrank).
      if (size !== undefined && index >= 0 && index < totalItems) {
        sizes.set(index, size);
      }
    }

    const indexes = Float64Array.from(sizes.keys()).sort();

    // Sample the base from the LAST non-exception item, mirroring the uniform-mode rule (the
    // first rendered item carries a +1px border compensation, so never sample near the viewport
    // start). Walk past trailing exception items; with every item excepted, fall back to the
    // default size.
    let sampleIndex = totalItems - 1;

    while (sampleIndex >= 0 && sizes.has(sampleIndex)) {
      sampleIndex -= 1;
    }

    const sampled = sampleIndex >= 0 ? this.#sizeFn(sampleIndex) : NaN;
    const base = isNaN(sampled) ? defaultSize : sampled;
    const deltaPrefix = new Float64Array(indexes.length + 1);

    for (let j = 0; j < indexes.length; j++) {
      deltaPrefix[j + 1] = deltaPrefix[j] + (sizes.get(indexes[j])! - base);
    }

    this.#sparseBase = base;
    this.#sparseIndexes = indexes;
    this.#sparseDeltaPrefix = deltaPrefix;
    this.#sparseSizes = sizes;
    this.prefixSum = null;
  }

  /**
   * Returns how many exception indexes are smaller than the given index (sparse mode only) —
   * the position in `#sparseDeltaPrefix` holding their summed deltas. Binary search, O(log k).
   *
   * @param {number} index The exclusive upper bound item index.
   * @returns {number} The number of exceptions below the index.
   */
  #countExceptionsBelow(index: number): number {
    const indexes = this.#sparseIndexes!;
    let lo = 0;
    let hi = indexes.length;

    while (lo < hi) {
      // eslint-disable-next-line no-bitwise
      const mid = (lo + hi) >>> 1;

      if (indexes[mid] < index) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    return lo;
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

    if (this.#sparseBase !== null) {
      if (index <= 0) {
        return 0;
      }

      const clamped = Math.min(index, this.totalItems);

      return (clamped * this.#sparseBase) + this.#sparseDeltaPrefix![this.#countExceptionsBelow(clamped)];
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

    if (this.#sparseBase !== null) {
      if (offset <= 0 || this.totalItems === 0) {
        return 0;
      }

      // Same semantics as the prefix-sum branch below, expressed over `getOffset` (O(log n log k)).
      let sparseLo = 0;
      let sparseHi = this.totalItems;

      while (sparseLo < sparseHi) {
        // eslint-disable-next-line no-bitwise
        const mid = (sparseLo + sparseHi) >>> 1;

        if (this.getOffset(mid + 1) <= offset) {
          sparseLo = mid + 1;
        } else {
          sparseHi = mid;
        }
      }

      return Math.min(sparseLo, this.totalItems - 1);
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

    if (this.#sparseBase !== null) {
      return this.#sparseSizes!.get(index) ?? this.#sparseBase;
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

    if (this.#sparseBase !== null) {
      return (this.totalItems * this.#sparseBase) +
        this.#sparseDeltaPrefix![this.#sparseDeltaPrefix!.length - 1];
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
    this.#sparseBase = null;
    this.#sparseIndexes = null;
    this.#sparseDeltaPrefix = null;
    this.#sparseSizes = null;
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

  /**
   * Returns whether the cache currently holds valid built data for the current item count, in either
   * mode. Unlike {@link PositionCache#isBuilt} (a prefix-sum-mode type guard that is always `false` in
   * uniform mode), this reflects the real build/invalidate state: {@link PositionCache#build} sets it
   * regardless of mode, {@link PositionCache#invalidate} clears it, and a changed item count makes it
   * stale (mirroring {@link PositionCache#ensureBuilt}). It is the signal for "the sizes the pre-render
   * calculators read are still current" — e.g. `markOversizedRows` invalidates the row cache here when
   * it finds a genuinely oversized row.
   *
   * @returns {boolean}
   */
  isCurrent(): boolean {
    return this.#built && this.totalItems === this.#totalItemsFn();
  }
}
