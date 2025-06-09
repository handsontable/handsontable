/**
 * @typedef PageInfo
 * @property {number} startIndex The visual index of the first item in the page.
 * @property {number} endIndex The visual index of the last item in the page.
 * @property {number} pageSize The number of items in the page.
 */

/**
 * The module computes how many items fit on each page so that the combined
 * height of items never exceeds the available viewport, eliminating vertical scroll.
 * Unlike for "FixedPageSizeStrategy" plugin, this one calculates the "pageSize" for each
 * page every time the `calculate` method is called.
 *
 * @private
 * @class AutoPageSizeStrategy
 */
export class AutoPageSizeStrategy {
  /**
   * @type {PageInfo[]}
   */
  pages = [];

  /**
   * Calculates the state of pagination.
   *
   * @param {object} options Options for pagination calculation.
   * @param {function(): number[]} options.itemsSizeProvider A function that returns an array of item sizes.
   * @param {number} options.viewportSize The size of the viewport in pixels.
   */
  calculate({ itemsSizeProvider, viewportSize }) {
    const itemSizes = itemsSizeProvider();
    const itemSizesLength = itemSizes.length;
    let totalSize = 0;
    let startIndex = 0;
    let endIndex = 0;
    let pageSize = 0;

    this.pages = [];

    for (let index = 0; index < itemSizesLength; index++) {
      const itemSize = itemSizes[index];
      const isLastItem = index === itemSizesLength - 1;

      totalSize += itemSize;

      if (totalSize >= viewportSize || isLastItem) {
        totalSize = itemSize;

        this.pages.push({
          startIndex,
          endIndex,
          pageSize,
        });
        startIndex = index;
        pageSize = 0;
      }

      endIndex = index;
      pageSize += 1;
    }
  }

  /**
   * Gets the total number of pages.
   *
   * @returns {number} The total number of pages.
   */
  getTotalPages() {
    return this.pages.length;
  }

  /**
   * Gets the state of a specific page.
   *
   * @param {number} currentPage The current page number (1-based index).
   * @returns {PageInfo}
   */
  getState(currentPage) {
    return this.pages[currentPage - 1];
  }
}
