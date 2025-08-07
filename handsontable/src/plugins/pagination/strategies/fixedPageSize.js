/**
 * @typedef PageInfo
 * @property {number} startIndex The visual index of the first item in the page.
 * @property {number} endIndex The visual index of the last item in the page.
 * @property {number} pageSize The number of items in the page.
 */

/**
 * The module computes the state of pagination based on a fixed page size.
 *
 * @class FixedPageSizeStrategy
 * @private
 */
export class FixedPageSizeStrategy {
  /**
   * The fixed page size.
   *
   * @type {number}
   */
  pageSize = 1;
  /**
   * Total number of items in the dataset.
   *
   * @type {number}
   */
  totalItems = 0;
  /**
   * Total number of pages.
   *
   * @type {number}
   */
  totalPages = 0;

  /**
   * Calculates the state of pagination.
   *
   * @param {object} options Options for pagination calculation.
   * @param {number} options.pageSize The fixed number of items per page.
   * @param {number} options.totalItems The total number of items in the dataset.
   */
  calculate({ pageSize, totalItems }) {
    this.pageSize = Math.max(pageSize, 1);
    this.totalItems = totalItems;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  /**
   * Gets the total number of pages.
   *
   * @returns {number} The total number of pages.
   */
  getTotalPages() {
    return this.totalPages;
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

    const startIndex = currentPage * this.pageSize;
    const endIndex = Math.max(0, Math.min(startIndex + this.pageSize - 1, this.totalItems - 1));

    return {
      startIndex,
      endIndex,
      pageSize: this.pageSize
    };
  }
}
