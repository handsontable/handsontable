import type { PositionStrategy } from './strategy';

/**
 * Position lookups for items that all share one size: every answer is plain arithmetic — no
 * allocation, no iteration. Active when the size source reports uniform sizes and no per-item
 * override (e.g. a measured oversized row) exists.
 */
export class UniformPositionStrategy implements PositionStrategy {
  /**
   * Uniform mode never holds a prefix-sum array.
   *
   * @type {null}
   */
  readonly prefixSum = null;
  /**
   * The size shared by every item.
   *
   * @type {number}
   */
  readonly #size: number;
  /**
   * The total item count read at build time.
   *
   * @type {number}
   */
  readonly #totalItems: number;

  /**
   * @param {number} size The size shared by every item.
   * @param {number} totalItems The total item count read at build time.
   */
  constructor(size: number, totalItems: number) {
    this.#size = size;
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

    return Math.min(index, this.#totalItems) * this.#size;
  }

  /**
   * Finds the item index at a given pixel offset arithmetically.
   *
   * @param {number} offset The pixel offset.
   * @returns {number} The index whose cumulative start position is at or just before the offset.
   */
  findIndexAtOffset(offset: number): number {
    if (offset <= 0 || this.#totalItems === 0) {
      return 0;
    }

    return Math.min(Math.floor(offset / this.#size), this.#totalItems - 1);
  }

  /**
   * Returns the size of the single item at the given index.
   *
   * @param {number} index The item index.
   * @returns {number} The item size, or `0` outside the item range.
   */
  getSizeAt(index: number): number {
    if (index < 0 || index >= this.#totalItems) {
      return 0;
    }

    return this.#size;
  }

  /**
   * Returns the total size of all items.
   *
   * @returns {number}
   */
  getTotalSize(): number {
    return this.#totalItems * this.#size;
  }
}
