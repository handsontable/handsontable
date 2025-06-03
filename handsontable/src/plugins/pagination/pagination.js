import { BasePlugin } from '../base';
import { clamp } from '../../helpers/number';
import { PaginationUI } from './ui';
import { checkPluginSettingsConflict } from './utils';
import { announce } from '../../utils/a11yAnnouncer';

export const PLUGIN_KEY = 'pagination';
export const PLUGIN_PRIORITY = 900;

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
      pageSizeList: [5, 10, 20, 50, 100],
      initialPage: 1,
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
   * UI instance of the pagination plugin.
   *
   * @type {PaginationUI}
   */
  #ui = null;

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
    if (checkPluginSettingsConflict(this.hot.getSettings())) {
      this.hot.getSettings()[PLUGIN_KEY] = false;

      return;
    }

    if (this.enabled) {
      return;
    }

    this.#pageSize = this.getSetting('pageSize');
    this.#currentPage = this.getSetting('initialPage');
    this.#pagedRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginName, 'hiding', false);

    if (!this.#ui) {
      this.#ui = new PaginationUI({
        rootElement: this.hot.rootElement,
        phraseTranslator: (...args) => this.hot.getTranslatedPhrase(...args),
        shouldHaveBorder: () => this.#computeNeedsBorder(),
        a11yAnnouncer: message => announce(message),
      });

      if (this.getSetting('showPageSize')) {
        this.showPageSizeSection();
      } else {
        this.hidePageSizeSection();
      }

      if (this.getSetting('showCounter')) {
        this.showPageCounterSection();
      } else {
        this.hidePageCounterSection();
      }

      if (this.getSetting('showNavigation')) {
        this.showPageNavigationSection();
      } else {
        this.hidePageNavigationSection();
      }

      this.#ui
        .addLocalHook('firstPageClick', () => this.firstPage())
        .addLocalHook('prevPageClick', () => this.prevPage())
        .addLocalHook('nextPageClick', () => this.nextPage())
        .addLocalHook('lastPageClick', () => this.lastPage())
        .addLocalHook('pageSizeChange', pageSize => this.setPageSize(pageSize));
    }

    this.addHook('beforeSelectAll', (...args) => this.#onBeforeSelectAllRows(...args));
    this.addHook('beforeSelectColumns', (...args) => this.#onBeforeSelectAllRows(...args));
    this.addHook('beforeSetRangeEnd', (...args) => this.#onBeforeSetRangeEnd(...args));
    this.addHook('beforeSelectionHighlightSet', (...args) => this.#onBeforeSelectionHighlightSet(...args));
    this.addHook('afterRender', (...args) => this.#onAfterRender(...args));
    this.addHook('afterScrollVertically', (...args) => this.#onAfterScrollVertically(...args));
    this.addHook('afterLanguageChange', (...args) => this.#onAfterLanguageChange(...args));
    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onIndexCacheUpdate);

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    this.#computeAndApply();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper
      .removeLocalHook('cacheUpdated', this.#onIndexCacheUpdate)
      .unregisterMap(this.pluginName);

    this.#ui.destroy();
    this.#ui = null;

    super.disablePlugin();
  }

  /**
   * Gets the pagination current state.
   *
   * @returns {{
   *   currentPage: number,
   *   totalPages: number,
   *   pageSize: number,
   *   pageSizeList: number[],
   *   numberOfRenderedRows: number,
   *   firstVisibleRow: number,
   *   lastVisibleRow: number
   * }}
   */
  getPaginationData() {
    const firstRow = (this.#currentPage - 1) * this.#pageSize;
    const countRows = this.hot.countRows();
    let firstVisibleRow = null;
    let lastVisibleRow = null;
    let visibleCount = 0;

    for (let rowIndex = firstRow; visibleCount < this.#pageSize; rowIndex++) {
      if (rowIndex >= countRows) {
        break;
      }

      if (this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(rowIndex))) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (firstVisibleRow === null) {
        firstVisibleRow = rowIndex;
      }

      lastVisibleRow = rowIndex;
      visibleCount += 1;
    }

    return {
      currentPage: this.#currentPage,
      totalPages: this.#totalPages,
      pageSize: this.#pageSize,
      pageSizeList: this.getSetting('pageSizeList'),
      numberOfRenderedRows: this.hot.rowIndexMapper.getRenderableIndexesLength(),
      firstVisibleRow,
      lastVisibleRow,
    };
  }

  /**
   * Allows changing the page for specified page number.
   *
   * @param {number} pageNumber The page number to set (from 1 to N). If `0` is passed, it
   * will be transformed to `1`.
   * @fires Hooks#beforePageChange
   * @fires Hooks#afterPageChange
   */
  setPage(pageNumber) {
    const oldPage = this.#currentPage;
    const shouldProceed = this.hot.runHooks('beforePageChange', oldPage, pageNumber);

    if (shouldProceed === false) {
      return;
    }

    this.#currentPage = pageNumber;
    this.#computeAndApply();

    this.hot.runHooks('afterPageChange', oldPage, this.#currentPage);
    this.hot.view.adjustElementsSize();
    this.hot.render();
  }

  /**
   * Changes the page size for the pagination. The method recalculates the state based
   * on the new page size and re-renders the table.
   *
   * @param {number} pageSize The page size to set.
   * @fires Hooks#beforePageSizeChange
   * @fires Hooks#afterPageSizeChange
   */
  setPageSize(pageSize) {
    const oldPageSize = this.#pageSize;
    const shouldProceed = this.hot.runHooks('beforePageSizeChange', oldPageSize, pageSize);

    if (shouldProceed === false) {
      return;
    }

    this.#pageSize = pageSize;
    this.#computeAndApply();

    this.hot.runHooks('afterPageSizeChange', oldPageSize, this.#pageSize);
    this.hot.view.adjustElementsSize();
    this.hot.render();
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
   * Checks, based on the current internal state, if there is a previous page.
   *
   * @returns {boolean}
   */
  hasPreviousPage() {
    return this.#currentPage > 1;
  }

  /**
   * Checks, based on the current internal state, if there is a next page.
   *
   * @returns {boolean}
   */
  hasNextPage() {
    return this.#currentPage < this.#totalPages;
  }

  /**
   * Gets the visual data for the current page. The returned data may be longer than the defined
   * page size as the data may contain hidden rows (rows that are not rendered in the table).
   *
   * @returns {Array<Array>} Returns the data for the current page.
   */
  getCurrentPageData() {
    const {
      firstVisibleRow,
      lastVisibleRow,
    } = this.getPaginationData();

    return this.hot.getData(firstVisibleRow, 0, lastVisibleRow, this.hot.countCols() - 1);
  }

  /**
   * Shows the page size section in the pagination UI.
   *
   * @fires Hooks#afterPageSizeVisibilityChange
   */
  showPageSizeSection() {
    this.#ui.setPageSizeSectionVisibility(true);
    this.hot.runHooks('afterPageSizeVisibilityChange', true);
  }

  /**
   * Hides the page size section in the pagination UI.
   *
   * @fires Hooks#afterPageSizeVisibilityChange
   */
  hidePageSizeSection() {
    this.#ui.setPageSizeSectionVisibility(false);
    this.hot.runHooks('afterPageSizeVisibilityChange', false);
  }

  /**
   * Shows the page counter section in the pagination UI.
   *
   * @fires Hooks#afterPageCounterVisibilityChange
   */
  showPageCounterSection() {
    this.#ui.setCounterSectionVisibility(true);
    this.hot.runHooks('afterPageCounterVisibilityChange', true);
  }

  /**
   * Hides the page counter section in the pagination UI.
   *
   * @fires Hooks#afterPageCounterVisibilityChange
   */
  hidePageCounterSection() {
    this.#ui.setCounterSectionVisibility(false);
    this.hot.runHooks('afterPageCounterVisibilityChange', false);
  }

  /**
   * Shows the page navigation section in the pagination UI.
   *
   * @fires Hooks#afterPageNavigationVisibilityChange
   */
  showPageNavigationSection() {
    this.#ui.setNavigationSectionVisibility(true);
    this.hot.runHooks('afterPageNavigationVisibilityChange', true);
  }

  /**
   * Hides the page navigation section in the pagination UI.
   *
   * @fires Hooks#afterPageNavigationVisibilityChange
   */
  hidePageNavigationSection() {
    this.#ui.setNavigationSectionVisibility(false);
    this.hot.runHooks('afterPageNavigationVisibilityChange', false);
  }

  /**
   * Filters and calculates the pagination state and applies the changes to the
   * IndexMapper.
   */
  #computeAndApply() {
    const pageSize = this.#pageSize;

    if (pageSize < 1) {
      throw new Error('The `pageSize` option must be greater than `0`.');
    }

    this.#internalCall = true;
    this.#pagedRowsMap.clear();

    const renderableIndexes = this.hot.rowIndexMapper.getRenderableIndexes();
    const renderableRowsLength = renderableIndexes.length;

    this.#totalPages = Math.ceil(renderableRowsLength / pageSize);
    this.#currentPage = clamp(this.#currentPage, 1, this.#totalPages);

    renderableIndexes.splice((this.#currentPage - 1) * this.#pageSize, this.#pageSize);

    if (renderableIndexes.length > 0) {
      this.hot.batchExecution(() => {
        renderableIndexes.forEach(index => this.#pagedRowsMap.setValueAtIndex(index, true));
      }, true);
    } else {
      this.hot.rowIndexMapper.updateCache(true);
    }

    this.#internalCall = false;

    this.#ui.updateState({
      ...this.getPaginationData(),
      totalRenderedRows: renderableRowsLength,
    });
  }

  /**
   * Based on the external factors (like the scroll position of the table) it computes
   * the need for the top border of the pagination UI container.
   *
   * @returns {boolean} Returns `true` if the pagination UI should have a top border, `false` otherwise.
   */
  #computeNeedsBorder() {
    if (!this.hot.view) {
      return true;
    }

    const { view } = this.hot;

    if (view.isVerticallyScrollableByWindow()) {
      return false;
    }

    if (view.getTableHeight() < view.getWorkspaceHeight()) {
      return true;
    }

    const {
      lastVisibleRow
    } = this.getPaginationData();

    return view.getLastFullyVisibleRow() !== lastVisibleRow;
  }

  /**
   * Called before the selection of columns or all table is made. It modifies the selection rows range
   * to the range of the current page.
   *
   * @param {CellCoords} from Starting cell coordinates.
   * @param {CellCoords} to Ending cell coordinates.
   */
  #onBeforeSelectAllRows(from, to) {
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
   * The hook corrects the focus position (before drawing it) after the selection was made
   * (the visual coordinates was collected).
   */
  #onBeforeSelectionHighlightSet() {
    if (this.hot.getSettings().navigableHeaders) {
      const selectedRange = this.hot.getSelectedRangeLast();

      if (!selectedRange.isSingle()) {
        const { highlight } = selectedRange;

        highlight.row = clamp(
          highlight.row,
          selectedRange.getTopStartCorner().row,
          selectedRange.getBottomEndCorner().row
        );
      }
    }
  }

  /**
   * Called after the rendering of the table is completed. It updates the width of
   * the pagination container to the same size as the table.
   */
  #onAfterRender() {
    const { view } = this.hot;
    const width = view.isHorizontallyScrollableByWindow()
      ? view.getTotalTableWidth() : view.getWorkspaceWidth();

    this.#ui
      .updateWidth(width)
      .refreshBorderState();
  }

  /**
   * Called after the vertical scrolling of the table is completed. It refreshes
   * the border state of the pagination UI.
   */
  #onAfterScrollVertically() {
    this.#ui.refreshBorderState();
  }

  /**
   * Called after the language change. It recomputes the pagination state which updates the UI.
   */
  #onAfterLanguageChange() {
    this.#computeAndApply();
  }

  /**
   * IndexMapper cache update listener. Once the cache is updated, we need to recompute
   * the pagination state.
   *
   * The method uses arrow function to keep the reference to the class method. Necessary for
   * the `removeLocalHook` method of the row index mapper.
   */
  #onIndexCacheUpdate = () => {
    if (!this.#internalCall && this.hot) {
      this.#computeAndApply();
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#pagedRowsMap = null;
    this.#ui?.destroy();
    this.#ui = null;

    super.destroy();
  }
}
