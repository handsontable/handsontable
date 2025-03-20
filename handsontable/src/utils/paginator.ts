import { clamp } from '../helpers/number';

interface PaginatorOptions {
  initialPage?: number;
  size?: () => number;
  onItemSelect?: (index: number, isDirectChange: boolean) => boolean | void;
  onClear?: () => void;
}

interface Paginator {
  setCurrentPage(index: number): void;
  getCurrentPage(): number;
  getSize(): number;
  toFirstItem(): void;
  toLastItem(): void;
  toNextItem(): void;
  toPreviousItem(): void;
  clear(): void;
}

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
}: PaginatorOptions = {}): Paginator {
  const visitedPages = new Set<number>();
  let currentIndex = clamp(initialPage, -1, getSize() - 1);

  /**
   * Updates the internal state of the paginator.
   *
   * @param {number} newIndex The page index to switch.
   * @param {-1|1} direction The direction of traversing the pages in case when they are disabled.
   * @returns {number} Returns the final index of the page.
   */
  function _updateState(newIndex: number, direction: -1 | 1): number {
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
  function setCurrentPage(index: number): void {
    if (index > -1 && index < getSize() && onItemSelect(index, true) !== false) {
      currentIndex = index;
    }
  }

  /**
   * Gets the current page.
   *
   * @returns {number}
   */
  function getCurrentPage(): number {
    return currentIndex;
  }

  /**
   * Moves the index to the first page.
   */
  function toFirstItem(): void {
    if (getSize() > 0) {
      visitedPages.clear();
      currentIndex = _updateState(0, 1);
    }
  }

  /**
   * Moves the index to the last page.
   */
  function toLastItem(): void {
    if (getSize() > 0) {
      visitedPages.clear();
      currentIndex = _updateState(getSize() - 1, -1);
    }
  }

  /**
   * Moves the index to the next page.
   */
  function toNextItem(): void {
    if (getSize() > 0) {
      visitedPages.clear();
      currentIndex = _updateState(++currentIndex, 1); // eslint-disable-line no-plusplus
    }
  }

  /**
   * Moves the index to the previous page.
   */
  function toPreviousItem(): void {
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
  function getSize(): number {
    return Math.max(size(), 0);
  }

  /**
   * Clears the internal state of the paginator.
   */
  function clear(): void {
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
