import type { PositionStrategy } from './strategy';
import { lowerBound, sampleBaseSize } from './strategy';

/**
 * Position lookups for a uniform base size plus per-index overrides ("exceptions" — e.g. the
 * DOM-measured oversized rows on top of the default row height). Stores only the exceptions:
 * their sorted indexes and the prefix sums of their size deltas against the base. Building costs
 * O(exceptions log exceptions) — independent of the total item count — and every offset is
 * `index × base + binary-searched delta sum`. At 1M uniform rows with a few thousand oversized
 * rows this replaces a 1M-iteration prefix-sum build and an 8 MB allocation per rebuild.
 */
export class SparsePositionStrategy implements PositionStrategy {
  /**
   * Sparse mode never holds a full prefix-sum array.
   *
   * @type {null}
   */
  readonly prefixSum = null;
  /**
   * The base size shared by every non-exception item.
   *
   * @type {number}
   */
  readonly #base: number;
  /**
   * The total item count read at build time.
   *
   * @type {number}
   */
  readonly #totalItems: number;
  /**
   * Sorted item indexes that override the base size.
   *
   * @type {Float64Array}
   */
  readonly #indexes: Float64Array;
  /**
   * Prefix sums of the exceptions' size deltas against the base: `#deltaPrefix[j]` is the summed
   * extra size of the first `j` exceptions. One element longer than `#indexes`.
   *
   * @type {Float64Array}
   */
  readonly #deltaPrefix: Float64Array;
  /**
   * Exception sizes keyed by item index, for O(1) single-item reads.
   *
   * @type {Map<number, number>}
   */
  readonly #sizes: Map<number, number>;

  /**
   * @param {Record<number, number|undefined>} exceptions Per-index size overrides.
   * @param {number} totalItems The total item count read at build time.
   * @param {Function} sizeFn A function that returns the size for a given index.
   * @param {number} defaultSize The default item size read at build time.
   */
  constructor(
    exceptions: Record<number, number | undefined>,
    totalItems: number,
    sizeFn: (index: number) => number,
    defaultSize: number,
  ) {
    const sizes = new Map<number, number>();

    for (const key of Object.keys(exceptions)) {
      const index = Number(key);

      // Skip wiped records and records of items that no longer exist (item count shrank).
      if (exceptions[index] !== undefined && index >= 0 && index < totalItems) {
        // The record supplies only the KEY set. The size is read through `sizeFn` — the same
        // resolution the prefix-sum strategy applies per item — so both strategies agree on
        // every exception. Reading the record's raw value instead would skip the size funnel's
        // clamp (`max(provided size, measured oversized size)`) and under-count a stale record
        // whose provided size grew after it was measured.
        const size = sizeFn(index);

        sizes.set(index, isNaN(size) ? defaultSize : size);
      }
    }

    // Integer-like record keys already arrive in ascending order (`Object.keys` index-key
    // ordering, preserved through the Map). The sort is defensive only — it guards the binary
    // searches against a future non-index-keyed provider, and it is numeric by default on a
    // typed array.
    const indexes = Float64Array.from(sizes.keys()).sort();

    // Sample the base from the LAST non-exception item (see `sampleBaseSize` for why the last).
    // Walk past trailing exception items; with every item excepted, fall back to the default size.
    let sampleIndex = totalItems - 1;

    while (sampleIndex >= 0 && sizes.has(sampleIndex)) {
      sampleIndex -= 1;
    }

    const base = sampleBaseSize(sampleIndex, sizeFn, defaultSize);
    const deltaPrefix = new Float64Array(indexes.length + 1);

    for (let j = 0; j < indexes.length; j++) {
      deltaPrefix[j + 1] = deltaPrefix[j] + (sizes.get(indexes[j])! - base);
    }

    this.#base = base;
    this.#totalItems = totalItems;
    this.#indexes = indexes;
    this.#deltaPrefix = deltaPrefix;
    this.#sizes = sizes;
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

    const clamped = Math.min(index, this.#totalItems);

    return (clamped * this.#base) + this.#deltaPrefix[this.#countExceptionsBelow(clamped)];
  }

  /**
   * Finds the item index at a given pixel offset by binary-searching the index space over
   * `getOffset` (O(log n log k)). Same return semantics as the prefix-sum strategy.
   *
   * @param {number} offset The pixel offset.
   * @returns {number} The index whose cumulative start position is at or just before the offset.
   */
  findIndexAtOffset(offset: number): number {
    if (offset <= 0 || this.#totalItems === 0) {
      return 0;
    }

    const index = lowerBound(this.#totalItems, mid => this.getOffset(mid + 1) <= offset);

    return Math.min(index, this.#totalItems - 1);
  }

  /**
   * Returns the size of the single item at the given index.
   *
   * @param {number} index The item index.
   * @returns {number} The exception size, the base size, or `0` outside the item range.
   */
  getSizeAt(index: number): number {
    if (index < 0 || index >= this.#totalItems) {
      return 0;
    }

    return this.#sizes.get(index) ?? this.#base;
  }

  /**
   * Returns the total size of all items.
   *
   * @returns {number}
   */
  getTotalSize(): number {
    return (this.#totalItems * this.#base) + this.#deltaPrefix[this.#deltaPrefix.length - 1];
  }

  /**
   * Returns how many exception indexes are smaller than the given index — the position in
   * `#deltaPrefix` holding their summed deltas. Binary search, O(log k).
   *
   * @param {number} index The exclusive upper bound item index.
   * @returns {number} The number of exceptions below the index.
   */
  #countExceptionsBelow(index: number): number {
    const indexes = this.#indexes;

    return lowerBound(indexes.length, mid => indexes[mid] < index);
  }
}
