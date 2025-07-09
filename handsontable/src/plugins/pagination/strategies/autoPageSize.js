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
   * @param {function(): number} options.viewportSizeProvider A function that returns the size of the viewport in pixels.
   */
  calculate({ itemsSizeProvider, viewportSizeProvider }) {
    const itemSizes = itemsSizeProvider();
    const viewportSize = viewportSizeProvider();
    const pages = [];

    let startIndex = 0;
    let totalSize = 1; // 1px border compensation for the first row
    let pageSize = 0;

    for (let index = 0; index < itemSizes.length; index++) {
      const itemSize = itemSizes[index];

      if (pageSize > 0 && totalSize + itemSize >= viewportSize) {
        pages.push({
          startIndex,
          endIndex: index - 1,
          pageSize,
        });

        startIndex = index;
        totalSize = 1; // 1px border compensation for the first row
        pageSize = 0;
      }

      totalSize += itemSize;
      pageSize += 1;
    }

    pages.push({
      startIndex,
      endIndex: Math.max(0, itemSizes.length - 1),
      pageSize
    });

    this.pages = pages;
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
   * @returns {PageInfo | undefined}
   */
  getState(currentPage) {
    currentPage -= 1;

    if (currentPage < 0 || currentPage >= this.getTotalPages()) {
      return;
    }

    return this.pages[currentPage];
  }
}
