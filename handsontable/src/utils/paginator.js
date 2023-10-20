import { clamp } from '../helpers/number';

/**
 * @typedef Paginator
 * @property {function(number): void} setCurrentPage Sets the current index to the specific page.
 * @property {function(): number} getCurrentPage Gets the current page.
 * @property {function(): number} getSize Gets the total number of pages.
 * @property {function(): void} toFirstItem Move the index to the first page.
 * @property {function(): void} toLastItem Move the index to the last page.
 * @property {function(): void} toNextItem Move the index to the next page.
 * @property {function(): void} toPreviousItem Move the index to the previous page.
 * @property {function(): void} clear Clear the internal state of the paginator.
 */
/**
 * @param {object} options Paginator options.
 * @param {number} [options.initialPage] Initial index from which paging starts. Also, after clearing the paginator
 * the page is cleared to the initial page.
 * @param {function(): number} [options.size] Sets the max size of the pages.
 * @param {function(number): boolean | void} [options.onItemSelect] Fires the function on each page change.
 * @param {function(): void} [options.onClear] Fires the function after clearing the state.
 * @returns {Paginator}
 */
export function createPaginator({
  initialPage = -1,
  size = () => 0,
  onItemSelect = () => {},
  onClear = () => {},
}) {
  const visitedPages = new Set();
  let currentIndex = clamp(initialPage, -1, getSize() - 1);

  /**
   * Updates the internal state of the paginator.
   *
   * @param {number} newIndex The page index to switch.
   * @param {-1|1} direction The direction of traversing the pages in case when they are disabled.
   * @returns {number} Returns the final index of the page.
   */
  function _updateState(newIndex, direction) {
    const lastIndex = getSize() - 1;

    if (newIndex < 0) {
      newIndex = lastIndex;
    }
    if (newIndex > lastIndex) {
      newIndex = 0;
    }

    if (visitedPages.has(newIndex)) {
      return -1;
    }

    visitedPages.add(newIndex);

    const changeProceed = onItemSelect(newIndex, false);

    if (changeProceed === false) {
      newIndex = _updateState(
        direction === 1 ? ++newIndex : --newIndex, // eslint-disable-line no-plusplus
        direction
      );
    }

    return newIndex;
  }

  /**
   * Sets the page index as current one.
   *
   * @param {number} index The index to set.
   */
  function setCurrentPage(index) {
    if (index > -1 && index < getSize() && onItemSelect(index, true) !== false) {
      currentIndex = index;
    }
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
    if (getSize() > 0) {
      visitedPages.clear();
      currentIndex = _updateState(0, 1);
    }
  }

  /**
   * Moves the index to the last page.
   */
  function toLastItem() {
    if (getSize() > 0) {
      visitedPages.clear();
      currentIndex = _updateState(getSize() - 1, -1);
    }
  }

  /**
   * Moves the index to the next page.
   */
  function toNextItem() {
    if (getSize() > 0) {
      visitedPages.clear();
      currentIndex = _updateState(++currentIndex, 1); // eslint-disable-line no-plusplus
    }
  }

  /**
   * Moves the index to the previous page.
   */
  function toPreviousItem() {
    if (getSize() > 0) {
      visitedPages.clear();
      currentIndex = _updateState(--currentIndex, -1); // eslint-disable-line no-plusplus
    }
  }

  /**
   * Gets the total number of pages.
   *
   * @returns {number}
   */
  function getSize() {
    return Math.max(size(), 0);
  }

  /**
   * Clears the internal state of the paginator.
   */
  function clear() {
    visitedPages.clear();
    currentIndex = initialPage;
    onClear();
  }

  return {
    setCurrentPage,
    getCurrentPage,
    toFirstItem,
    toLastItem,
    toNextItem,
    toPreviousItem,
    getSize,
    clear,
  };
}
