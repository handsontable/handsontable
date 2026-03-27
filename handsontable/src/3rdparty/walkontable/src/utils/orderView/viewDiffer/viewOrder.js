/**
 * The view order is a list of indexes that represent the order of the rendered elements.
 * Uses a Set alongside the array for O(1) membership checks.
 *
 * @class {ViewOrder}
 */
export class ViewOrder {
  order = [];
  #indexSet = new Set();

  constructor(viewOffset, viewSize) {
    const order = new Array(viewSize);
    const indexSet = this.#indexSet;

    for (let i = 0; i < viewSize; i++) {
      const value = viewOffset + i;

      order[i] = value;
      indexSet.add(value);
    }
    this.order = order;
  }

  /**
   * The length of the view order.
   *
   * @returns {number}
   */
  get length() {
    return this.order.length;
  }

  /**
   * Checks if the view order contains the offset index.
   *
   * @param {number} offsetIndex The offset index.
   * @returns {boolean}
   */
  has(offsetIndex) {
    return this.#indexSet.has(offsetIndex);
  }

  /**
   * Gets the offset index at the given zero-based index. If the index
   * is out of bounds, -1 is returned.
   *
   * @param {number} zeroBasedIndex The zero-based index.
   * @returns {number}
   */
  get(zeroBasedIndex) {
    return zeroBasedIndex < this.order.length ? this.order[zeroBasedIndex] : -1;
  }

  /**
   * Removes the offset index from the view order.
   *
   * @param {number} offsetIndex The offset index.
   */
  remove(offsetIndex) {
    const idx = this.order.indexOf(offsetIndex);

    if (idx > -1) {
      this.order.splice(idx, 1);
      this.#indexSet.delete(offsetIndex);
    }
  }

  /**
   * Prepends the offset index to the view order. To keep the order length constant,
   * the last offset index is removed.
   *
   * @param {number} offsetIndex The offset index.
   * @returns {number}
   */
  prepend(offsetIndex) {
    this.order.unshift(offsetIndex);
    this.#indexSet.add(offsetIndex);

    const removed = this.order.pop();

    this.#indexSet.delete(removed);

    return removed;
  }
}
