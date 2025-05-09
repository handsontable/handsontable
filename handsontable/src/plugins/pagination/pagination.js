import { BasePlugin } from '../base';

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

  #pagedRowsMap = null;
  #currentPage = 1;
  #totalPages = 1;
  #pageSize = 10;
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

  getPaginationData() {
    return {
      currentPage: this.#currentPage,
      totalPages: this.#totalPages,
      pageSize: this.#pageSize,
    };
  }

  setPage(pageNumber) {
    if (pageNumber === 0) {
      pageNumber = 1;
    }

    this.hot.runHooks('beforePageChange', this.#currentPage, pageNumber);

    this.#currentPage = pageNumber;
    this.#internalCall = true;

    this.#pagedRowsMap.clear();

    this.hot.batchExecution(() => {
      const renderableIndexes = this.hot.rowIndexMapper.getRenderableIndexes();

      renderableIndexes.splice((this.#currentPage - 1) * this.#pageSize, this.#pageSize);
      renderableIndexes.forEach(idx => this.#pagedRowsMap.setValueAtIndex(idx, true));
    }, true);

    this.#internalCall = false;

    this.hot.runHooks('afterPageChange', this.#currentPage);
    this.hot.render();
  }

  setPageSize(pageSize) {
    this.hot.runHooks('beforePageSizeChange', this.#pageSize, pageSize);
    this.#pageSize = pageSize;
    this.hot.runHooks('afterPageSizeChange', this.#pageSize, pageSize);
  }

  nextPage() {
    this.goToPage(this.#currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.#currentPage - 1);
  }

  firstPage() {
    this.goToPage(0);
  }

  lastPage() {
    this.goToPage(10);
  }

  hasPreviousPage() {

  }

  hasNextPage() {

  }

  resetPageIndex() {
    this.#currentPage = 1;
  }

  resetPageSize() {
    this.#pageSize = this.getSetting('pageSize');
  }

  resetPagination() {
    this.resetPageIndex();
    this.resetPageSize();
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

  #onIndexCacheUpdate() {
    if (this.#internalCall) {
      return;
    }

    this.setPage(this.#currentPage);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
