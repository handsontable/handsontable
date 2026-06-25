/**
 * Holder for current and next size (count of rendered and to render DOM elements) and offset.
 *
 * @class {ViewSize}
 */
export class ViewSize {
  /**
   * Size of the rendered DOM elements which should be fulfilled.
   *
   * @type {number}
   */
  nextSize = 0;
  /**
   * Offset of the first rendered element according to the scroll position.
   *
   * @type {number}
   */
  nextOffset = 0;

  /**
   * Sets new size of the rendered DOM elements.
   *
   * @param {number} size The size.
   */
  setSize(size: number) {
    this.nextSize = size;
  }

  /**
   * Sets new offset.
   *
   * @param {number} offset The offset.
   */
  setOffset(offset: number) {
    this.nextOffset = offset;
  }
}
