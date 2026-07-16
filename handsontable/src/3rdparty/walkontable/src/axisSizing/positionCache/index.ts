import type { PositionStrategy } from './strategy';
import { sampleBaseSize } from './strategy';
import { UniformPositionStrategy } from './uniformStrategy';
import { SparsePositionStrategy } from './sparseStrategy';
import { PrefixSumPositionStrategy } from './prefixSumStrategy';

export interface PositionCacheConfig {
  totalItemsFn: () => number;
  sizeFn: (index: number) => number;
  defaultSizeFn: () => number;
  isUniformFn?: () => boolean;
  sparseExceptionsFn?: () => Record<number, number | undefined> | null;
  onBuildFn?: () => void;
}

/**
 * Axis position cache: answers "what pixel offset does item N start at" (and the inverse) for row
 * heights and column widths without a per-question walk over the items.
 *
 * The class itself owns only the LIFECYCLE — when to (re)build, whether the built data is still
 * current, and invalidation. Every lookup is delegated to one of three interchangeable
 * strategies, chosen per build from the configured providers (`./strategy` has the contract):
 *
 * - {@link UniformPositionStrategy} — all items share one size; pure arithmetic, O(1) build.
 *   Chosen when `isUniformFn` reports uniform sizes.
 * - {@link SparsePositionStrategy} — a uniform base plus few per-index overrides (e.g. measured
 *   oversized rows); O(exceptions) build. Chosen when `sparseExceptionsFn` returns the overrides.
 * - {@link PrefixSumPositionStrategy} — fully heterogeneous sizes; O(totalItems) build, the
 *   general fallback.
 *
 * @class PositionCache
 */
export class PositionCache {
  /**
   * The total number of items (rows or columns) read at build time.
   *
   * @type {number}
   */
  totalItems: number = 0;
  /**
   * The lookup strategy built from the sizes read at build time; `null` until the first build and
   * after invalidation.
   *
   * @type {PositionStrategy|null}
   */
  #strategy: PositionStrategy | null = null;
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
   * so the uniform strategy is used. The predicate must be conservative: return `false` whenever
   * any per-item size override may exist.
   *
   * @type {Function|undefined}
   */
  readonly #isUniformFn?: () => boolean;
  /**
   * Optional provider of "sparse exceptions": a record of per-index size overrides on top of an
   * otherwise uniform base size (e.g. `wtViewport.oversizedRows` when the size source itself is
   * uniform). When it returns a record, the sparse strategy is used. Return `null` whenever the
   * base sizes are not uniform (per-item size settings or hooks exist).
   *
   * @type {Function|undefined}
   */
  readonly #sparseExceptionsFn?: () => Record<number, number | undefined> | null;
  /**
   * Optional callback invoked whenever the cache is (re)built, in any mode. Lets the owner record
   * the context the sizes were read in (e.g. which row carried the first-rendered-row border
   * compensation at build time).
   *
   * @type {Function|undefined}
   */
  readonly #onBuildFn?: () => void;

  /**
   * @param {object} config The configuration object.
   * @param {Function} config.totalItemsFn A function that returns the total number of items (rows or columns).
   * @param {Function} config.sizeFn A function that returns the size for a given index.
   * @param {Function} config.defaultSizeFn A function that returns the default size for items
   *   that return NaN/undefined.
   * @param {Function} [config.isUniformFn] Optional predicate; when `true`, all items share one size.
   * @param {Function} [config.sparseExceptionsFn] Optional provider of per-index size overrides
   *   on top of a uniform base.
   * @param {Function} [config.onBuildFn] Optional callback invoked on every (re)build.
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
   * The prefix sum array when the current strategy holds one (prefix-sum mode); `null` in the
   * uniform and sparse modes and while the cache is not built. Kept for the `isBuilt()` type
   * guard and its consumers.
   *
   * @type {Float64Array|null}
   */
  get prefixSum(): Float64Array | null {
    return this.#strategy?.prefixSum ?? null;
  }

  /**
   * Builds the lookup strategy by reading the current total items, size function, and default
   * size from the configured providers: uniform when the uniform predicate holds, sparse when
   * the exceptions provider returns overrides, and the full prefix-sum walk otherwise.
   */
  build() {
    const totalItems = this.#totalItemsFn();
    const sizeFn = this.#sizeFn;
    const defaultSize = this.#defaultSizeFn();

    this.totalItems = totalItems;
    this.#onBuildFn?.();

    if (this.#isUniformFn?.()) {
      const size = sampleBaseSize(totalItems - 1, sizeFn, defaultSize);

      this.#strategy = new UniformPositionStrategy(size, totalItems);

      return;
    }

    const exceptions = this.#sparseExceptionsFn?.();

    if (exceptions) {
      this.#strategy = new SparsePositionStrategy(exceptions, totalItems, sizeFn, defaultSize);

      return;
    }

    this.#strategy = new PrefixSumPositionStrategy(totalItems, sizeFn, defaultSize);
  }

  /**
   * Returns the cumulative size at an index (sum of items 0..index-1).
   *
   * @param {number} index The item index.
   * @returns {number} The cumulative size before this index, or `0` when the cache is not built.
   */
  getOffset(index: number): number {
    return this.#strategy?.getOffset(index) ?? 0;
  }

  /**
   * Finds the item index at a given pixel offset.
   *
   * @param {number} offset The pixel offset.
   * @returns {number} The index whose cumulative start position is at or just before the offset.
   *   Returns `0` when there are no items or the cache is not built.
   */
  findIndexAtOffset(offset: number): number {
    return this.#strategy?.findIndexAtOffset(offset) ?? 0;
  }

  /**
   * Returns the size of a single item at the given index.
   *
   * @param {number} index The item index.
   * @returns {number} The size of the item, or `0` outside the item range or when not built.
   */
  getSizeAt(index: number): number {
    return this.#strategy?.getSizeAt(index) ?? 0;
  }

  /**
   * Returns the total size of all items.
   *
   * @returns {number}
   */
  getTotalSize() {
    return this.#strategy?.getTotalSize() ?? 0;
  }

  /**
   * Builds the lookup strategy only when the cache is not yet built or the item count has
   * changed.
   */
  ensureBuilt() {
    if (!this.isCurrent()) {
      this.build();
    }
  }

  /**
   * Invalidates the cache so it will be rebuilt on the next
   * {@link PositionCache#ensureBuilt} call.
   */
  invalidate() {
    this.#strategy = null;
    this.totalItems = 0;
  }

  /**
   * Returns whether the cache holds a prefix-sum array (heterogeneous mode). The uniform and
   * sparse strategies keep `prefixSum` as `null`, so this is `false` there; use it only as the
   * prefix-sum type guard.
   *
   * @returns {boolean}
   */
  isBuilt(): this is PositionCache & { prefixSum: Float64Array } {
    return this.prefixSum !== null;
  }

  /**
   * Returns whether the cache currently holds valid built data for the current item count, in any
   * mode. Unlike {@link PositionCache#isBuilt} (a prefix-sum-mode type guard that is always `false`
   * in the uniform and sparse modes), this reflects the real build/invalidate state:
   * {@link PositionCache#build} sets it regardless of mode, {@link PositionCache#invalidate} clears
   * it, and a changed item count makes it stale (mirroring {@link PositionCache#ensureBuilt}). It is
   * the signal for "the sizes the pre-render calculators read are still current" — e.g.
   * `markOversizedRows` invalidates the row cache here when it finds a genuinely oversized row.
   *
   * @returns {boolean}
   */
  isCurrent(): boolean {
    return this.#strategy !== null && this.totalItems === this.#totalItemsFn();
  }
}
