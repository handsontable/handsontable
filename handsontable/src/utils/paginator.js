/**
 * @typedef Paginator
 * @property {function(number): void} setCurrentPage Sets the current index to the specific page.
 * @property {function(): number} getCurrentPage Gets the current page.
 * @property {function(): void} toFirstItem Move the index to the first page.
 * @property {function(): void} toLastItem Move the index to the last page.
 * @property {function(): void} toNextItem Move the index to the next page.
 * @property {function(): void} toPreviousItem Move the index to the previous page.
 * @property {function(): void} clear Clear the internal state of the paginator.
 */
/**
 * @param {object} options Paginator options.
 * @param {function(): number} [options.size] Sets the max size of the pages.
 * @param {function(number): boolean | void} [options.onItemSelect] Fires the function on each page change.
 * @param {function(): void} [options.onClear] Fires the function after clearing the state.
 * @returns {Paginator}
 */
export function createPaginator({ size = () => 0, onItemSelect = () => {}, onClear = () => {} }) {
  const visitedPages = new Set();
  const maxSize = size;
  let currentIndex = -1;
  let previousIndex = -1;

  /**
   * Updates the internal state of the paginator.
   */
  function _updateState() {
    const lastIndex = maxSize() - 1;

    if (currentIndex < 0) {
      currentIndex = lastIndex;
      previousIndex = lastIndex;
    }
    if (currentIndex > lastIndex) {
      currentIndex = 0;
      previousIndex = -1;
    }

    if (visitedPages.has(currentIndex)) {
      return;
    }

    visitedPages.add(currentIndex);

    const changeProceed = onItemSelect(currentIndex, false);

    if (changeProceed === false) {
      currentIndex += currentIndex > previousIndex ? 1 : -1;
      _updateState();
    }

    previousIndex = currentIndex;
  }

  /**
   * Sets the page index as current one.
   *
   * @param {number} index The index to set.
   */
  function setCurrentPage(index) {
    currentIndex = index;
    previousIndex = index;
    onItemSelect(currentIndex, true);
  }

  /**
   * Gets the current page.
   *
   * @returns {number}
   */
  function getCurrentPage() {
    return currentIndex;
  }

  /**
   * Moves the index to the first page.
   */
  function toFirstItem() {
    visitedPages.clear();
    currentIndex = 0;
    previousIndex = currentIndex - 1;
    _updateState();
  }

  /**
   * Moves the index to the last page.
   */
  function toLastItem() {
    visitedPages.clear();
    currentIndex = maxSize() - 1;
    previousIndex = currentIndex + 1;
    _updateState();
  }

  /**
   * Moves the index to the next page.
   */
  function toNextItem() {
    visitedPages.clear();
    currentIndex += 1;
    _updateState();
  }

  /**
   * Moves the index to the previous page.
   */
  function toPreviousItem() {
    visitedPages.clear();
    currentIndex -= 1;
    _updateState();
  }

  /**
   * Clears the internal state of the paginator.
   */
  function clear() {
    visitedPages.clear();
    currentIndex = -1;
    previousIndex = -1;
    onClear();
  }

  return {
    setCurrentPage,
    getCurrentPage,
    toFirstItem,
    toLastItem,
    toNextItem,
    toPreviousItem,
    clear,
  };
}
