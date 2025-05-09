import { BasePlugin } from '../base';
import { clamp } from '../../helpers/number';

export const PLUGIN_KEY = 'pagination';
export const PLUGIN_PRIORITY = 500;

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin Pagination
 * @class Pagination
 */
export class Pagination extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      pageSize: 10,
      pageList: [5, 10, 20, 50, 100],
      initialPage: 1,
      autoPageSize: false,
      showPageSize: true,
      showCounter: true,
      showNavigation: true,
    };
  }

  /**
   * Map of hidden rows controlled by the pagination plugin.
   *
   * @type {HiddenMap | null}
   */
  #pagedRowsMap = null;
  /**
   * Current page number.
   *
   * @type {number}
   */
  #currentPage = 1;
  /**
   * Total number of pages.
   *
   * @type {number}
   */
  #totalPages = 1;
  /**
   * Page size.
   *
   * @type {number}
   */
  #pageSize = 10;
  /**
   * Flag indicating if the plugin is in the process of updating the index cache. Prevents
   * circular calls when the index cache is updated.
   *
   * @type {boolean}
   */
  #internalCall = false;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link Pagination#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#pageSize = this.getSetting('pageSize');
    this.#currentPage = this.getSetting('initialPage');
    this.#pagedRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(PLUGIN_KEY, 'hiding');

    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', () => this.#onIndexCacheUpdate());
    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper.unregisterMap(PLUGIN_KEY);

    super.disablePlugin();
  }

  /**
   * Gets the pagination current state.
   *
   * @returns {{ currentPage: number, totalPages: number, pageSize: number }}
   */
  getPaginationData() {
    return {
      currentPage: this.#currentPage,
      totalPages: this.#totalPages,
      pageSize: this.#pageSize,
    };
  }

  /**
   * Allows changing the page for specified page number.
   *
   * @param {number} pageNumber The page number to set (1 to N).
   */
  setPage(pageNumber) {
    this.hot.runHooks('beforePageChange', this.#currentPage, pageNumber);

    this.#currentPage = pageNumber;
    this.#computeAndApply();

    this.hot.runHooks('afterPageChange', this.#currentPage);
    this.hot.render();
  }

  /**
   * Changes the page size for the pagination. The method recalculates the state based
   * on the new page size and re-renders the table.
   *
   * @param {number} pageSize The page size to set.
   */
  setPageSize(pageSize) {
    this.hot.runHooks('beforePageSizeChange', this.#pageSize, pageSize);
    this.#pageSize = pageSize;
    this.#computeAndApply();
    this.hot.runHooks('afterPageSizeChange', this.#pageSize, pageSize);
  }

  /**
   * Switches the page to the next one.
   */
  nextPage() {
    this.setPage(this.#currentPage + 1);
  }

  /**
   * Switches the page to the previous one.
   */
  prevPage() {
    this.setPage(this.#currentPage - 1);
  }

  /**
   * Switches the page to the first one.
   */
  firstPage() {
    this.setPage(1);
  }

  /**
   * Switches the page to the last one.
   */
  lastPage() {
    this.setPage(this.#totalPages);
  }

  /**
   * Checks, based on the current internal state, if there will be a previous page.
   *
   * @returns {boolean}
   */
  hasPreviousPage() {
    return this.#currentPage > 1;
  }

  /**
   * Checks, based on the current internal state, if there will be a next page.
   *
   * @returns {boolean}
   */
  hasNextPage() {
    return this.#currentPage < this.#totalPages;
  }

  showPageSizeSection() {
    this.hot.runHooks('afterPageSizeVisibilityChange', true);
  }

  hidePageSizeSection() {
    this.hot.runHooks('afterPageSizeVisibilityChange', false);
  }

  showPageCounterSection() {
    this.hot.runHooks('afterPageCounterVisibilityChange', true);
  }

  hidePageCounterSection() {
    this.hot.runHooks('afterPageCounterVisibilityChange', false);
  }

  showPageNavigationSection() {
    this.hot.runHooks('afterPageNavigationVisibilityChange', true);
  }

  hidePageNavigationSection() {
    this.hot.runHooks('afterPageNavigationVisibilityChange', false);
  }

  /**
   * Filters and calculates the pagination state and applies the changes to the
   * IndexMapper.
   */
  #computeAndApply() {
    const totalRows = this.hot.countRows();
    const pageSize = this.#pageSize;

    if (pageSize < 1) {
      throw new Error('The `pageSize` must be greater than 0');
    }

    this.#totalPages = Math.ceil(totalRows / pageSize);
    this.#currentPage = clamp(this.#currentPage, 1, this.#totalPages);

    this.#internalCall = true;
    this.#pagedRowsMap.clear();

    this.hot.batchExecution(() => {
      const renderableIndexes = this.hot.rowIndexMapper.getRenderableIndexes();

      renderableIndexes.splice((this.#currentPage - 1) * this.#pageSize, this.#pageSize);
      renderableIndexes.forEach(index => this.#pagedRowsMap.setValueAtIndex(index, true));
    }, true);

    this.#internalCall = false;
  }

  /**
   * IndexMapper cache update listener. Once the cache is updated, we need to recompute
   * the pagination state.
   */
  #onIndexCacheUpdate() {
    if (this.#internalCall) {
      return;
    }

    this.#computeAndApply();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
