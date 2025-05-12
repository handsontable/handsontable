import { BasePlugin } from '../base';
import { clamp } from '../../helpers/number';
import { html } from '../../helpers/templateLiteralTag';

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
  #elementRefs;

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

    const elements = html`
      <div data-ref="container" class="htPaginationContainer">
        <div data-ref="rangeDisplay" class="htPaginationInfo"></div>
        <div class="htPaginationControls">
          <button data-ref="first">&laquo;</button>
          <button data-ref="prev">&lsaquo;</button>
          <span data-ref="indicatorDisplay"></span>
          <button data-ref="next">&rsaquo;</button>
          <button data-ref="last">&raquo;</button>
        </div>
      </div>
    `;

    this.#elementRefs = elements.refs;

    this.#elementRefs.first.addEventListener('click', () => this.firstPage());
    this.#elementRefs.prev.addEventListener('click', () => this.prevPage());
    this.#elementRefs.next.addEventListener('click', () => this.nextPage());
    this.#elementRefs.last.addEventListener('click', () => this.lastPage());

    this.hot.rootWrapperElement.appendChild(elements.fragment);
    this.hot.rootElement.style.borderRadius = '0px';

    this.#pageSize = this.getSetting('pageSize');
    this.#currentPage = this.getSetting('initialPage');
    this.#pagedRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(PLUGIN_KEY, 'hiding');

    this.hot.addHook('beforeSelectColumns', this.#onBeforeSelectColumns.bind(this));
    this.hot.addHook('beforeSetRangeEnd', this.#onBeforeSetRangeEnd.bind(this));
    this.hot.addHook('afterRender', () => {
      this.#elementRefs.container.style.width = `${this.hot.rootElement.offsetWidth}px`;
    });
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
      // TODO (perf tip): reverse the logic by showing only the visible indexes not hiding the rest - if possible
      const renderableIndexes = this.hot.rowIndexMapper.getRenderableIndexes();

      renderableIndexes.splice((this.#currentPage - 1) * this.#pageSize, this.#pageSize);
      renderableIndexes.forEach(index => this.#pagedRowsMap.setValueAtIndex(index, true));
    }, true);

    this.#internalCall = false;

    this.#updateDOMState();
  }

  #updateDOMState() {
    const pageSize = this.#pageSize;
    const totalRows = this.hot.countRows();
    const startRow = (this.#currentPage - 1) * (pageSize + 1);
    const endRow = Math.min(this.#currentPage * pageSize, totalRows);

    this.#elementRefs.rangeDisplay.textContent = `${startRow} - ${endRow} of ${totalRows}`;
    this.#elementRefs.indicatorDisplay.textContent = `Page ${this.#currentPage} of ${this.#totalPages}`;

    if (this.#currentPage === 1) {
      this.#elementRefs.first.setAttribute('disabled', true);
      this.#elementRefs.prev.setAttribute('disabled', true);
    } else {
      this.#elementRefs.first.removeAttribute('disabled');
      this.#elementRefs.prev.removeAttribute('disabled');
    }

    if (this.#currentPage === this.#totalPages) {
      this.#elementRefs.next.setAttribute('disabled', true);
      this.#elementRefs.last.setAttribute('disabled', true);
    } else {
      this.#elementRefs.next.removeAttribute('disabled');
      this.#elementRefs.last.removeAttribute('disabled');
    }
  }

  /**
   * Called before the selection of columns is made. It modifies the selection to the range of
   * the current page.
   *
   * @param {CellCoords} from Starting cell coordinates.
   * @param {CellCoords} to Ending cell coordinates.
   */
  #onBeforeSelectColumns(from, to) {
    const rowStart = (this.#currentPage - 1) * this.#pageSize;

    if (this.#currentPage > 1 || from.row >= 0) {
      from.row = rowStart;
    }

    to.row = Math.min(rowStart + this.#pageSize - 1, this.hot.countRows() - 1);
  }

  /**
   * Called before the selection end is fired. It modifies the selection to the range of
   * the current page.
   *
   * @param {CellCoords} coords Ending cell coordinates.
   */
  #onBeforeSetRangeEnd(coords) {
    if (this.hot.selection.isSelectedByColumnHeader()) {
      const rowStart = (this.#currentPage - 1) * this.#pageSize;

      coords.row = Math.min(rowStart + this.#pageSize - 1, this.hot.countRows() - 1);
    }
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
    this.#pagedRowsMap = null;
    super.destroy();
  }
}
