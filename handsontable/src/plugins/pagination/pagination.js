import { BasePlugin } from '../base';
import { clamp } from '../../helpers/number';
import { getScrollbarWidth } from '../../helpers/dom/element';
import { PaginationUI } from './ui';
import { checkPluginSettingsConflict } from './utils';
import { announce } from '../../utils/a11yAnnouncer';
import { createPaginatorStrategy } from './strategies';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { warn } from '../../helpers/console';

export const PLUGIN_KEY = 'pagination';
export const PLUGIN_PRIORITY = 900;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

const AUTO_PAGE_SIZE_WARNING = toSingleLine`The \`auto\` page size setting requires the \`autoRowSize\`\x20
  plugin to be enabled. Set the \`autoRowSize: true\` in the configuration to ensure correct behavior.`;

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin Pagination
 * @class Pagination
 *
 * @description
 * The plugin adds full-featured pagination capabilities to a table component.
 * It manages splitting rows into pages, rendering navigation controls, and exposing
 * methods and configuration for initializing and updating pagination state.
 *
 * Core responsibilities:
 *  - Calculate which rows should be visible based on current `page` and `pageSize`.
 *  - Render a toolbar area containing:
 *    - a page size dropdown section (if `showPageSize` = `true`)
 *    - a row counter section ("1 - 10 of 50", if `showCounter` = `true`)
 *    - page navigation section (if `showNavigation` = `true`)
 *  - Emit hooks when:
 *    - the user navigates to a different page
 *    - the user changes the number of rows per page
 *    - the user changes the visibility of any sections
 *  - Allow external code to programmatically:
 *    - jump to a specific page
 *    - change the page size
 *    - change the visibility of UI sections
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   data: getData(),
 *   pagination: {
 *     pageSize: 10,
 *     pageSizeList: ['auto', 5, 10, 20, 50, 100],
 *     initialPage: 1,
 *     showPageSize: true,
 *     showCounter: true,
 *     showNavigation: true,
 *  },
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   pagination={{
 *     pageSize: 10,
 *     pageSizeList: ['auto', 5, 10, 20, 50, 100],
 *     initialPage: 1,
 *     showPageSize: true,
 *     showCounter: true,
 *     showNavigation: true,
 *   }}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   pagination: {
 *     pageSize: 10,
 *     pageSizeList: ['auto', 5, 10, 20, 50, 100],
 *     initialPage: 1,
 *     showPageSize: true,
 *     showCounter: true,
 *     showNavigation: true,
 *   },
 * };
 * ```
 * :::
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
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      initialPage: 1,
      showPageSize: true,
      showCounter: true,
      showNavigation: true,
      uiContainer: null,
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
   * Page size setup by the user. It can be a number or 'auto' (in which case the plugin will
   * calculate the page size based on the viewport size and row heights).
   *
   * @type {number | 'auto'}
   */
  #pageSize = 10;
  /**
   * UI instance of the pagination plugin.
   *
   * @type {PaginationUI}
   */
  #ui = null;
  /**
   * Pagination calculation strategy instance. It is used to calculate the pagination state
   * based on the user-defined settings. The result of the state is used to update the
   * pagination index mapper.
   *
   * @type {AutoPageSizeStrategy | FixedPageSizeStrategy | null}
   */
  #calcStrategy = null;
  /**
   * Flag indicating if the plugin is in the process of updating the index cache (execution operation).
   * Prevents circular calls when the index cache is updated.
   *
   * @type {boolean}
   */
  #internalExecutionCall = false;
  /**
   * Flag indicating if the plugin is in the process of updating the internal state (render operation).
   * Prevents circular calls when the render call is triggered by the pagination plugin itself.
   *
   * @type {boolean}
   */
  #internalRenderCall = false;
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

    const settings = this.hot.getSettings()[PLUGIN_KEY];

    if (settings?.initialPage !== undefined) {
      this.#currentPage = this.getSetting('initialPage');
    }
    if (settings?.pageSize !== undefined) {
      this.#pageSize = this.getSetting('pageSize');
    }

    this.#pagedRowsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(this.pluginName, 'hiding', false);

    if (this.#pageSize === 'auto' && !this.hot.getPlugin('autoRowSize')?.enabled) {
      warn(AUTO_PAGE_SIZE_WARNING);
    }

    this.#calcStrategy = createPaginatorStrategy(this.#pageSize === 'auto' ? 'auto' : 'fixed');

    if (!this.#ui) {
      this.#ui = new PaginationUI({
        rootElement: this.hot.rootGridElement,
        uiContainer: this.getSetting('uiContainer'),
        isRtl: this.hot.isRtl(),
        themeName: this.hot.getCurrentThemeName(),
        phraseTranslator: (...args) => this.hot.getTranslatedPhrase(...args),
        shouldHaveBorder: () => this.#computeNeedsBorder(),
        a11yAnnouncer: message => announce(message),
      });

      this.#updateSectionsVisibilityState();
      this.#ui
        .addLocalHook('firstPageClick', () => this.firstPage())
        .addLocalHook('prevPageClick', () => this.prevPage())
        .addLocalHook('nextPageClick', () => this.nextPage())
        .addLocalHook('lastPageClick', () => this.lastPage())
        .addLocalHook('pageSizeChange', pageSize => this.setPageSize(pageSize));

    }

    // Place the onInit hook before others to make sure that the pagination state is computed
    // and applied to the index mapper before AutoColumnSize plugin begins calculate the column sizes.
    this.addHook('init', (...args) => this.#onInit(...args), -1);
    this.addHook('beforeSelectAll', (...args) => this.#onBeforeSelectAllRows(...args));
    this.addHook('beforeSelectColumns', (...args) => this.#onBeforeSelectAllRows(...args));
    this.addHook('beforeSetRangeEnd', (...args) => this.#onBeforeSetRangeEnd(...args));
    this.addHook('beforeSelectionHighlightSet', (...args) => this.#onBeforeSelectionHighlightSet(...args));
    this.addHook('beforePaste', (...args) => this.#onBeforePaste(...args));
    this.addHook('afterViewRender', (...args) => this.#onAfterViewRender(...args));
    this.addHook('afterRender', (...args) => this.#onAfterRender(...args));
    this.addHook('afterScrollVertically', (...args) => this.#onAfterScrollVertically(...args));
    this.addHook('afterLanguageChange', (...args) => this.#onAfterLanguageChange(...args));
    this.addHook('beforeHeightChange', (...args) => this.#onBeforeHeightChange(...args));
    this.addHook('afterSetTheme', (...args) => this.#onAfterSetTheme(...args));

    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onIndexCacheUpdate);

    this.#registerFocusScope();

    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    this.#computeAndApplyState();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.hot.rowIndexMapper
      .removeLocalHook('cacheUpdated', this.#onIndexCacheUpdate)
      .unregisterMap(this.pluginName);

    this.#unregisterFocusScope();

    this.#ui.destroy();
    this.#ui = null;

    super.disablePlugin();
  }

  /**
   * Gets the pagination current state. Returns an object with the following properties:
   *  - `currentPage`: The current page number.
   *  - `totalPages`: The total number of pages.
   *  - `pageSize`: The page size.
   *  - `pageSizeList`: The list of page sizes.
   *  - `autoPageSize`: Whether the page size is calculated automatically.
   *  - `numberOfRenderedRows`: The number of rendered rows.
   *  - `firstVisibleRowIndex`: The index of the first visible row.
   *  - `lastVisibleRowIndex`: The index of the last visible row.
   *
   * @returns {{
   *   currentPage: number,
   *   totalPages: number,
   *   pageSize: number,
   *   pageSizeList: Array<number | 'auto'>,
   *   autoPageSize: boolean,
   *   numberOfRenderedRows: number,
   *   firstVisibleRowIndex: number,
   *   lastVisibleRowIndex: number
   * }}
   */
  getPaginationData() {
    const totalPages = this.#calcStrategy.getTotalPages();
    let firstVisibleRowIndex = -1;
    let lastVisibleRowIndex = -1;

    const {
      pageSize,
      startIndex,
    } = this.#calcStrategy.getState(this.#currentPage);

    const countRows = this.hot.countRows();
    let visibleCount = 0;

    for (let rowIndex = startIndex; visibleCount < pageSize; rowIndex++) {
      if (rowIndex >= countRows) {
        break;
      }

      if (this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(rowIndex))) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (firstVisibleRowIndex === -1) {
        firstVisibleRowIndex = rowIndex;
      }

      lastVisibleRowIndex = rowIndex;
      visibleCount += 1;
    }

    return {
      currentPage: this.#currentPage,
      totalPages,
      pageSize,
      pageSizeList: [...this.getSetting('pageSizeList')],
      autoPageSize: this.#pageSize === 'auto',
      numberOfRenderedRows: this.hot.rowIndexMapper.getRenderableIndexesLength(),
      firstVisibleRowIndex,
      lastVisibleRowIndex,
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

    this.#computeAndApplyState();
    this.hot.scrollViewportTo({ row: 0 });

    this.hot.runHooks('afterPageChange', oldPage, this.#currentPage);
    this.hot.view.adjustElementsSize();
    this.hot.render();
  }

  /**
   * Resets the current page to the initial page (`initialValue`) defined in the settings.
   */
  resetPage() {
    this.setPage(this.getSetting('initialPage'));
  }

  /**
   * Changes the page size for the pagination. The method recalculates the state based
   * on the new page size and re-renders the table. If `'auto'` is passed, the plugin will
   * calculate the page size based on the viewport size and row heights to make sure
   * that there will be no vertical scrollbar in the table.
   *
   * @param {number | 'auto'} pageSize The page size to set.
   * @fires Hooks#beforePageSizeChange
   * @fires Hooks#afterPageSizeChange
   */
  setPageSize(pageSize) {
    const oldPageSize = this.#pageSize;
    const shouldProceed = this.hot.runHooks('beforePageSizeChange', oldPageSize, pageSize);

    if (shouldProceed === false) {
      return;
    }

    if (pageSize === 'auto' && !this.hot.getPlugin('autoRowSize')?.enabled) {
      warn(AUTO_PAGE_SIZE_WARNING);
    }

    this.#calcStrategy = createPaginatorStrategy(pageSize === 'auto' ? 'auto' : 'fixed');
    this.#pageSize = pageSize;

    this.#computeAndApplyState();

    this.hot.runHooks('afterPageSizeChange', oldPageSize, this.#pageSize);
    this.hot.view.adjustElementsSize();
    this.hot.render();
  }

  /**
   * Resets the page size to the initial value (`pageSize`) defined in the settings.
   */
  resetPageSize() {
    this.setPageSize(this.getSetting('pageSize'));
  }

  /**
   * Resets the pagination state to the initial values defined in the settings.
   */
  resetPagination() {
    this.resetPage();
    this.resetPageSize();
    this.#updateSectionsVisibilityState();
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
    this.setPage(this.#calcStrategy.getTotalPages());
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
    return this.#currentPage < this.#calcStrategy.getTotalPages();
  }

  /**
   * Gets the visual data for the current page. The returned data may be longer than the defined
   * page size as the data may contain hidden rows (rows that are not rendered in the table).
   *
   * @returns {Array<Array>} Returns the data for the current page.
   */
  getCurrentPageData() {
    const {
      firstVisibleRowIndex,
      lastVisibleRowIndex,
    } = this.getPaginationData();

    if (firstVisibleRowIndex === -1 || lastVisibleRowIndex === -1) {
      return [];
    }

    return this.hot.getData(firstVisibleRowIndex, 0, lastVisibleRowIndex, this.hot.countCols() - 1);
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
   * Updates the visibility state of the pagination sections based on the current settings.
   */
  #updateSectionsVisibilityState() {
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
  }

  /**
   * Applies the current pagination state to the internal index mapper and updates the UI.
   */
  #computeAndApplyState() {
    this.#internalExecutionCall = true;
    this.#pagedRowsMap.clear();

    const renderableIndexes = this.hot.rowIndexMapper.getRenderableIndexes();
    const renderableRowsLength = renderableIndexes.length;
    const { stylesHandler } = this.hot;

    this.#calcStrategy.calculate({
      pageSize: this.#pageSize,
      totalItems: renderableRowsLength,
      viewportSizeProvider: () => {
        const { view } = this.hot;

        if (view.isVerticallyScrollableByWindow()) {
          const bodyStyle = getComputedStyle(this.hot.rootDocument.body);
          const margin = Number.parseInt(bodyStyle.marginTop, 10) + Number.parseInt(bodyStyle.marginBottom, 10);
          const columnHeaderHeight = this.hot.hasColHeaders()
            ? view._wt.wtTable.getColumnHeaderHeight() : 0;
          const paginationContainerHeight = this.#ui.getHeight();
          const workspaceHeight = view.getWorkspaceHeight();

          return workspaceHeight - paginationContainerHeight - columnHeaderHeight - margin;
        }

        const scrollbarWidth = view.hasHorizontalScroll() ? getScrollbarWidth() : 0;

        return view.getViewportHeight() - scrollbarWidth;
      },
      itemsSizeProvider: () => {
        const rowHeights = this.hot.rowIndexMapper
          .getRenderableIndexes()
          .map((physicalIndex) => {
            const visualRowIndex = this.hot.toVisualRow(physicalIndex);

            return this.hot
              .getRowHeight(visualRowIndex) ?? stylesHandler.getDefaultRowHeight(visualRowIndex);
          });

        return rowHeights;
      },
    });

    const totalPages = this.#calcStrategy.getTotalPages();

    this.#currentPage = clamp(this.#currentPage, 1, totalPages);

    if (renderableIndexes.length > 0) {
      const {
        startIndex,
        pageSize,
      } = this.#calcStrategy.getState(this.#currentPage);

      renderableIndexes.splice(startIndex, pageSize);
    }

    if (renderableIndexes.length > 0) {
      this.hot.batchExecution(() => {
        renderableIndexes.forEach(index => this.#pagedRowsMap.setValueAtIndex(index, true));
      }, true);
    } else {
      this.hot.rowIndexMapper.updateCache(true);
    }

    this.#internalExecutionCall = false;

    const paginationData = this.getPaginationData();

    this.#ui.updateState({
      ...paginationData,
      totalRenderedRows: renderableRowsLength,
    });
  }

  /**
   * Based on the external factors (like the scroll position of the table, size etc.) it computes
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

    if (view.hasHorizontalScroll() || view.getTableHeight() < view.getWorkspaceHeight()) {
      return true;
    }

    const {
      lastVisibleRowIndex
    } = this.getPaginationData();

    return view.getLastFullyVisibleRow() !== lastVisibleRowIndex;
  }

  /**
   * Registers the focus scope for the pagination plugin.
   */
  #registerFocusScope() {
    this.hot.getFocusScopeManager()
      .registerScope(PLUGIN_KEY, this.#ui.getContainer(), {
        shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
        runOnlyIf: () => this.getSetting('showPageSize') || this.getSetting('showNavigation'),
        onActivate: (focusSource) => {
          const focusableElements = this.#ui.getFocusableElements();

          if (focusableElements.length > 0) {
            if (focusSource === 'tab_from_above') {
              focusableElements.at(0).focus();

            } else if (focusSource === 'tab_from_below') {
              focusableElements.at(-1).focus();
            }
          }
        },
      });
  }

  /**
   * Unregisters the focus scope for the pagination plugin.
   */
  #unregisterFocusScope() {
    this.hot.getFocusScopeManager().unregisterScope(PLUGIN_KEY);
  }

  /**
   * Called before the selection of columns or all table is made. It modifies the selection rows range
   * to the range of the current page.
   *
   * @param {CellCoords} from Starting cell coordinates.
   * @param {CellCoords} to Ending cell coordinates.
   */
  #onBeforeSelectAllRows(from, to) {
    const { firstVisibleRowIndex, lastVisibleRowIndex } = this.getPaginationData();

    if (this.#currentPage > 1 || from.row >= 0) {
      from.row = firstVisibleRowIndex;
    }

    to.row = lastVisibleRowIndex;
  }

  /**
   * Called before the selection end is fired. It modifies the selection to the range of
   * the current page.
   *
   * @param {CellCoords} coords Ending cell coordinates.
   */
  #onBeforeSetRangeEnd(coords) {
    if (this.hot.selection.isSelectedByColumnHeader()) {
      const { lastVisibleRowIndex } = this.getPaginationData();

      coords.row = lastVisibleRowIndex;
    }
  }

  /**
   * The hook corrects the focus position (before drawing it) after the selection was made
   * (the visual coordinates was collected).
   */
  #onBeforeSelectionHighlightSet() {
    if (!this.hot.getSettings().navigableHeaders) {
      return;
    }

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

  /**
   * Called before the paste operation is performed. It removes the rows that are not visible
   * from the pasted data.
   *
   * @param {Array} pastedData The data that was pasted.
   * @param {Array<{startRow: number, endRow: number}>} ranges The ranges of the pasted data.
   * @returns {boolean} Returns `false` to prevent the paste operation.
   */
  #onBeforePaste(pastedData, ranges) {
    const {
      firstVisibleRowIndex,
      lastVisibleRowIndex,
    } = this.getPaginationData();

    if (firstVisibleRowIndex === -1 || lastVisibleRowIndex === -1) {
      return false;
    }

    ranges.forEach(({ startRow }) => {
      if (pastedData.length === 0) {
        return;
      }

      const rowsToRemove = Math.min(
        pastedData.length - (lastVisibleRowIndex - startRow + 1),
        pastedData.length,
      );

      pastedData.splice(0, rowsToRemove);
    });
  }

  /**
   * Called after the view is rendered. It recalculates the pagination state only when
   * the `pageSize` is set to `'auto'`. In this case, the plugin will compute the
   * page size based on the viewport size and row heights for each render cycle to make sure
   * that each row resize, multiline cell value, or other factors that may affect the
   * rows height will be taken into account.
   */
  #onAfterViewRender() {
    if (this.#pageSize !== 'auto' || this.#internalRenderCall) {
      this.#internalRenderCall = false;

      return;
    }

    this.#computeAndApplyState();

    this.#internalRenderCall = true;
    // there is need to re-render the table as on the initial the engine returns incorrect
    // values about table and column header sizes.
    this.hot.view.adjustElementsSize();
    this.hot.render();
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
   * Called before the height of the table is changed. It adjusts the table height to fit the pagination container
   * in declared height.
   *
   * @param {number|string} height Table height.
   * @returns {string} Returns the new table height.
   */
  #onBeforeHeightChange(height) {
    if (this.getSetting('uiContainer')) {
      return height;
    }

    const isPixelValue = (
      typeof height === 'number' ||
      (typeof height === 'string' && /^\d+$/.test(height)) ||
      (typeof height === 'string' && height.endsWith('px'))
    );

    if (!isPixelValue) {
      return height;
    }

    const heightValue = typeof height === 'string' && height.endsWith('px')
      ? height : `${height}px`;

    return `calc(${heightValue} - ${this.#ui.getHeight()}px)`;
  }

  /**
   * Called after the initialization of the plugin. It computes the initial state of the pagination.
   */
  #onInit() {
    if (this.#pageSize === 'auto') {
      return;
    }

    this.#computeAndApplyState();
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
    this.#computeAndApplyState();
  }

  /**
   * Called after the theme is set. It updates the theme of the pagination container.
   *
   * @param {string | undefined} themeName The name of the theme to use.
   */
  #onAfterSetTheme(themeName) {
    this.#ui.updateTheme(themeName);
  }

  /**
   * IndexMapper cache update listener. Once the cache is updated, we need to recompute
   * the pagination state.
   *
   * The method uses arrow function to keep the reference to the class method. Necessary for
   * the `removeLocalHook` method of the row index mapper.
   */
  #onIndexCacheUpdate = () => {
    if (!this.#internalExecutionCall && this.hot?.view) {
      this.#computeAndApplyState();
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#pagedRowsMap = null;
    this.#calcStrategy = null;
    this.#ui?.destroy();
    this.#ui = null;

    super.destroy();
  }
}
