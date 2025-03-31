import {
  addClass,
  removeClass,
  clearTextSelection,
  empty,
  fastInnerHTML,
  fastInnerText,
  getScrollbarWidth,
  hasClass,
  isChildOf,
  isInput,
  isOutsideInput,
  isVisible,
  setAttribute,
  getParentWindow,
} from './helpers/dom/element';
import EventManager from './eventManager';
import { isImmediatePropagationStopped, isRightClick, isLeftClick } from './helpers/dom/event';
import Walkontable from './3rdparty/walkontable/src';
import { handleMouseEvent } from './selection/mouseEventHandler';
import { isRootInstance } from './utils/rootInstance';
import {
  A11Y_COLCOUNT,
  A11Y_MULTISELECTABLE,
  A11Y_PRESENTATION,
  A11Y_ROWCOUNT,
  A11Y_TREEGRID
} from './helpers/a11y';
import { CellCoords } from './3rdparty/walkontable/src/cell/coords';
import { CoreAbstract } from './3rdparty/walkontable/src/core/interfaces';
import { SettingsPure } from './3rdparty/walkontable/src/settings';
import { IndexMapper } from './translations';
import { DataMapSettings, PropDescriptor } from './dataMap/types';
import { CellProperties } from './editors/types';
import { GridSettings, HotInstance } from './core.types';

interface MousePosition {
  x: number;
  y: number;
}

/**
 * @class TableView
 * @private
 */
class TableView {
  /**
   * Instance of {@link HotInstance}.
   *
   * @private
   * @type {HotInstance}
   */
  hot: HotInstance;
  /**
   * Instance of {@link EventManager}.
   *
   * @private
   * @type {EventManager}
   */
  eventManager: EventManager;
  /**
   * Current Handsontable's GridSettings object.
   *
   * @private
   * @type {GridSettings}
   */
  settings: GridSettings;
  /**
   * Main <THEAD> element.
   *
   * @private
   * @type {HTMLTableSectionElement}
   */
  THEAD: HTMLTableSectionElement;
  /**
   * Main <TBODY> element.
   *
   * @private
   * @type {HTMLTableSectionElement}
   */
  TBODY: HTMLTableSectionElement;
  /**
   * Main Walkontable instance.
   *
   * @private
   * @type {Walkontable}
   */
  _wt: CoreAbstract;
  /**
   * Main Walkontable instance.
   *
   * @type {Walkontable}
   */
  activeWt: CoreAbstract;
  /**
   * The total number of the column header renderers applied to the table through the
   * `afterGetColumnHeaderRenderers` hook.
   *
   * @type {number}
   */
  #columnHeadersCount = 0;
  /**
   * The total number of the row header renderers applied to the table through the
   * `afterGetRowHeaderRenderers` hook.
   *
   * @type {number}
   */
  #rowHeadersCount = 0;
  /**
   * The flag determines if the `adjustElementsSize` method call was made during
   * the render suspending. If true, the method has to be triggered once after render
   * resuming.
   *
   * @private
   * @type {boolean}
   */
  postponedAdjustElementsSize = false;
  /**
   * Defines if the text should be selected during mousemove.
   *
   * @type {boolean}
   */
  #selectionMouseDown = false;
  /**
   * @type {boolean}
   */
  #mouseDown: boolean;
  /**
   * Main <TABLE> element.
   *
   * @type {HTMLTableElement}
   */
  #table: HTMLTableElement;
  /**
   * Cached width of the rootElement.
   *
   * @type {number}
   */
  #lastWidth = 0;
  /**
   * Cached height of the rootElement.
   *
   * @type {number}
   */
  #lastHeight = 0;
  /**
   * The last mouse position of the mousedown event.
   *
   * @type {{ x: number, y: number } | null}
   */
  #mouseDownLastPos: MousePosition | null = null;

  /**
   * @param {Hanstontable} hotInstance Instance of {@link HotInstance}.
   */
  constructor(hotInstance: HotInstance) {
    this.hot = hotInstance;
    this.eventManager = new EventManager(this.hot as any);
    this.settings = this.hot.getSettings();
    this.#mouseDown = false;

    this.createElements();
    this.registerEvents();
    this.initializeWalkontable();
  }

  /**
   * Renders WalkontableUI.
   */
  render(): void {
    if (!this.hot.isRenderSuspended()) {
      this.hot.runHooks('beforeRender', this.hot.forceFullRender);

      if (this.postponedAdjustElementsSize) {
        this.postponedAdjustElementsSize = false;

        this.adjustElementsSize();
      }

      this._wt.draw(!this.hot.forceFullRender);

      this.#updateScrollbarClassNames();

      this.hot.runHooks('afterRender', this.hot.forceFullRender);
      this.hot.forceFullRender = false;
      this.hot.renderCall = false;
    }
  }

  /**
   * Adjust overlays elements size and master table size.
   */
  adjustElementsSize(): void {
    if (this.hot.isRenderSuspended()) {
      this.postponedAdjustElementsSize = true;
    } else {
      this._wt.wtOverlays.adjustElementsSize();
    }
  }

  /**
   * Returns td object given coordinates.
   *
   * @param {CellCoords} coords Renderable cell coordinates.
   * @param {boolean} topmost Indicates whether the cell should be calculated from the topmost.
   * @returns {HTMLTableCellElement|null}
   */
  getCellAtCoords(coords: CellCoords, topmost: boolean): HTMLTableCellElement | null {
    const td = this._wt.getCell(coords as any, topmost);

    if (td == null) { // there was an exit code (cell is out of bounds)
      return null;
    }

    return td as HTMLTableCellElement;
  }

  /**
   * Scroll viewport to a cell.
   *
   * @param {CellCoords} coords Renderable cell coordinates.
   * @param {'auto' | 'start' | 'end'} [horizontalSnap] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @param {'auto' | 'top' | 'bottom'} [verticalSnap] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on the bottom of
   * the table. When `'auto'`, the viewport is scrolled only when the row is outside of the viewport.
   * @returns {boolean}
   */
  scrollViewport(
    coords: CellCoords,
    horizontalSnap?: 'auto' | 'start' | 'end',
    verticalSnap?: 'auto' | 'top' | 'bottom'
  ): boolean {
    return this._wt.scrollViewport(coords as any, horizontalSnap, verticalSnap);
  }

  /**
   * Scroll viewport to a column.
   *
   * @param {number} column Renderable column index.
   * @param {'auto' | 'start' | 'end'} [snap] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns {boolean}
   */
  scrollViewportHorizontally(column: number, snap?: 'auto' | 'start' | 'end'): boolean {
    return this._wt.scrollViewportHorizontally(column, snap);
  }

  /**
   * Scroll viewport to a row.
   *
   * @param {number} row Renderable row index.
   * @param {'auto' | 'top' | 'bottom'} [snap] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on
   * the bottom of the table. When `'auto'`, the viewport is scrolled only when the row is outside of
   * the viewport.
   * @returns {boolean}
   */
  scrollViewportVertically(row: number, snap?: 'auto' | 'top' | 'bottom'): boolean {
    return this._wt.scrollViewportVertically(row, snap);
  }

  /**
   * Prepares DOMElements and adds correct className to the root element.
   *
   * @private
   */
  private createElements(): void {
    const { rootElement, rootDocument } = this.hot;
    const originalStyle = rootElement.getAttribute('style');

    if (originalStyle) {
      rootElement.setAttribute('data-originalstyle', originalStyle); // needed to retrieve original style in jsFiddle link generator in HT examples. may be removed in future versions
    }

    addClass(rootElement, 'handsontable');

    this.#table = rootDocument.createElement('TABLE') as HTMLTableElement;
    addClass(this.#table, 'htCore');

    if (this.hot.getSettings().tableClassName) {
      addClass(this.#table, this.hot.getSettings().tableClassName);
    }

    if (this.settings.ariaTags) {
      setAttribute(this.#table, [A11Y_PRESENTATION()]);

      setAttribute(rootElement, [
        A11Y_TREEGRID(),
        A11Y_ROWCOUNT(-1),
        A11Y_COLCOUNT(this.hot.countCols()),
        A11Y_MULTISELECTABLE(),
      ]);
    }

    this.THEAD = rootDocument.createElement('THEAD') as HTMLTableSectionElement;
    this.#table.appendChild(this.THEAD);

    this.TBODY = rootDocument.createElement('TBODY') as HTMLTableSectionElement;
    this.#table.appendChild(this.TBODY);

    this.hot.table = this.#table;

    this.hot.container.insertBefore(this.#table, this.hot.container.firstChild);
  }

  /**
   * Attaches necessary listeners.
   *
   * @private
   */
  private registerEvents(): void {
    const { rootElement, rootDocument, selection, rootWindow } = this.hot;
    const documentElement = rootDocument.documentElement;

    this.eventManager.addEventListener(rootElement, 'mousedown', (event: MouseEvent) => {
      this.#selectionMouseDown = true;

      if (!this.isTextSelectionAllowed(event.target as HTMLElement)) {
        clearTextSelection(rootWindow);
        event.preventDefault();
        rootWindow.focus(); // make sure that window that contains HOT is active. Important when HOT is in iframe.
      }
    });

    this.eventManager.addEventListener(rootElement, 'mouseup', () => {
      this.#selectionMouseDown = false;
    });
    this.eventManager.addEventListener(rootElement, 'mousemove', (event: MouseEvent) => {
      if (this.#selectionMouseDown && !this.isTextSelectionAllowed(event.target as HTMLElement)) {
        // Clear selection only when fragmentSelection is enabled, otherwise clearing selection breaks the IME editor.
        if (this.settings.fragmentSelection) {
          clearTextSelection(rootWindow);
        }
        event.preventDefault();
      }
    });

    this.eventManager.addEventListener(documentElement, 'keyup', (event: KeyboardEvent) => {
      // TODO: is it the best place and way to finish cell selection?
      if (selection.isInProgress() && !event.shiftKey) {
        selection.finish();
      }
    });

    this.eventManager.addEventListener(documentElement, 'mouseup', (event: MouseEvent) => {
      if (selection.isInProgress() && isLeftClick(event)) {
        selection.finish();
      }

      this.#mouseDown = false;

      const isOutsideInputElement = isOutsideInput(rootDocument.activeElement as HTMLElement);

      if (isInput(rootDocument.activeElement as HTMLElement) && !isOutsideInputElement) {
        return;
      }

      if (isOutsideInputElement || (!selection.isSelected() && !selection.isSelectedByAnyHeader() &&
          !rootElement.contains(event.target as Node) && !isRightClick(event))) {
        this.hot.unlisten();
      }
    });

    this.eventManager.addEventListener(documentElement, 'contextmenu', (event: MouseEvent) => {
      if (selection.isInProgress() && isRightClick(event)) {
        selection.finish();

        this.#mouseDown = false;
      }
    });

    this.eventManager.addEventListener(documentElement, 'touchend', () => {
      if (selection.isInProgress()) {
        selection.finish();
      }

      this.#mouseDown = false;
    });

    this.eventManager.addEventListener(documentElement, 'mousedown', (event: MouseEvent) => {
      const originalTarget = event.target as HTMLElement;
      const eventX = event.x || event.clientX;
      const eventY = event.y || event.clientY;
      let next = event.target as HTMLElement;

      if (this.#mouseDown || !rootElement) {
        return; // it must have been started in a cell
      }

      // immediate click on "holder" means click on the right side of vertical scrollbar
      const { holder } = this._wt.wtTable;

      if (next === holder) {
        const scrollbarWidth = getScrollbarWidth(rootDocument);

        if (rootDocument.elementFromPoint(eventX + scrollbarWidth, eventY) !== holder ||
          rootDocument.elementFromPoint(eventX, eventY + scrollbarWidth) !== holder) {
          return;
        }
      } else {
        while (next !== documentElement) {
          if (next === null) {
            if ((event as any).isTargetWebComponent) {
              break;
            }

            // click on something that was a row but now is detached (possibly because your click triggered a rerender)
            return;
          }
          if (next === rootElement) {
            // click inside container
            return;
          }
          next = next.parentNode as HTMLElement;
        }
      }

      // function did not return until here, we have an outside click!
      const outsideClickDeselects = typeof this.settings.outsideClickDeselects === 'function' ?
        this.settings.outsideClickDeselects(originalTarget) :
        this.settings.outsideClickDeselects;

      if (outsideClickDeselects) {
        this.hot.deselectCell();
      } else {
        this.hot.destroyEditor(false, false);
      }
    });

    let parentWindow = getParentWindow(rootWindow);

    while (parentWindow !== null) {
      this.eventManager.addEventListener(parentWindow.document.documentElement, 'click', () => {
        this.hot.unlisten();
      });

      parentWindow = getParentWindow(parentWindow);
    }

    this.eventManager.addEventListener(this.#table, 'selectstart', (event: Event) => {
      if (this.settings.fragmentSelection || isInput(event.target as HTMLElement)) {
        return;
      }
      // https://github.com/handsontable/handsontable/issues/160
      // Prevent text from being selected when performing drag down.
      event.preventDefault();
    });
  }

  /**
   * Translate renderable cell coordinates to visual coordinates.
   *
   * @param {CellCoords} coords The cell coordinates.
   * @returns {CellCoords}
   */
  translateFromRenderableToVisualCoords({ row, col }) {
    // TODO: To consider an idea to reusing the CellCoords instance instead creating new one.
    const [visualRow, visualCol] = this.translateFromRenderableToVisualIndex(row, col);
    return this.hot._createCellCoords(visualRow, visualCol);
  }

  /**
   * Translate renderable row and column indexes to visual row and column indexes.
   *
   * @param {number} renderableRow Renderable row index.
   * @param {number} renderableColumn Renderable columnIndex.
   * @returns {number[]}
   */
  translateFromRenderableToVisualIndex(renderableRow, renderableColumn) {
    // TODO: Some helper may be needed.
    // We perform translation for indexes (without headers).
    let visualRow = renderableRow >= 0 ?
      this.hot.rowIndexMapper.getVisualFromRenderableIndex(renderableRow) : renderableRow;
    let visualColumn = renderableColumn >= 0 ?
      this.hot.columnIndexMapper.getVisualFromRenderableIndex(renderableColumn) : renderableColumn;

    if (visualRow === null) {
      visualRow = renderableRow;
    }
    if (visualColumn === null) {
      visualColumn = renderableColumn;
    }

    return [visualRow, visualColumn];
  }

  /**
   * Returns the number of renderable indexes.
   *
   * @private
   * @param {IndexMapper} indexMapper The IndexMapper instance for specific axis.
   * @param {number} maxElements Maximum number of elements (rows or columns).
   *
   * @returns {number|*}
   */
  countRenderableIndexes(indexMapper, maxElements) {
    const consideredElements = Math.min(indexMapper.getNotTrimmedIndexesLength(), maxElements);
    // Don't take hidden indexes into account. We are looking just for renderable indexes.
    const firstNotHiddenIndex = indexMapper.getNearestNotHiddenIndex(consideredElements - 1, -1);

    // There are no renderable indexes.
    if (firstNotHiddenIndex === null) {
      return 0;
    }

    return indexMapper.getRenderableFromVisualIndex(firstNotHiddenIndex) + 1;
  }

  /**
   * Returns the number of renderable columns.
   *
   * @returns {number}
   */
  countRenderableColumns() {
    return this.countRenderableIndexes(this.hot.columnIndexMapper, this.settings.maxCols);
  }

  /**
   * Returns the number of renderable rows.
   *
   * @returns {number}
   */
  countRenderableRows() {
    return this.countRenderableIndexes(this.hot.rowIndexMapper, this.settings.maxRows);
  }

  /**
   * Returns number of not hidden row indexes counting from the passed starting index.
   * The counting direction can be controlled by `incrementBy` argument.
   *
   * @param {number} visualIndex The visual index from which the counting begins.
   * @param {number} incrementBy If `-1` then counting is backwards or forward when `1`.
   * @returns {number}
   */
  countNotHiddenRowIndexes(visualIndex, incrementBy) {
    return this.countNotHiddenIndexes(
      visualIndex, incrementBy, this.hot.rowIndexMapper, this.countRenderableRows());
  }

  /**
   * Returns number of not hidden column indexes counting from the passed starting index.
   * The counting direction can be controlled by `incrementBy` argument.
   *
   * @param {number} visualIndex The visual index from which the counting begins.
   * @param {number} incrementBy If `-1` then counting is backwards or forward when `1`.
   * @returns {number}
   */
  countNotHiddenColumnIndexes(visualIndex, incrementBy) {
    return this.countNotHiddenIndexes(
      visualIndex, incrementBy, this.hot.columnIndexMapper, this.countRenderableColumns());
  }

  /**
   * Returns number of not hidden indexes counting from the passed starting index.
   * The counting direction can be controlled by `incrementBy` argument.
   *
   * @param {number} visualIndex The visual index from which the counting begins.
   * @param {number} incrementBy If `-1` then counting is backwards or forward when `1`.
   * @param {IndexMapper} indexMapper The IndexMapper instance for specific axis.
   * @param {number} renderableIndexesCount Total count of renderable indexes for specific axis.
   * @returns {number}
   */
  countNotHiddenIndexes(visualIndex, incrementBy, indexMapper, renderableIndexesCount) {
    if (isNaN(visualIndex) || visualIndex < 0) {
      return 0;
    }

    const firstVisibleIndex = indexMapper.getNearestNotHiddenIndex(visualIndex, incrementBy);
    const renderableIndex = indexMapper.getRenderableFromVisualIndex(firstVisibleIndex);

    if (!Number.isInteger(renderableIndex)) {
      return 0;
    }

    let notHiddenIndexes = 0;

    if (incrementBy < 0) {
      // Zero-based numbering for renderable indexes corresponds to a number of not hidden indexes.
      notHiddenIndexes = renderableIndex + 1;
    } else if (incrementBy > 0) {
      notHiddenIndexes = renderableIndexesCount - renderableIndex;
    }

    return notHiddenIndexes;
  }

  /**
   * The function returns the number of not hidden column indexes that fit between the first and
   * last fixed column in the left (or right in RTL mode) overlay.
   *
   * @returns {number}
   */
  countNotHiddenFixedColumnsStart() {
    const countCols = this.hot.countCols();
    const visualFixedColumnsStart = Math.min(parseInt(String(this.settings.fixedColumnsStart), 10), countCols) - 1;

    return this.countNotHiddenColumnIndexes(visualFixedColumnsStart, -1);
  }

  /**
   * The function returns the number of not hidden row indexes that fit between the first and
   * last fixed row in the top overlay.
   *
   * @returns {number}
   */
  countNotHiddenFixedRowsTop() {
    const countRows = this.hot.countRows();
    const visualFixedRowsTop = Math.min(parseInt(String(this.settings.fixedRowsTop), 10), countRows) - 1;

    return this.countNotHiddenRowIndexes(visualFixedRowsTop, -1);
  }

  /**
   * The function returns the number of not hidden row indexes that fit between the first and
   * last fixed row in the bottom overlay.
   *
   * @returns {number}
   */
  countNotHiddenFixedRowsBottom() {
    const countRows = this.hot.countRows();
    const visualFixedRowsBottom = Math.max(countRows - parseInt(String(this.settings.fixedRowsBottom), 10), 0);

    return this.countNotHiddenRowIndexes(visualFixedRowsBottom, 1);
  }

  /**
   * The function returns the number of renderable column indexes within the passed range of the visual indexes.
   *
   * @param {number} columnStart The column visual start index.
   * @param {number} columnEnd The column visual end index.
   * @returns {number}
   */
  countRenderableColumnsInRange(columnStart, columnEnd) {
    let count = 0;

    for (let column = columnStart; column <= columnEnd; column++) {
      if (this.hot.columnIndexMapper.getRenderableFromVisualIndex(column) !== null) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * The function returns the number of renderable row indexes within the passed range of the visual indexes.
   *
   * @param {number} rowStart The row visual start index.
   * @param {number} rowEnd The row visual end index.
   * @returns {number}
   */
  countRenderableRowsInRange(rowStart, rowEnd) {
    let count = 0;

    for (let row = rowStart; row <= rowEnd; row++) {
      if (this.hot.rowIndexMapper.getRenderableFromVisualIndex(row) !== null) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Retrieves the styles handler from the Walkontable instance.
   *
   * @returns {StylesHandler} The styles handler instance.
   */
  getStylesHandler() {
    return this._wt.stylesHandler;
  }

  /**
   * Returns the default row height.
   *
   * This method retrieves the default row height from the Walkontable styles handler.
   *
   * @returns {number} The default row height.
   */
  getDefaultRowHeight() {
    return this._wt.stylesHandler.getDefaultRowHeight();
  }

  /**
   * Add a class name to the license information element.
   *
   * @param {string} className The class name to add.
   */
  addClassNameToLicenseElement(className) {
    const licenseInfoElement = this.hot.rootElement.parentNode?.querySelector('.hot-display-license-info');

    if (licenseInfoElement) {
      addClass(licenseInfoElement as HTMLElement, className);
    }
  }

  /**
   * Remove a class name from the license information element.
   *
   * @param {string} className The class name to remove.
   */
  removeClassNameFromLicenseElement(className) {
    const licenseInfoElement = this.hot.rootElement.parentNode?.querySelector('.hot-display-license-info');

    if (licenseInfoElement) {
      removeClass(licenseInfoElement as HTMLElement, className);
    }
  }

  /**
   * Checks if at least one cell than belongs to the main table is not covered by the top, left or
   * bottom overlay.
   *
   * @returns {boolean}
   */
  isMainTableNotFullyCoveredByOverlays() {
    const fixedAllRows = this.countNotHiddenFixedRowsTop() + this.countNotHiddenFixedRowsBottom();
    const fixedAllColumns = this.countNotHiddenFixedColumnsStart();

    return (this.hot as any).countRenderedRows() > fixedAllRows && (this.hot as any).countRenderedCols() > fixedAllColumns;
  }

  /**
   * Defines default configuration and initializes WalkOnTable instance.
   *
   * @private
   */
  private initializeWalkontable(): void {
    const walkontableConfig = {
      ariaTags: this.settings.ariaTags,
      rtlMode: this.hot.isRtl(),
      externalRowCalculator: (this.hot as any).getPlugin('autoRowSize') &&
        (this.hot as any).getPlugin('autoRowSize').isEnabled(),
      table: this.#table,
      isDataViewInstance: () => isRootInstance(this.hot),
      preventOverflow: () => this.settings.preventOverflow,
      preventWheel: () => this.settings.preventWheel,
      viewportColumnRenderingThreshold: () => this.settings.viewportColumnRenderingThreshold,
      viewportRowRenderingThreshold: () => this.settings.viewportRowRenderingThreshold,
      data: (renderableRow: number, renderableColumn: number) => {
        const [visualRow, visualCol] = this.translateFromRenderableToVisualIndex(renderableRow, renderableColumn);
        return this.hot.getDataAtCell(visualRow, visualCol);
      },
      totalRows: () => this.countRenderableRows(),
      totalColumns: () => this.countRenderableColumns(),
      // Number of renderable columns for the left overlay.
      fixedColumnsStart: () => this.countNotHiddenFixedColumnsStart(),
      // Number of renderable rows for the top overlay.
      fixedRowsTop: () => this.countNotHiddenFixedRowsTop(),
      // Number of renderable rows for the bottom overlay.
      fixedRowsBottom: () => this.countNotHiddenFixedRowsBottom(),
      // Enable the inline start overlay when conditions are met.
      shouldRenderInlineStartOverlay: () => {
        return (this.settings.fixedColumnsStart as number > 0) || walkontableConfig.rowHeaders().length > 0;
      },
      // Enable the top overlay when conditions are met.
      shouldRenderTopOverlay: () => {
        return (this.settings.fixedRowsTop as number > 0) || walkontableConfig.columnHeaders().length > 0;
      },
      // Enable the bottom overlay when conditions are met.
      shouldRenderBottomOverlay: () => {
        return this.settings.fixedRowsBottom as number > 0;
      },
      minSpareRows: () => this.settings.minSpareRows,
      renderAllRows: this.settings.renderAllRows,
      renderAllColumns: this.settings.renderAllColumns,
      rowHeaders: () => {
        const headerRenderers: Array<(renderableRowIndex: number, TH: HTMLTableCellElement) => void> = [];

        if (this.hot.hasRowHeaders()) {
          headerRenderers.push((renderableRowIndex: number, TH: HTMLTableCellElement) => {
            // TODO: Some helper may be needed.
            // We perform translation for row indexes (without row headers).
            const visualRowIndex = renderableRowIndex >= 0 ?
              this.hot.rowIndexMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

            this.appendRowHeader(visualRowIndex, TH);
          });
        }

        this.hot.runHooks('afterGetRowHeaderRenderers', headerRenderers);
        this.#rowHeadersCount = headerRenderers.length;

        if (this.hot.getSettings().ariaTags) {
          // Update the aria-colcount attribute.
          // Only needs to be done once after initialization/data update.
          if (this.#getAriaColcount() === this.hot.countCols()) {
            this.#updateAriaColcount(this.#rowHeadersCount);
          }
        }

        return headerRenderers;
      },
      columnHeaders: () => {
        const headerRenderers: Array<(renderedColumnIndex: number, TH: HTMLTableCellElement) => void> = [];

        if (this.hot.hasColHeaders()) {
          headerRenderers.push((renderedColumnIndex: number, TH: HTMLTableCellElement) => {
            // TODO: Some helper may be needed.
            // We perform translation for columns indexes (without column headers).
            const visualColumnsIndex = renderedColumnIndex >= 0 ?
              this.hot.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex) : renderedColumnIndex;

            this.appendColHeader(visualColumnsIndex, TH);
          });
        }

        this.hot.runHooks('afterGetColumnHeaderRenderers', headerRenderers);
        this.#columnHeadersCount = headerRenderers.length;

        return headerRenderers;
      },
      columnWidth: (renderedColumnIndex: number) => {
        const visualIndex = this.hot.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex);

        // It's not a bug that we can't find visual index for some handled by method indexes. The function is called also
        // for indexes that are not displayed (indexes that are beyond the grid's boundaries), i.e. when `fixedColumnsStart` > `startCols` (wrong config?) or
        // scrolling and dataset is empty (scroll should handle that?).
        return this.hot.getColWidth(visualIndex === null ? renderedColumnIndex : visualIndex);
      },
      rowHeight: (renderedRowIndex: number) => {
        const visualIndex = this.hot.rowIndexMapper.getVisualFromRenderableIndex(renderedRowIndex);

        return this.hot.getRowHeight(visualIndex === null ? renderedRowIndex : visualIndex);
      },
      rowHeightByOverlayName: (renderedRowIndex: number, overlayType: string) => {
        const visualIndex = this.hot.rowIndexMapper.getVisualFromRenderableIndex(renderedRowIndex);
        const visualRowIndex = visualIndex === null ? renderedRowIndex : visualIndex;

        return this.hot.runHooks('modifyRowHeightByOverlayName',
          this.hot.getRowHeight(visualRowIndex), visualRowIndex, overlayType);
      },
      cellRenderer: (renderedRowIndex: number, renderedColumnIndex: number, TD: HTMLTableCellElement) => {
        const [visualRowIndex, visualColumnIndex] = this
          .translateFromRenderableToVisualIndex(renderedRowIndex, renderedColumnIndex);

        // Coords may be modified. For example, by the `MergeCells` plugin. It should affect cell value and cell meta.
        const modifiedCellCoords = this.hot
          .runHooks('modifyGetCellCoords', visualRowIndex, visualColumnIndex, false, 'meta');

        let visualRowToCheck = visualRowIndex;
        let visualColumnToCheck = visualColumnIndex;

        if (Array.isArray(modifiedCellCoords)) {
          [visualRowToCheck, visualColumnToCheck] = modifiedCellCoords;
        }

        const cellProperties = (this.hot as any).getCellMeta(visualRowToCheck, visualColumnToCheck);
        const prop = (this.hot as any).colToProp(visualColumnToCheck);
        let value = this.hot.getDataAtRowProp(visualRowToCheck, prop);

        if ((this.hot as any).hasHook('beforeValueRender')) {
          value = this.hot.runHooks('beforeValueRender', value, cellProperties);
        }

        this.hot.runHooks('beforeRenderer', TD, visualRowIndex, visualColumnIndex, prop, value, cellProperties);
        this.hot.getCellRenderer(cellProperties)(
          this.hot,
          TD,
          visualRowIndex,
          visualColumnIndex,
          prop,
          value,
          cellProperties
        );

        this.hot.runHooks('afterRenderer', TD, visualRowIndex, visualColumnIndex, prop, value, cellProperties);
      },
      selections: this.hot.selection.highlight,
      hideBorderOnMouseDownOver: () => this.settings.fragmentSelection,
      onWindowResize: () => {
        if (this.hot && !this.hot.isDestroyed) {
          this.hot.refreshDimensions();
        }
      },
      onContainerElementResize: () => {
        if (this.hot && !this.hot.isDestroyed && isVisible(this.hot.rootElement)) {
          this.hot.refreshDimensions();
        }
      },
      onCellMouseDown: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, wt: CoreAbstract) => {
        const visualCoords = this.translateFromRenderableToVisualCoords(coords);
        const controller = {
          row: false,
          column: false,
          cell: false
        };

        this.hot.listen();

        this.activeWt = wt;
        this.#mouseDown = true;
        this.#mouseDownLastPos = { x: event.clientX, y: event.clientY };

        this.hot.runHooks('beforeOnCellMouseDown', event, visualCoords, TD, controller);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        handleMouseEvent(event, {
          coords: visualCoords,
          selection: this.hot.selection as any,
          controller,
          cellCoordsFactory: (row: number, column: number) => this.hot._createCellCoords(row, column),
        });

        this.hot.runHooks('afterOnCellMouseDown', event, visualCoords, TD);
        this.activeWt = this._wt;
      },
      onCellContextMenu: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, wt: CoreAbstract) => {
        const visualCoords = this.translateFromRenderableToVisualCoords(coords);

        this.activeWt = wt;
        this.#mouseDown = false;

        if (this.hot.selection.isInProgress()) {
          this.hot.selection.finish();
        }

        this.hot.runHooks('beforeOnCellContextMenu', event, visualCoords, TD);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        this.hot.runHooks('afterOnCellContextMenu', event, visualCoords, TD);

        this.activeWt = this._wt;
      },
      onCellMouseOut: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, wt: CoreAbstract) => {
        const visualCoords = this.translateFromRenderableToVisualCoords(coords);

        this.activeWt = wt;
        this.hot.runHooks('beforeOnCellMouseOut', event, visualCoords, TD);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        this.hot.runHooks('afterOnCellMouseOut', event, visualCoords, TD);
        this.activeWt = this._wt;
      },
      onCellMouseOver: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, wt: CoreAbstract) => {
        const visualCoords = this.translateFromRenderableToVisualCoords(coords);
        const controller = {
          row: false,
          column: false,
          cell: false
        };

        this.activeWt = wt;
        this.hot.runHooks('beforeOnCellMouseOver', event, visualCoords, TD, controller);

        if (isImmediatePropagationStopped(event)) {
          return;
        }

        // Ignore mouseover events when the mouse has not moved. This solves an issue (#dev-1479) where
        // column resizing triggered by the long text in the cell causes the mouseover event to be fired,
        // thus selecting multiple cells with no user intention.
        if (
          this.#mouseDown &&
          (
            !this.#mouseDownLastPos ||
            this.#mouseDownLastPos.x !== event.clientX ||
            this.#mouseDownLastPos.y !== event.clientY
          )
        ) {
          handleMouseEvent(event, {
            coords: visualCoords,
            selection: this.hot.selection as any,
            controller,
            cellCoordsFactory: (row: number, column: number) => this.hot._createCellCoords(row, column),
          });
        }

        this.hot.runHooks('afterOnCellMouseOver', event, visualCoords, TD);
        this.activeWt = this._wt;
        this.#mouseDownLastPos = null;
      },
      onCellMouseUp: (event: MouseEvent, coords: CellCoords, TD: HTMLTableCellElement, wt: CoreAbstract) => {
        const visualCoords = this.translateFromRenderableToVisualCoords(coords);

        this.activeWt = wt;
        this.hot.runHooks('beforeOnCellMouseUp', event, visualCoords, TD);

        // TODO: The second condition check is a workaround. Callback corresponding the method `updateSettings`
        // disable plugin and enable it again. Disabling plugin closes the menu. Thus, calling the
        // `updateSettings` in a body of any callback executed right after some context-menu action
        // breaks the table (#7231).
        if (isImmediatePropagationStopped(event) || this.hot.isDestroyed) {
          return;
        }

        this.hot.runHooks('afterOnCellMouseUp', event, visualCoords, TD);
        this.activeWt = this._wt;
      },
      onCellCornerMouseDown: (event: MouseEvent) => {
        event.preventDefault();
        this.hot.runHooks('afterOnCellCornerMouseDown', event);
      },
      onCellCornerDblClick: (event: MouseEvent) => {
        event.preventDefault();
        this.hot.runHooks('afterOnCellCornerDblClick', event);
      },
      beforeDraw: (force: boolean, skipRender: { skipRender: boolean }) => this.beforeRender(force, skipRender),
      onDraw: (force: boolean) => this.afterRender(force),
      onBeforeViewportScrollVertically: (renderableRow: number, snapping: 'auto' | 'top' | 'bottom') => {
        const rowMapper = this.hot.rowIndexMapper;
        const areColumnHeadersSelected = renderableRow < 0;
        let visualRow = renderableRow;

        if (!areColumnHeadersSelected) {
          visualRow = rowMapper.getVisualFromRenderableIndex(renderableRow);

          // for an empty data return index as is
          if (visualRow === null) {
            return renderableRow;
          }
        }

        visualRow = this.hot.runHooks('beforeViewportScrollVertically', visualRow, snapping);
        this.hot.runHooks('beforeViewportScroll');

        if (!areColumnHeadersSelected) {
          return rowMapper.getRenderableFromVisualIndex(visualRow);
        }

        return visualRow;
      },
      onBeforeViewportScrollHorizontally: (renderableColumn: number, snapping: 'auto' | 'start' | 'end') => {
        const columnMapper = this.hot.columnIndexMapper;
        const areRowHeadersSelected = renderableColumn < 0;
        let visualColumn = renderableColumn;

        if (!areRowHeadersSelected) {
          visualColumn = columnMapper.getVisualFromRenderableIndex(renderableColumn);

          // for an empty data return index as is
          if (visualColumn === null) {
            return renderableColumn;
          }
        }

        visualColumn = this.hot.runHooks('beforeViewportScrollHorizontally', visualColumn, snapping);
        this.hot.runHooks('beforeViewportScroll');

        if (!areRowHeadersSelected) {
          return columnMapper.getRenderableFromVisualIndex(visualColumn);
        }

        return visualColumn;
      },
      onScrollVertically: () => {
        this.hot.runHooks('afterScrollVertically');
        this.hot.runHooks('afterScroll');
      },
      onScrollHorizontally: () => {
        this.hot.runHooks('afterScrollHorizontally');
        this.hot.runHooks('afterScroll');
      },
      onBeforeRemoveCellClassNames: () => this.hot.runHooks('beforeRemoveCellClassNames'),
      onBeforeHighlightingRowHeader: (renderableRow: number, headerLevel: number, highlightMeta: any) => {
        const rowMapper = this.hot.rowIndexMapper;
        const areColumnHeadersSelected = renderableRow < 0;
        let visualRow = renderableRow;

        if (!areColumnHeadersSelected) {
          visualRow = rowMapper.getVisualFromRenderableIndex(renderableRow);
        }

        const newVisualRow = this.hot
          .runHooks('beforeHighlightingRowHeader', visualRow, headerLevel, highlightMeta);

        if (!areColumnHeadersSelected) {
          return rowMapper.getRenderableFromVisualIndex(rowMapper.getNearestNotHiddenIndex(newVisualRow, 1));
        }

        return newVisualRow;
      },
      onBeforeHighlightingColumnHeader: (renderableColumn: number, headerLevel: number, highlightMeta: any) => {
        const columnMapper = this.hot.columnIndexMapper;
        const areRowHeadersSelected = renderableColumn < 0;
        let visualColumn = renderableColumn;

        if (!areRowHeadersSelected) {
          visualColumn = columnMapper.getVisualFromRenderableIndex(renderableColumn);
        }

        const newVisualColumn = this.hot
          .runHooks('beforeHighlightingColumnHeader', visualColumn, headerLevel, highlightMeta);

        if (!areRowHeadersSelected) {
          return columnMapper.getRenderableFromVisualIndex(columnMapper.getNearestNotHiddenIndex(newVisualColumn, 1));
        }

        return newVisualColumn;
      },
      onAfterDrawSelection: (currentRow: number, currentColumn: number, layerLevel: number) => {
        let cornersOfSelection: number[] | undefined;
        const [visualRowIndex, visualColumnIndex] =
          this.translateFromRenderableToVisualIndex(currentRow, currentColumn);
        const selectedRange = (this.hot.selection as any).getSelectedRange();
        const selectionRangeSize = selectedRange.size();

        if (selectionRangeSize > 0) {
          const selectionForLayer = selectedRange.peekByIndex(layerLevel ?? 0);

          cornersOfSelection = [
            selectionForLayer.from.row, selectionForLayer.from.col, selectionForLayer.to.row, selectionForLayer.to.col
          ];
        }

        return this.hot.runHooks('afterDrawSelection',
          visualRowIndex, visualColumnIndex, cornersOfSelection, layerLevel);
      },
      onBeforeDrawBorders: (corners: number[], borderClassName: string) => {
        const [startRenderableRow, startRenderableColumn, endRenderableRow, endRenderableColumn] = corners;
        const visualCorners = [
          this.hot.rowIndexMapper.getVisualFromRenderableIndex(startRenderableRow),
          this.hot.columnIndexMapper.getVisualFromRenderableIndex(startRenderableColumn),
          this.hot.rowIndexMapper.getVisualFromRenderableIndex(endRenderableRow),
          this.hot.columnIndexMapper.getVisualFromRenderableIndex(endRenderableColumn),
        ];

        return this.hot.runHooks('beforeDrawBorders', visualCorners, borderClassName);
      },
      onBeforeTouchScroll: () => this.hot.runHooks('beforeTouchScroll'),
      onAfterMomentumScroll: () => this.hot.runHooks('afterMomentumScroll'),
      onModifyRowHeaderWidth: (rowHeaderWidth: number) => this.hot.runHooks('modifyRowHeaderWidth', rowHeaderWidth),
      onModifyGetCellCoords: (renderableRowIndex: number, renderableColumnIndex: number, topmost: boolean, source: string) => {
        const rowMapper = this.hot.rowIndexMapper;
        const columnMapper = this.hot.columnIndexMapper;

        // Callback handle also headers. We shouldn't translate them.
        const visualColumnIndex = renderableColumnIndex >= 0 ?
          columnMapper.getVisualFromRenderableIndex(renderableColumnIndex) : renderableColumnIndex;
        const visualRowIndex = renderableRowIndex >= 0 ?
          rowMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

        const visualIndexes = this.hot
          .runHooks('modifyGetCellCoords', visualRowIndex, visualColumnIndex, topmost, source);

        if (Array.isArray(visualIndexes)) {
          const [visualRowFrom, visualColumnFrom, visualRowTo, visualColumnTo] = visualIndexes;

          // Result of the hook is handled by the Walkontable (renderable indexes).
          return [
            visualRowFrom >= 0 ? rowMapper.getRenderableFromVisualIndex(
              rowMapper.getNearestNotHiddenIndex(visualRowFrom, 1)) : visualRowFrom,
            visualColumnFrom >= 0 ? columnMapper.getRenderableFromVisualIndex(
              columnMapper.getNearestNotHiddenIndex(visualColumnFrom, 1)) : visualColumnFrom,
            visualRowTo >= 0 ? rowMapper.getRenderableFromVisualIndex(
              rowMapper.getNearestNotHiddenIndex(visualRowTo, -1)) : visualRowTo,
            visualColumnTo >= 0 ? columnMapper.getRenderableFromVisualIndex(
              columnMapper.getNearestNotHiddenIndex(visualColumnTo, -1)) : visualColumnTo
          ];
        }
      },
      onModifyGetCoordsElement: (renderableRowIndex: number, renderableColumnIndex: number) => {
        const rowMapper = this.hot.rowIndexMapper;
        const columnMapper = this.hot.columnIndexMapper;

        const visualColumnIndex = renderableColumnIndex >= 0 ?
          columnMapper.getVisualFromRenderableIndex(renderableColumnIndex) : renderableColumnIndex;
        const visualRowIndex = renderableRowIndex >= 0 ?
          rowMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

        const visualIndexes = this.hot.runHooks('modifyGetCoordsElement', visualRowIndex, visualColumnIndex);

        if (Array.isArray(visualIndexes)) {
          const [visualRow, visualColumn] = visualIndexes;

          return [
            visualRow >= 0 ? rowMapper.getRenderableFromVisualIndex(
              rowMapper.getNearestNotHiddenIndex(visualRow, 1)) : visualRow,
            visualColumn >= 0 ? columnMapper.getRenderableFromVisualIndex(
              columnMapper.getNearestNotHiddenIndex(visualColumn, 1)) : visualColumn,
          ];
        }
      },
      viewportRowCalculatorOverride: (calc: { startRow: number; endRow: number }) => {
        let viewportOffset = this.settings.viewportRowRenderingOffset;

        if (viewportOffset === 'auto' && this.settings.fixedRowsTop) {
          viewportOffset = 10;
        }

        if ((typeof viewportOffset === 'number' && viewportOffset > 0) || viewportOffset === 'auto') {
          const renderableRows = this.countRenderableRows();
          const firstRenderedRow = calc.startRow;
          const lastRenderedRow = calc.endRow;

          if (typeof viewportOffset === 'number') {
            calc.startRow = Math.max(firstRenderedRow - viewportOffset, 0);
            calc.endRow = Math.min(lastRenderedRow + viewportOffset, renderableRows - 1);

          } else if (viewportOffset === 'auto') {
            const offset = Math.max(1, Math.ceil(lastRenderedRow / renderableRows * 12));

            calc.startRow = Math.max(firstRenderedRow - offset, 0);
            calc.endRow = Math.min(lastRenderedRow + offset, renderableRows - 1);
          }
        }
        this.hot.runHooks('afterViewportRowCalculatorOverride', calc);
      },
      viewportColumnCalculatorOverride: (calc: { startColumn: number; endColumn: number }) => {
        let viewportOffset = this.settings.viewportColumnRenderingOffset;

        if (viewportOffset === 'auto' && this.settings.fixedColumnsStart) {
          viewportOffset = 10;
        }

        if ((typeof viewportOffset === 'number' && viewportOffset > 0) || viewportOffset === 'auto') {
          const renderableColumns = this.countRenderableColumns();
          const firstRenderedColumn = calc.startColumn;
          const lastRenderedColumn = calc.endColumn;

          if (typeof viewportOffset === 'number') {
            calc.startColumn = Math.max(firstRenderedColumn - viewportOffset, 0);
            calc.endColumn = Math.min(lastRenderedColumn + viewportOffset, renderableColumns - 1);
          }
          if (viewportOffset === 'auto') {
            const offset = Math.max(1, Math.ceil(lastRenderedColumn / renderableColumns * 6));

            calc.startColumn = Math.max(firstRenderedColumn - offset, 0);
            calc.endColumn = Math.min(lastRenderedColumn + offset, renderableColumns - 1);
          }
        }
        this.hot.runHooks('afterViewportColumnCalculatorOverride', calc);
      },
      rowHeaderWidth: () => this.settings.rowHeaderWidth,
      columnHeaderHeight: () => {
        const columnHeaderHeight = this.hot.runHooks('modifyColumnHeaderHeight');

        return this.settings.columnHeaderHeight || columnHeaderHeight;
      }
    };

    this.hot.runHooks('beforeInitWalkontable', walkontableConfig);

    this._wt = new Walkontable(walkontableConfig) as any;
    this.activeWt = this._wt;

    const spreader = this._wt.wtTable.spreader;
    // We have to cache width and height after Walkontable initialization.
    const { width, height } = this.hot.rootElement.getBoundingClientRect();

    this.setLastSize(width, height);

    this.eventManager.addEventListener(spreader, 'mousedown', (event: MouseEvent) => {
      // right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
      if (event.target === spreader && event.which === 3) {
        event.stopPropagation();
      }
    });

    this.eventManager.addEventListener(spreader, 'contextmenu', (event: MouseEvent) => {
      // right mouse button exactly on spreader means right click on the right hand side of vertical scrollbar
      if (event.target === spreader && event.which === 3) {
        event.stopPropagation();
      }
    });

    this.eventManager.addEventListener(this.hot.rootDocument.documentElement, 'click', () => {
      if (this.settings.observeDOMVisibility) {
        if (this._wt.drawInterrupted) {
          this.hot.forceFullRender = true;
          this.render();
        }
      }
    });
  }

  /**
   * Checks if it's possible to create text selection in element.
   *
   * @private
   * @param {HTMLElement} el The element to check.
   * @returns {boolean}
   */
  private isTextSelectionAllowed(el: HTMLElement): boolean {
    if (isInput(el)) {
      return true;
    }
    const isChildOfTableBody = isChildOf(el, this._wt.wtTable.spreader);

    if (this.settings.fragmentSelection === true && isChildOfTableBody) {
      return true;
    }
    if (this.settings.fragmentSelection === 'cell' && this.isSelectedOnlyCell() && isChildOfTableBody) {
      return true;
    }
    if (!this.settings.fragmentSelection && this.isCellEdited() && this.isSelectedOnlyCell()) {
      return true;
    }

    return false;
  }

  /**
   * Checks if user's been called mousedown.
   *
   * @private
   * @returns {boolean}
   */
  private isMouseDown(): boolean {
    return this.#mouseDown;
  }

  /**
   * Check if selected only one cell.
   *
   * @private
   * @returns {boolean}
   */
  private isSelectedOnlyCell(): boolean {
    return this.hot.getSelectedRangeLast()?.isSingleCell() ?? false;
  }

  /**
   * Checks if active cell is editing.
   *
   * @private
   * @returns {boolean}
   */
  private isCellEdited(): boolean {
    const activeEditor = this.hot.getActiveEditor();

    return activeEditor && activeEditor.isOpened();
  }

  /**
   * `beforeDraw` callback.
   *
   * @private
   * @param {boolean} force If `true` rendering was triggered by a change of settings or data or `false` if
   *                        rendering was triggered by scrolling or moving selection.
   * @param {object} skipRender Object with `skipRender` property, if it is set to `true ` the next rendering
   *                            cycle will be skipped.
   */
  private beforeRender(force: boolean, skipRender: { skipRender: boolean }): void {
    if (force) {
      // this.hot.forceFullRender = did Handsontable request full render?
      this.hot.runHooks('beforeViewRender', this.hot.forceFullRender, skipRender);
    }
  }

  /**
   * `afterRender` callback.
   *
   * @private
   * @param {boolean} force If `true` rendering was triggered by a change of settings or data or `false` if
   *                        rendering was triggered by scrolling or moving selection.
   */
  private afterRender(force: boolean): void {
    if (force) {
      // this.hot.forceFullRender = did Handsontable request full render?
      this.hot.runHooks('afterViewRender', this.hot.forceFullRender);
    }
  }

  /**
   * Append row header to a TH element.
   *
   * @private
   * @param {number} visualRowIndex The visual row index.
   * @param {HTMLTableHeaderCellElement} TH The table header element.
   */
  private appendRowHeader(visualRowIndex: number, TH: HTMLTableHeaderCellElement): void {
    if (TH.firstChild) {
      const container = TH.firstChild as HTMLElement;

      if (!hasClass(container, 'relative')) {
        empty(TH);
        this.appendRowHeader(visualRowIndex, TH);

        return;
      }

      this.updateCellHeader(container.querySelector('.rowHeader') as HTMLElement, visualRowIndex, this.hot.getRowHeader);

    } else {
      const { rootDocument, getRowHeader } = this.hot;
      const div = rootDocument.createElement('div');
      const span = rootDocument.createElement('span');

      div.className = 'relative';
      span.className = 'rowHeader';
      this.updateCellHeader(span, visualRowIndex, getRowHeader);

      div.appendChild(span);
      TH.appendChild(div);
    }

    this.hot.runHooks('afterGetRowHeader', visualRowIndex, TH);
  }

  /**
   * Append column header to a TH element.
   *
   * @private
   * @param {number} visualColumnIndex Visual column index.
   * @param {HTMLTableCellElement} TH The table header element.
   * @param {Function} [label] The function that returns the header label.
   * @param {number} [headerLevel=0] The index of header level counting from the top (positive
   *                                 values counting from 0 to N).
   */
  private appendColHeader(
    visualColumnIndex: number,
    TH: HTMLTableCellElement,
    label: (index: number, headerLevel: number) => string = this.hot.getColHeader,
    headerLevel: number = 0
  ): void {
    const getColumnHeaderClassNames = () => {
      const metaHeaderClassNames =
        visualColumnIndex >= 0 ?
          this.hot.getColumnMeta(visualColumnIndex).headerClassName :
          null;

      return metaHeaderClassNames ? metaHeaderClassNames.split(' ') : [];
    };

    if (TH.firstChild) {
      const container = TH.firstChild as HTMLElement;

      if (hasClass(container, 'relative')) {
        this.updateCellHeader(container.querySelector('.colHeader') as HTMLElement, visualColumnIndex, label, headerLevel);

        container.className = '';
        addClass(container, ['relative', ...getColumnHeaderClassNames()]);

      } else {
        empty(TH);
        this.appendColHeader(visualColumnIndex, TH, label, headerLevel);
      }

    } else {
      const { rootDocument } = this.hot;
      const div = rootDocument.createElement('div');
      const span = rootDocument.createElement('span');
      const classNames = getColumnHeaderClassNames();

      div.classList.add('relative', ...classNames);
      span.className = 'colHeader';

      if (this.settings.ariaTags) {
        setAttribute(div, [A11Y_PRESENTATION()]);
        setAttribute(span, [A11Y_PRESENTATION()]);
      }

      this.updateCellHeader(span, visualColumnIndex, label, headerLevel);

      div.appendChild(span);
      TH.appendChild(div);
    }

    this.hot.runHooks('afterGetColHeader', visualColumnIndex, TH, headerLevel);
  }

  /**
   * Updates header cell content.
   *
   * @private
   * @param {HTMLElement} element Element to update.
   * @param {number} index Row index or column index.
   * @param {Function} content Function which should be returns content for this cell.
   * @param {number} [headerLevel=0] The index of header level counting from the top (positive
   *                                 values counting from 0 to N).
   */
  private updateCellHeader(
    element: HTMLElement,
    index: number,
    content: (index: number, headerLevel: number) => string,
    headerLevel: number = 0
  ): void {
    let renderedIndex = index;
    const parentOverlay = this._wt.wtOverlays.getParentOverlay(element) || this._wt;

    // prevent wrong calculations from SampleGenerator
    if (element.parentNode) {
      if (hasClass(element, 'colHeader')) {
        renderedIndex = parentOverlay.wtTable.columnFilter.sourceToRendered(index);

      } else if (hasClass(element, 'rowHeader')) {
        renderedIndex = parentOverlay.wtTable.rowFilter.sourceToRendered(index);
      }
    }

    if (renderedIndex > -1) {
      fastInnerHTML(element, content(index, headerLevel));

    } else {
      // workaround for https://github.com/handsontable/handsontable/issues/1946
      fastInnerText(element, String.fromCharCode(160));
      addClass(element, 'cornerHeader');
    }
  }

  /**
   * Given a element's left (or right in RTL mode) position relative to the viewport, returns maximum
   * element width until the right (or left) edge of the viewport (before scrollbar).
   *
   * @private
   * @param {number} inlineOffset The left (or right in RTL mode) offset.
   * @returns {number}
   */
  private maximumVisibleElementWidth(inlineOffset: number): number {
    const workspaceWidth = this._wt.wtViewport.getWorkspaceWidth();
    const maxWidth = workspaceWidth - inlineOffset;

    return maxWidth > 0 ? maxWidth : 0;
  }

  /**
   * Given a element's top position relative to the viewport, returns maximum element height until the bottom
   * edge of the viewport (before scrollbar).
   *
   * @private
   * @param {number} topOffset The top offset.
   * @returns {number}
   */
  private maximumVisibleElementHeight(topOffset: number): number {
    const workspaceHeight = this._wt.wtViewport.getWorkspaceHeight();
    const maxHeight = workspaceHeight - topOffset;

    return maxHeight > 0 ? maxHeight : 0;
  }

  /**
   * Sets new dimensions of the container.
   *
   * @param {number} width The table width.
   * @param {number} height The table height.
   */
  setLastSize(width: number, height: number): void {
    this.#lastWidth = width;
    this.#lastHeight = height;
  }

  /**
   * Returns cached dimensions.
   *
   * @returns {object}
   */
  getLastSize(): { width: number; height: number } {
    return {
      width: this.#lastWidth,
      height: this.#lastHeight,
    };
  }

  /**
   * Returns the first rendered row in the DOM (usually is not visible in the table's viewport).
   *
   * @returns {number | null}
   */
  getFirstRenderedVisibleRow(): number | null {
    if (!this._wt.wtViewport.rowsRenderCalculator) {
      return null;
    }

    const indexMapper = this.hot.rowIndexMapper;
    const visualRowIndex = indexMapper
      .getVisualFromRenderableIndex(this._wt.wtTable.getFirstRenderedRow());

    return indexMapper.getNearestNotHiddenIndex(visualRowIndex ?? 0, 1);
  }

  /**
   * Returns the last rendered row in the DOM (usually is not visible in the table's viewport).
   *
   * @returns {number | null}
   */
  getLastRenderedVisibleRow(): number | null {
    if (!this._wt.wtViewport.rowsRenderCalculator) {
      return null;
    }

    const indexMapper = this.hot.rowIndexMapper;
    const visualRowIndex = indexMapper
      .getVisualFromRenderableIndex(this._wt.wtTable.getLastRenderedRow());

    return indexMapper.getNearestNotHiddenIndex(visualRowIndex ?? this.hot.countRows() - 1, -1);
  }

  /**
   * Returns the first rendered column in the DOM (usually is not visible in the table's viewport).
   *
   * @returns {number | null}
   */
  getFirstRenderedVisibleColumn(): number | null {
    if (!this._wt.wtViewport.columnsRenderCalculator) {
      return null;
    }

    const indexMapper = this.hot.columnIndexMapper;
    const visualColumnIndex = indexMapper
      .getVisualFromRenderableIndex(this._wt.wtTable.getFirstRenderedColumn());

    return indexMapper.getNearestNotHiddenIndex(visualColumnIndex ?? 0, 1);
  }

  /**
   * Returns the last rendered column in the DOM (usually is not visible in the table's viewport).
   *
   * @returns {number | null}
   */
  getLastRenderedVisibleColumn(): number | null {
    if (!this._wt.wtViewport.columnsRenderCalculator) {
      return null;
    }

    const indexMapper = this.hot.columnIndexMapper;
    const visualColumnIndex = indexMapper
      .getVisualFromRenderableIndex(this._wt.wtTable.getLastRenderedColumn());

    return indexMapper.getNearestNotHiddenIndex(visualColumnIndex ?? this.hot.countCols() - 1, -1);
  }

  /**
   * Returns the first fully visible row in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getFirstFullyVisibleRow(): number {
    return this.hot.rowIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getFirstVisibleRow());
  }

  /**
   * Returns the last fully visible row in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getLastFullyVisibleRow(): number {
    return this.hot.rowIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getLastVisibleRow());
  }

  /**
   * Returns the first fully visible column in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getFirstFullyVisibleColumn(): number {
    return this.hot.columnIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getFirstVisibleColumn());
  }

  /**
   * Returns the last fully visible column in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getLastFullyVisibleColumn(): number {
    return this.hot.columnIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getLastVisibleColumn());
  }

  /**
   * Returns the first partially visible row in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleRow(): number {
    return this.hot.rowIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getFirstPartiallyVisibleRow());
  }

  /**
   * Returns the last partially visible row in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleRow(): number {
    return this.hot.rowIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getLastPartiallyVisibleRow());
  }

  /**
   * Returns the first partially visible column in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleColumn(): number {
    return this.hot.columnIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getFirstPartiallyVisibleColumn());
  }

  /**
   * Returns the last partially visible column in the table viewport. When the table has overlays the method returns
   * the first row of the master table that is not overlapped by overlay.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleColumn(): number {
    return this.hot.columnIndexMapper
      .getVisualFromRenderableIndex(this._wt.wtScroll.getLastPartiallyVisibleColumn());
  }

  /**
   * Returns the total count of the rendered column headers.
   *
   * @returns {number}
   */
  getColumnHeadersCount(): number {
    return this.#columnHeadersCount;
  }

  /**
   * Returns the total count of the rendered row headers.
   *
   * @returns {number}
   */
  getRowHeadersCount(): number {
    return this.#rowHeadersCount;
  }

  /**
   * Returns the table's viewport width. When the table has defined the size of the container,
   * and the columns do not fill the entire viewport, the viewport width is equal to the sum of
   * the columns' widths.
   *
   * @returns {number}
   */
  getViewportWidth(): number {
    return this._wt.wtViewport.getViewportWidth();
  }

  /**
   * Returns the table's total width including the scrollbar width.
   *
   * @returns {number}
   */
  getWorkspaceWidth(): number {
    return this._wt.wtViewport.getWorkspaceWidth();
  }

  /**
   * Returns the table's viewport height. When the table has defined the size of the container,
   * and the rows do not fill the entire viewport, the viewport height is equal to the sum of
   * the rows' heights.
   *
   * @returns {number}
   */
  getViewportHeight(): number {
    return this._wt.wtViewport.getViewportHeight();
  }

  /**
   * Returns the table's total height including the scrollbar height.
   *
   * @returns {number}
   */
  getWorkspaceHeight(): number {
    return this._wt.wtViewport.getWorkspaceHeight();
  }

  /**
   * Checks to what overlay the provided element belongs.
   *
   * @param {HTMLElement} element The DOM element to check.
   * @returns {'master'|'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'}
   */
  getElementOverlayName(element: HTMLElement): 'master' | 'inline_start' | 'top' | 'top_inline_start_corner' | 'bottom' | 'bottom_inline_start_corner' {
    return (this._wt.wtOverlays.getParentOverlay(element) ?? this._wt).wtTable.name;
  }

  /**
   * Gets the overlay instance by its name.
   *
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'} overlayName The overlay name.
   * @returns {Overlay | null}
   */
  getOverlayByName(overlayName: 'inline_start' | 'top' | 'top_inline_start_corner' | 'bottom' | 'bottom_inline_start_corner'): any | null {
    return (this._wt as any).getOverlayByName(overlayName);
  }

  /**
   * Gets the name of the overlay that currently renders the table. If the method is called out of the render cycle
   * the 'master' name is returned.
   *
   * @returns {string}
   */
  getActiveOverlayName(): string {
    return this._wt.activeOverlayName;
  }

  /**
   * Checks if the table is visible or not.
   *
   * @returns {boolean}
   */
  isVisible(): boolean {
    return this._wt.wtTable.isVisible();
  }

  /**
   * Checks if the table has a horizontal scrollbar.
   *
   * @returns {boolean}
   */
  hasVerticalScroll(): boolean {
    return this._wt.wtViewport.hasVerticalScroll;
  }

  /**
   * Checks if the table has a vertical scrollbar.
   *
   * @returns {boolean}
   */
  hasHorizontalScroll(): boolean {
    return this._wt.wtViewport.hasHorizontalScroll;
  }

  /**
   * Gets the table's width.
   *
   * @returns {boolean}
   */
  getTableWidth(): number {
    return this._wt.wtTable.getWidth();
  }

  /**
   * Gets the table's height.
   *
   * @returns {boolean}
   */
  getTableHeight(): number {
    return this._wt.wtTable.getHeight();
  }

  /**
   * Gets the table's offset.
   *
   * @returns {{ left: number, top: number }}
   */
  getTableOffset(): { left: number; top: number } {
    return this._wt.wtViewport.getWorkspaceOffset();
  }

  /**
   * Gets the row header width. If there are multiple row headers, the width of
   * the sum of all of them is returned.
   *
   * @returns {number}
   */
  getRowHeaderWidth(): number {
    return this._wt.wtViewport.getRowHeaderWidth();
  }

  /**
   * Gets the column header height. If there are multiple column headers, the height
   * of the sum of all of them is returned.
   *
   * @returns {number}
   */
  getColumnHeaderHeight(): number {
    return this._wt.wtViewport.getColumnHeaderHeight();
  }

  /**
   * Checks if the table uses the window as a viewport and if there is a vertical scrollbar.
   *
   * @returns {boolean}
   */
  isVerticallyScrollableByWindow(): boolean {
    return this._wt.wtViewport.isVerticallyScrollableByWindow();
  }

  /**
   * Checks if the table uses the window as a viewport and if there is a horizontal scrollbar.
   *
   * @returns {boolean}
   */
  isHorizontallyScrollableByWindow(): boolean {
    return this._wt.wtViewport.isHorizontallyScrollableByWindow();
  }

  /**
   * Return the value of the `aria-colcount` attribute.
   *
   * @returns {number} The value of the `aria-colcount` attribute.
   */
  #getAriaColcount(): number {
    const attrValue = this.hot.rootElement.getAttribute(A11Y_COLCOUNT(0)[0]) || '0';
    return parseInt(attrValue, 10);
  }

  /**
   * Update the `aria-colcount` attribute by the provided value.
   *
   * @param {number} delta The number of columns to add or remove to the aria tag.
   */
  #updateAriaColcount(delta: number): void {
    const colCount = this.#getAriaColcount() + delta;

    setAttribute(this.hot.rootElement, [A11Y_COLCOUNT(colCount)]);
  }

  /**
   * Updates the class names on the root element based on the presence of scrollbars.
   *
   * This method checks if the table has vertical and/or horizontal scrollbars and
   * adds or removes the corresponding class names (`htHasScrollY` and `htHasScrollX`)
   * to/from the root element.
   */
  #updateScrollbarClassNames(): void {
    const rootElement = this.hot.rootElement;

    if (this.hasVerticalScroll()) {
      addClass(rootElement, 'htHasScrollY');
    } else {
      removeClass(rootElement, 'htHasScrollY');
    }

    if (this.hasHorizontalScroll()) {
      addClass(rootElement, 'htHasScrollX');
    } else {
      removeClass(rootElement, 'htHasScrollX');
    }
  }

  /**
   * Destroys internal WalkOnTable's instance. Detaches all of the bonded listeners.
   *
   * @private
   */
  destroy(): void {
    this._wt.destroy();
    this.eventManager.destroy();
  }
}

export default TableView;
