/**
 * Holder for current and next size (count of rendered and to render DOM elements) and offset.
 *
 * @class {ViewSize}
 */
export default class ViewSize {
  constructor() {
    /**
     * Current size of the rendered DOM elements.
     *
     * @type {number}
     */
    this.currentSize = 0;
    /**
     * Next size of the rendered DOM elements which should be fulfilled.
     *
     * @type {number}
     */
    this.nextSize = 0;
    /**
     * Current offset.
     *
     * @type {number}
     */
    this.currentOffset = 0;
    /**
     * Next ofset.
     *
     * @type {number}
     */
    this.nextOffset = 0;
  }

  /**
   * Sets new size of the rendered DOM elements.
   *
   * @param {number} size The size.
   */
  setSize(size) {
    this.currentSize = this.nextSize;
    this.nextSize = size;
  }

  /**
   * Sets new offset.
   *
   * @param {number} offset The offset.
   */
  setOffset(offset) {
    this.currentOffset = this.nextOffset;
    this.nextOffset = offset;
  }
}
