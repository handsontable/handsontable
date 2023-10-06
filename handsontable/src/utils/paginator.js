/**
 * @typedef Paginator
 * @property {function(number): void} setCurrentPage Sets the current index to the specific page.
 * @property {function(): number} getCurrentPage Gets the current page.
 * @property {function(): void} toFirstPage Move the index to the first page.
 * @property {function(): void} toLastPage Move the index to the last page.
 * @property {function(): void} toNextPage Move the index to the next page.
 * @property {function(): void} toPreviousPage Move the index to the previous page.
 * @property {function(): void} clear Clear the internal state of the paginator.
 */
/**
 * @param {object} options Paginator options.
 * @param {function(): number} [options.size] Sets the max size of the pages.
 * @param {function(number): boolean | void} [options.onPageChange] Fires the function on each page change.
 * @returns {Paginator}
 */
export function createPaginator({ size = () => 0, onPageChange = () => {} }) {
  const visitedPages = new Set();
  const maxSize = size;
  let currentPage = -1;
  let previousPage = -1;

  /**
   * Updates the internal state of the paginator.
   */
  function _updateState() {
    const lastPage = maxSize() - 1;

    if (currentPage < 0) {
      currentPage = lastPage;
      previousPage = lastPage;
    }
    if (currentPage > lastPage) {
      currentPage = 0;
      previousPage = -1;
    }

    if (visitedPages.has(currentPage)) {
      return;
    }

    visitedPages.add(currentPage);

    const changeProceed = onPageChange(currentPage, false);

    if (changeProceed === false) {
      currentPage += currentPage > previousPage ? 1 : -1;
      _updateState();
    }

    previousPage = currentPage;
  }

  /**
   * Sets the page index as current one.
   *
   * @param {number} page The index to set.
   */
  function setCurrentPage(page) {
    currentPage = page;
    onPageChange(currentPage, true);
  }

  /**
   * Gets the current page.
   *
   * @returns {number}
   */
  function getCurrentPage() {
    return currentPage;
  }

  /**
   * Moves the index to the first page.
   */
  function toFirstPage() {
    visitedPages.clear();
    currentPage = 0;
    previousPage = currentPage - 1;
    _updateState();
  }

  /**
   * Moves the index to the last page.
   */
  function toLastPage() {
    visitedPages.clear();
    currentPage = maxSize() - 1;
    previousPage = currentPage + 1;
    _updateState();
  }

  /**
   * Moves the index to the next page.
   */
  function toNextPage() {
    visitedPages.clear();
    currentPage += 1;
    _updateState();
  }

  /**
   * Moves the index to the previous page.
   */
  function toPreviousPage() {
    visitedPages.clear();
    currentPage -= 1;
    _updateState();
  }

  /**
   * Clears the internal state of the paginator.
   */
  function clear() {
    visitedPages.clear();
    currentPage = -1;
    previousPage = -1;
  }

  return {
    setCurrentPage,
    getCurrentPage,
    toFirstPage,
    toLastPage,
    toNextPage,
    toPreviousPage,
    clear,
  };
}
