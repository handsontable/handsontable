/**
 * The view order is a list of indexes that represent the order of the rendered elements.
 *
 * @class {ViewOrder}
 */
export class ViewOrder {
  order = [];

  constructor(viewOffset, viewSize) {
    this.order = [...Array(viewSize).keys()].map(i => viewOffset + i);
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
    return this.order.indexOf(offsetIndex) > -1;
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
    this.order.splice(this.order.indexOf(offsetIndex), 1);
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

    return this.order.pop();
  }
}
