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
     * @type {Number}
     */
    this.currentSize = 0;
    /**
     * Next size of the rendered DOM elements which should be fulfilled.
     *
     * @type {Number}
     */
    this.nextSize = 0;
    /**
     * Current offset.
     *
     * @type {Number}
     */
    this.currentOffset = 0;
    /**
     * Next ofset.
     *
     * @type {Number}
     */
    this.nextOffset = 0;
  }

  /**
   * Sets new size of the rendered DOM elements.
   *
   * @param {Number} size
   */
  setSize(size) {
    this.currentSize = this.nextSize;
    this.nextSize = size;
  }

  /**
   * Sets new offset.
   *
   * @param {Number} offset
   */
  setOffset(offset) {
    this.currentOffset = this.nextOffset;
    this.nextOffset = offset;
  }
}
