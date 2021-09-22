import {
  hasClass,
  index,
  offset,
  removeClass,
  removeTextNodes,
  overlayContainsElement,
  closest,
  outerWidth,
  innerHeight,
  isVisible,
} from './../../../helpers/dom/element';
import { isFunction } from './../../../helpers/function';
import CellCoords from './cell/coords';
import ColumnFilter from './filter/column';
import RowFilter from './filter/row';
import { Renderer } from './renderer';
import ColumnUtils from './utils/column';
import RowUtils from './utils/row';
import { isOverlayTypeOf } from './overlay/registerer';
import {
  CLONE_TOP,
  CLONE_BOTTOM,
  CLONE_LEFT,
  CLONE_TOP_LEFT_CORNER,
  CLONE_BOTTOM_LEFT_CORNER,
} from './overlay/constants';

/**
 *
 */
class Table {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   * @param {HTMLTableElement} table An element to the Walkontable generated table is injected.
   */
  constructor(wotInstance, table) {
    /**
     * Indicates if this instance is of type `MasterTable` (i.e. It is NOT an overlay).
     *
     * @type {boolean}
     */
    this.isMaster = !wotInstance.cloneOverlay; // "instanceof" operator isn't used, because it caused a circular reference in Webpack
    this.wot = wotInstance;

    // legacy support
    this.instance = this.wot;
    this.TABLE = table;
    this.TBODY = null;
    this.THEAD = null;
    this.COLGROUP = null;
    this.tableOffset = 0;
    this.holderOffset = 0;
    /**
     * Indicates if the table has height bigger than 0px.
     *
     * @type {boolean}
     */
    this.hasTableHeight = true;
    /**
     * Indicates if the table has width bigger than 0px.
     *
     * @type {boolean}
     */
    this.hasTableWidth = true;
    /**
     * Indicates if the table is visible. By visible, it means that the holder
     * element has CSS 'display' property different than 'none'.
     *
     * @type {boolean}
     */
    this.isTableVisible = false;

    removeTextNodes(this.TABLE);

    this.spreader = this.createSpreader(this.TABLE);
    this.hider = this.createHider(this.spreader);
    this.holder = this.createHolder(this.hider);

    this.wtRootElement = this.holder.parentNode;

    if (this.isMaster) {
      this.alignOverlaysWithTrimmingContainer();
    }
    this.fixTableDomTree();

    this.rowFilter = null;
    this.columnFilter = null;
    this.correctHeaderWidth = false;

    const origRowHeaderWidth = this.wot.wtSettings.settings.rowHeaderWidth;

    // Fix for jumping row headers (https://github.com/handsontable/handsontable/issues/3850)
    this.wot.wtSettings.settings.rowHeaderWidth = () => this._modifyRowHeaderWidth(origRowHeaderWidth);

    this.rowUtils = new RowUtils(this.wot);
    this.columnUtils = new ColumnUtils(this.wot);
    this.tableRenderer = new Renderer({
      TABLE: this.TABLE,
      THEAD: this.THEAD,
      COLGROUP: this.COLGROUP,
      TBODY: this.TBODY,
      rowUtils: this.rowUtils,
      columnUtils: this.columnUtils,
      cellRenderer: this.wot.wtSettings.settings.cellRenderer,
    });
  }

  /**
   * Returns a boolean that is true if this intance of Table represents a specific overlay, identified by the overlay name.
   * For MasterTable, it returns false.
   *
   * @param {string} overlayTypeName The overlay type.
   * @returns {boolean}
   */
  is(overlayTypeName) {
    return isOverlayTypeOf(this.wot.cloneOverlay, overlayTypeName);
  }

  /**
   *
   */
  fixTableDomTree() {
    const rootDocument = this.wot.rootDocument;

    this.TBODY = this.TABLE.querySelector('tbody');

    if (!this.TBODY) {
      this.TBODY = rootDocument.createElement('tbody');
      this.TABLE.appendChild(this.TBODY);
    }
    this.THEAD = this.TABLE.querySelector('thead');

    if (!this.THEAD) {
      this.THEAD = rootDocument.createElement('thead');
      this.TABLE.insertBefore(this.THEAD, this.TBODY);
    }
    this.COLGROUP = this.TABLE.querySelector('colgroup');

    if (!this.COLGROUP) {
      this.COLGROUP = rootDocument.createElement('colgroup');
      this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
    }

    if (this.wot.getSetting('columnHeaders').length && !this.THEAD.childNodes.length) {
      this.THEAD.appendChild(rootDocument.createElement('TR'));
    }
  }

  /**
   * @param {HTMLTableElement} table An element to process.
   * @returns {HTMLElement}
   */
  createSpreader(table) {
    const parent = table.parentNode;
    let spreader;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE || !hasClass(parent, 'wtHolder')) {
      spreader = this.wot.rootDocument.createElement('div');
      spreader.className = 'wtSpreader';

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        parent.insertBefore(spreader, table);
      }
      spreader.appendChild(table);
    }
    spreader.style.position = 'relative';

    return spreader;
  }

  /**
   * @param {HTMLElement} spreader An element to the hider element is injected.
   * @returns {HTMLElement}
   */
  createHider(spreader) {
    const parent = spreader.parentNode;
    let hider;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE || !hasClass(parent, 'wtHolder')) {
      hider = this.wot.rootDocument.createElement('div');
      hider.className = 'wtHider';

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        parent.insertBefore(hider, spreader);
      }
      hider.appendChild(spreader);
    }

    return hider;
  }

  /**
   *
   * @param {HTMLElement} hider An element to the holder element is injected.
   * @returns {HTMLElement}
   */
  createHolder(hider) {
    const parent = hider.parentNode;
    let holder;

    if (!parent || parent.nodeType !== Node.ELEMENT_NODE || !hasClass(parent, 'wtHolder')) {
      holder = this.wot.rootDocument.createElement('div');
      holder.style.position = 'relative';
      holder.className = 'wtHolder';

      if (parent) {
        // if TABLE is detached (e.g. in Jasmine test), it has no parentNode so we cannot attach holder to it
        parent.insertBefore(holder, hider);
      }
      if (this.isMaster) {
        holder.parentNode.className += 'ht_master handsontable';
      }
      holder.appendChild(hider);
    }

    return holder;
  }

  /**
   * Redraws the table.
   *
   * @param {boolean} [fastDraw=false] If TRUE, will try to avoid full redraw and only update the border positions.
   *                                   If FALSE or UNDEFINED, will perform a full redraw.
   * @returns {Table}
   */
  draw(fastDraw = false) {
    const { wot } = this;
    const { wtOverlays, wtViewport } = wot;
    const totalRows = wot.getSetting('totalRows');
    const totalColumns = wot.getSetting('totalColumns');
    const rowHeaders = wot.getSetting('rowHeaders');
    const rowHeadersCount = rowHeaders.length;
    const columnHeaders = wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;
    let syncScroll = false;
    let runFastDraw = fastDraw;

    if (this.isMaster) {
      this.holderOffset = offset(this.holder);
      runFastDraw = wtViewport.createRenderCalculators(runFastDraw);

      if (rowHeadersCount && !wot.getSetting('fixedColumnsLeft')) {
        const leftScrollPos = wtOverlays.leftOverlay.getScrollPosition();
        const previousState = this.correctHeaderWidth;

        this.correctHeaderWidth = leftScrollPos > 0;

        if (previousState !== this.correctHeaderWidth) {
          runFastDraw = false;
        }
      }
    }

    if (this.isMaster) {
      syncScroll = wtOverlays.prepareOverlays();
    }

    if (runFastDraw) {
      if (this.isMaster) {
        // in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
        wtViewport.createVisibleCalculators();
      }
      if (wtOverlays) {
        wtOverlays.refresh(true);
      }
    } else {
      if (this.isMaster) {
        this.tableOffset = offset(this.TABLE);
      } else {
        this.tableOffset = this.wot.cloneSource.wtTable.tableOffset;
      }
      const startRow = totalRows > 0 ? this.getFirstRenderedRow() : 0;
      const startColumn = totalColumns > 0 ? this.getFirstRenderedColumn() : 0;

      this.rowFilter = new RowFilter(startRow, totalRows, columnHeadersCount);
      this.columnFilter = new ColumnFilter(startColumn, totalColumns, rowHeadersCount);

      let performRedraw = true;

      // Only master table rendering can be skipped
      if (this.isMaster) {
        this.alignOverlaysWithTrimmingContainer();
        const skipRender = {};

        this.wot.getSetting('beforeDraw', true, skipRender);
        performRedraw = skipRender.skipRender !== true;
      }

      if (performRedraw) {
        this.tableRenderer.setHeaderContentRenderers(rowHeaders, columnHeaders);

        if (this.is(CLONE_BOTTOM) ||
            this.is(CLONE_BOTTOM_LEFT_CORNER)) {
          // do NOT render headers on the bottom or bottom-left corner overlay
          this.tableRenderer.setHeaderContentRenderers(rowHeaders, []);
        }

        this.resetOversizedRows();

        this.tableRenderer
          .setViewportSize(this.getRenderedRowsCount(), this.getRenderedColumnsCount())
          .setFilters(this.rowFilter, this.columnFilter)
          .render();

        let workspaceWidth;

        if (this.isMaster) {
          workspaceWidth = this.wot.wtViewport.getWorkspaceWidth();
          this.wot.wtViewport.containerWidth = null;
          this.markOversizedColumnHeaders();
        }

        this.adjustColumnHeaderHeights();

        if (this.isMaster || this.is(CLONE_BOTTOM)) {
          this.markOversizedRows();
        }

        if (this.isMaster) {
          this.wot.wtViewport.createVisibleCalculators();
          this.wot.wtOverlays.refresh(false);
          this.wot.wtOverlays.applyToDOM();

          const hiderWidth = outerWidth(this.hider);
          const tableWidth = outerWidth(this.TABLE);

          if (hiderWidth !== 0 && (tableWidth !== hiderWidth)) {
            // Recalculate the column widths, if width changes made in the overlays removed the scrollbar, thus changing the viewport width.
            this.columnUtils.calculateWidths();
            this.tableRenderer.renderer.colGroup.render();
          }

          if (workspaceWidth !== this.wot.wtViewport.getWorkspaceWidth()) {
            // workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
            this.wot.wtViewport.containerWidth = null;
            this.columnUtils.calculateWidths();
            this.tableRenderer.renderer.colGroup.render();
          }

          this.wot.getSetting('onDraw', true);

        } else if (this.is(CLONE_BOTTOM)) {
          this.wot.cloneSource.wtOverlays.adjustElementsSize();
        }
      }
    }

    if (this.isMaster) {
      let positionChanged = wtOverlays.topOverlay.resetFixedPosition();

      if (wtOverlays.bottomOverlay.clone) {
        positionChanged = wtOverlays.bottomOverlay.resetFixedPosition() || positionChanged;
      }

      positionChanged = wtOverlays.leftOverlay.resetFixedPosition() || positionChanged;

      if (wtOverlays.topLeftCornerOverlay) {
        wtOverlays.topLeftCornerOverlay.resetFixedPosition();
      }

      if (wtOverlays.bottomLeftCornerOverlay && wtOverlays.bottomLeftCornerOverlay.clone) {
        wtOverlays.bottomLeftCornerOverlay.resetFixedPosition();
      }

      if (positionChanged) {
        // It refreshes the cells borders caused by a 1px shift (introduced by overlays which add or
        // remove `innerBorderTop` and `innerBorderLeft` CSS classes to the DOM element. This happens
        // when there is a switch between rendering from 0 to N rows/columns and vice versa).
        wtOverlays.refreshAll();
        wtOverlays.adjustElementsSize();
      }
    }

    this.refreshSelections(runFastDraw);

    if (syncScroll) {
      wtOverlays.syncScrollWithMaster();
    }

    wot.drawn = true;

    return this;
  }

  /**
   * @param {number} col The visual column index.
   */
  markIfOversizedColumnHeader(col) {
    const sourceColIndex = this.wot.wtTable.columnFilter.renderedToSource(col);
    let level = this.wot.getSetting('columnHeaders').length;
    const defaultRowHeight = this.wot.wtSettings.settings.defaultRowHeight;
    let previousColHeaderHeight;
    let currentHeader;
    let currentHeaderHeight;
    const columnHeaderHeightSetting = this.wot.getSetting('columnHeaderHeight') || [];

    while (level) {
      level -= 1;

      previousColHeaderHeight = this.wot.wtTable.getColumnHeaderHeight(level);
      currentHeader = this.wot.wtTable.getColumnHeader(sourceColIndex, level);

      if (!currentHeader) {
        /* eslint-disable no-continue */
        continue;
      }
      currentHeaderHeight = innerHeight(currentHeader);

      if (!previousColHeaderHeight &&
          defaultRowHeight < currentHeaderHeight || previousColHeaderHeight < currentHeaderHeight) {
        this.wot.wtViewport.oversizedColumnHeaders[level] = currentHeaderHeight;
      }

      if (Array.isArray(columnHeaderHeightSetting)) {
        if (columnHeaderHeightSetting[level] !== null && columnHeaderHeightSetting[level] !== void 0) {
          this.wot.wtViewport.oversizedColumnHeaders[level] = columnHeaderHeightSetting[level];
        }

      } else if (!isNaN(columnHeaderHeightSetting)) {
        this.wot.wtViewport.oversizedColumnHeaders[level] = columnHeaderHeightSetting;
      }

      if (this.wot.wtViewport.oversizedColumnHeaders[level] < (columnHeaderHeightSetting[level] ||
          columnHeaderHeightSetting)) {
        this.wot.wtViewport.oversizedColumnHeaders[level] = (columnHeaderHeightSetting[level] || columnHeaderHeightSetting); // eslint-disable-line max-len
      }
    }
  }

  /**
   *
   */
  adjustColumnHeaderHeights() {
    const { wot } = this;
    const children = wot.wtTable.THEAD.childNodes;
    const oversizedColumnHeaders = wot.wtViewport.oversizedColumnHeaders;
    const columnHeaders = wot.getSetting('columnHeaders');

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      if (oversizedColumnHeaders[i]) {
        if (!children[i] || children[i].childNodes.length === 0) {
          return;
        }
        children[i].childNodes[0].style.height = `${oversizedColumnHeaders[i]}px`;
      }
    }
  }

  /**
   * Resets cache of row heights. The cache should be cached for each render cycle in a case
   * when new cell values have content which increases/decreases cell height.
   */
  resetOversizedRows() {
    const { wot } = this;

    if (!this.isMaster && !this.is(CLONE_BOTTOM)) {
      return;
    }

    if (!wot.getSetting('externalRowCalculator')) {
      const rowsToRender = this.getRenderedRowsCount();

      // Reset the oversized row cache for rendered rows
      for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
        const sourceRow = this.rowFilter.renderedToSource(visibleRowIndex);

        if (wot.wtViewport.oversizedRows && wot.wtViewport.oversizedRows[sourceRow]) {
          wot.wtViewport.oversizedRows[sourceRow] = void 0;
        }
      }
    }
  }

  /**
   * @param {string} className The CSS class name to remove from the table cells.
   */
  removeClassFromCells(className) {
    const nodes = this.TABLE.querySelectorAll(`.${className}`);

    for (let i = 0, len = nodes.length; i < len; i++) {
      removeClass(nodes[i], className);
    }
  }

  /**
   * Refresh the table selection by re-rendering Selection instances connected with that instance.
   *
   * @param {boolean} fastDraw If fast drawing is enabled than additionally className clearing is applied.
   */
  refreshSelections(fastDraw) {
    const { wot } = this;

    if (!wot.selections) {
      return;
    }
    const highlights = Array.from(wot.selections);
    const len = highlights.length;

    if (fastDraw) {
      const classesToRemove = [];

      for (let i = 0; i < len; i++) {
        const {
          highlightHeaderClassName,
          highlightRowClassName,
          highlightColumnClassName,
        } = highlights[i].settings;
        const classNames = highlights[i].classNames;
        const classNamesLength = classNames.length;

        for (let j = 0; j < classNamesLength; j++) {
          if (!classesToRemove.includes(classNames[j])) {
            classesToRemove.push(classNames[j]);
          }
        }

        if (highlightHeaderClassName && !classesToRemove.includes(highlightHeaderClassName)) {
          classesToRemove.push(highlightHeaderClassName);
        }
        if (highlightRowClassName && !classesToRemove.includes(highlightRowClassName)) {
          classesToRemove.push(highlightRowClassName);
        }
        if (highlightColumnClassName && !classesToRemove.includes(highlightColumnClassName)) {
          classesToRemove.push(highlightColumnClassName);
        }
      }

      const additionalClassesToRemove = wot.getSetting('onBeforeRemoveCellClassNames');

      if (Array.isArray(additionalClassesToRemove)) {
        for (let i = 0; i < additionalClassesToRemove.length; i++) {
          classesToRemove.push(additionalClassesToRemove[i]);
        }
      }

      const classesToRemoveLength = classesToRemove.length;

      for (let i = 0; i < classesToRemoveLength; i++) {
        // there was no rerender, so we need to remove classNames by ourselves
        this.removeClassFromCells(classesToRemove[i]);
      }
    }

    for (let i = 0; i < len; i++) {
      highlights[i].draw(wot, fastDraw);
    }
  }

  /**
   * Get cell element at coords.
   * Negative coords.row or coords.col are used to retrieve header cells. If there are multiple header levels, the
   * negative value corresponds to the distance from the working area. For example, when there are 3 levels of column
   * headers, coords.col=-1 corresponds to the most inner header element, while coords.col=-3 corresponds to the
   * outmost header element.
   *
   * In case an element for the coords is not rendered, the method returns an error code.
   * To produce the error code, the input parameters are validated in the order in which they
   * are given. Thus, if both the row and the column coords are out of the rendered bounds,
   * the method returns the error code for the row.
   *
   * @param {CellCoords} coords The cell coordinates.
   * @returns {HTMLElement|number} HTMLElement on success or Number one of the exit codes on error:
   *  -1 row before viewport
   *  -2 row after viewport
   *  -3 column before viewport
   *  -4 column after viewport.
   */
  getCell(coords) {
    let row = coords.row;
    let column = coords.col;
    const hookResult = this.wot.getSetting('onModifyGetCellCoords', row, column);

    if (hookResult && Array.isArray(hookResult)) {
      [row, column] = hookResult;
    }

    if (this.isRowBeforeRenderedRows(row)) {
      // row before rendered rows
      return -1;

    } else if (this.isRowAfterRenderedRows(row)) {
      // row after rendered rows
      return -2;

    } else if (this.isColumnBeforeRenderedColumns(column)) {
      // column before rendered columns
      return -3;

    } else if (this.isColumnAfterRenderedColumns(column)) {
      // column after rendered columns
      return -4;
    }

    let TR;

    if (row < 0) {
      TR = this.THEAD.childNodes[this.rowFilter.sourceRowToVisibleColHeadedRow(row)];
    } else {
      TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
    }

    if (!TR && row >= 0) {
      throw new Error('TR was expected to be rendered but is not');
    }

    const TD = TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(column)];

    if (!TD && column >= 0) {
      throw new Error('TD or TH was expected to be rendered but is not');
    }

    return TD;
  }

  /**
   * GetColumnHeader.
   *
   * @param {number} col Column index.
   * @param {number} [level=0] Header level (0 = most distant to the table).
   * @returns {object} HTMLElement on success or undefined on error.
   */
  getColumnHeader(col, level = 0) {
    const TR = this.THEAD.childNodes[level];

    return TR?.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
  }

  /**
   * Gets all columns headers (TH elements) from the table.
   *
   * @param {number} column A source column index.
   * @returns {HTMLTableCellElement[]}
   */
  getColumnHeaders(column) {
    const THs = [];
    const visibleColumn = this.columnFilter.sourceColumnToVisibleRowHeadedColumn(column);

    this.THEAD.childNodes.forEach((TR) => {
      const TH = TR.childNodes[visibleColumn];

      if (TH) {
        THs.push(TH);
      }
    });

    return THs;
  }

  /**
   * GetRowHeader.
   *
   * @param {number} row Row index.
   * @param {number} [level=0] Header level (0 = most distant to the table).
   * @returns {HTMLElement} HTMLElement on success or Number one of the exit codes on error: `null table doesn't have row headers`.
   */
  getRowHeader(row, level = 0) {
    if (this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) === 0) {
      return;
    }

    const rowHeadersCount = this.wot.getSetting('rowHeaders').length;

    if (level >= rowHeadersCount) {
      return;
    }

    const TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

    return TR?.childNodes[level];
  }

  /**
   * Gets all rows headers (TH elements) from the table.
   *
   * @param {number} row A source row index.
   * @returns {HTMLTableCellElement[]}
   */
  getRowHeaders(row) {
    if (this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) === 0) {
      return [];
    }

    const THs = [];
    const rowHeadersCount = this.wot.getSetting('rowHeaders').length;

    for (let renderedRowIndex = 0; renderedRowIndex < rowHeadersCount; renderedRowIndex++) {
      const TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
      const TH = TR?.childNodes[renderedRowIndex];

      if (TH) {
        THs.push(TH);
      }
    }

    return THs;
  }

  /**
   * Returns cell coords object for a given TD (or a child element of a TD element).
   *
   * @param {HTMLTableCellElement} TD A cell DOM element (or a child of one).
   * @returns {CellCoords|null} The coordinates of the provided TD element (or the closest TD element) or null, if the provided element is not applicable.
   */
  getCoords(TD) {
    let cellElement = TD;

    if (cellElement.nodeName !== 'TD' && cellElement.nodeName !== 'TH') {
      cellElement = closest(cellElement, ['TD', 'TH']);
    }

    if (cellElement === null) {
      return null;
    }

    const TR = cellElement.parentNode;
    const CONTAINER = TR.parentNode;
    let row = index(TR);
    let col = cellElement.cellIndex;

    if (overlayContainsElement(CLONE_TOP_LEFT_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_TOP, cellElement, this.wtRootElement)) {
      if (CONTAINER.nodeName === 'THEAD') {
        row -= CONTAINER.childNodes.length;
      }

    } else if (overlayContainsElement(CLONE_BOTTOM_LEFT_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM, cellElement, this.wtRootElement)) {
      const totalRows = this.wot.getSetting('totalRows');

      row = totalRows - CONTAINER.childNodes.length + row;

    } else if (CONTAINER === this.THEAD) {
      row = this.rowFilter.visibleColHeadedRowToSourceRow(row);

    } else {
      row = this.rowFilter.renderedToSource(row);
    }

    if (overlayContainsElement(CLONE_TOP_LEFT_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_LEFT, cellElement, this.wtRootElement)
      || overlayContainsElement(CLONE_BOTTOM_LEFT_CORNER, cellElement, this.wtRootElement)) {
      col = this.columnFilter.offsettedTH(col);

    } else {
      col = this.columnFilter.visibleRowHeadedColumnToSourceColumn(col);
    }

    return new CellCoords(row, col);
  }

  /**
   * Check if any of the rendered rows is higher than expected, and if so, cache them.
   */
  markOversizedRows() {
    if (this.wot.getSetting('externalRowCalculator')) {
      return;
    }
    let rowCount = this.TBODY.childNodes.length;
    const expectedTableHeight = rowCount * this.wot.wtSettings.settings.defaultRowHeight;
    const actualTableHeight = innerHeight(this.TBODY) - 1;
    let previousRowHeight;
    let rowInnerHeight;
    let sourceRowIndex;
    let currentTr;
    let rowHeader;

    if (expectedTableHeight === actualTableHeight && !this.wot.getSetting('fixedRowsBottom')) {
      // If the actual table height equals rowCount * default single row height, no row is oversized -> no need to iterate over them
      return;
    }

    while (rowCount) {
      rowCount -= 1;
      sourceRowIndex = this.rowFilter.renderedToSource(rowCount);
      previousRowHeight = this.getRowHeight(sourceRowIndex);
      currentTr = this.getTrForRow(sourceRowIndex);
      rowHeader = currentTr.querySelector('th');

      if (rowHeader) {
        rowInnerHeight = innerHeight(rowHeader);
      } else {
        rowInnerHeight = innerHeight(currentTr) - 1;
      }

      if ((!previousRowHeight && this.wot.wtSettings.settings.defaultRowHeight < rowInnerHeight ||
          previousRowHeight < rowInnerHeight)) {
        rowInnerHeight += 1;
        this.wot.wtViewport.oversizedRows[sourceRowIndex] = rowInnerHeight;
      }
    }
  }

  /**
   * @param {number} row The visual row index.
   * @returns {HTMLTableElement}
   */
  getTrForRow(row) {
    return this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
  }

  /**
   * Checks if the column index (negative value from -1 to N) is rendered.
   *
   * @param {number} column The column index (negative value from -1 to N).
   * @returns {boolean}
   */
  isColumnHeaderRendered(column) {
    if (column >= 0) {
      return false;
    }

    const rowHeaders = this.wot.getSetting('rowHeaders');
    const rowHeadersCount = rowHeaders.length;

    return Math.abs(column) <= rowHeadersCount;
  }

  /**
   * Checks if the row index (negative value from -1 to N) is rendered.
   *
   * @param {number} row The row index (negative value from -1 to N).
   * @returns {boolean}
   */
  isRowHeaderRendered(row) {
    if (row >= 0) {
      return false;
    }

    const columnHeaders = this.wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    return Math.abs(row) <= columnHeadersCount;
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Check if the given row index is lower than the index of the first row that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * Negative row index is used to check the columns' headers.
   *
   *  Headers
   *           +--------------+                                     │
   *       -3  │    │    │    │                                     │
   *           +--------------+                                     │
   *       -2  │    │    │    │                                     │ TRUE
   *           +--------------+                                     │
   *       -1  │    │    │    │                                     │
   *  Cells  +==================+                                   │
   *        0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
   *           +--------------+      the master overlay do       ---+ first rendered row (index 1)
   *        1  │ A2 │ B2 │ C2 │      not render the first row.      │
   *           +--------------+                                     │ FALSE
   *        2  │ A3 │ B3 │ C3 │                                     │
   *           +--------------+                                  ---+ last rendered row
   *                                                                │
   *                                                                │ FALSE
   *
   * @param {number} row The visual row index.
   * @memberof Table#
   * @function isRowBeforeRenderedRows
   * @returns {boolean}
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  isRowBeforeRenderedRows(row) {
    const first = this.getFirstRenderedRow();

    // Check the headers only in case when the first rendered row is -1 or 0.
    // This is an indication that the overlay is placed on the most top position.
    if (row < 0 && first <= 0) {
      return !this.isRowHeaderRendered(row);
    }

    return row < first;
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Check if the given column index is greater than the index of the last column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * The negative row index is used to check the columns' headers. However,
   * keep in mind that for negative indexes, the method always returns FALSE as
   * it is not possible to render headers partially. The "after" index can not be
   * lower than -1.
   *
   *  Headers
   *           +--------------+                                     │
   *       -3  │    │    │    │                                     │
   *           +--------------+                                     │
   *       -2  │    │    │    │                                     │ FALSE
   *           +--------------+                                     │
   *       -1  │    │    │    │                                     │
   *  Cells  +==================+                                   │
   *        0  ┇    ┇    ┇    ┇ <--- For fixedRowsTop: 1            │
   *           +--------------+      the master overlay do       ---+ first rendered row (index 1)
   *        1  │ A2 │ B2 │ C2 │      not render the first rows      │
   *           +--------------+                                     │ FALSE
   *        2  │ A3 │ B3 │ C3 │                                     │
   *           +--------------+                                  ---+ last rendered row
   *                                                                │
   *                                                                │ TRUE
   *
   * @param {number} row The visual row index.
   * @memberof Table#
   * @function isRowAfterRenderedRows
   * @returns {boolean}
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  isRowAfterRenderedRows(row) {
    return row > this.getLastRenderedRow();
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Check if the given column index is lower than the index of the first column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * Negative column index is used to check the rows' headers.
   *
   *                            For fixedColumnsLeft: 1 the master overlay
   *                            do not render this first columns.
   *  Headers    -3   -2   -1    |
   *           +----+----+----║┄ ┄ +------+------+
   *           │    │    │    ║    │  B1  │  C1  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B2  │  C2  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B3  │  C3  │
   *           +----+----+----║┄ ┄ +------+------+
   *                               ╷             ╷
   *      -------------------------+-------------+---------------->
   *          TRUE             first    FALSE   last         FALSE
   *                           rendered         rendered
   *                           column           column
   *
   * @param {number} column The visual column index.
   * @memberof Table#
   * @function isColumnBeforeRenderedColumns
   * @returns {boolean}
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  isColumnBeforeRenderedColumns(column) {
    const first = this.getFirstRenderedColumn();

    // Check the headers only in case when the first rendered column is -1 or 0.
    // This is an indication that the overlay is placed on the most left position.
    if (column < 0 && first <= 0) {
      return !this.isColumnHeaderRendered(column);
    }

    return column < first;
  }

  /* eslint-disable jsdoc/require-description-complete-sentence */
  /**
   * Check if the given column index is greater than the index of the last column that
   * is currently rendered and return TRUE in that case, or FALSE otherwise.
   *
   * The negative column index is used to check the rows' headers. However,
   * keep in mind that for negative indexes, the method always returns FALSE as
   * it is not possible to render headers partially. The "after" index can not be
   * lower than -1.
   *
   *                            For fixedColumnsLeft: 1 the master overlay
   *                            do not render this first columns.
   *  Headers    -3   -2   -1    |
   *           +----+----+----║┄ ┄ +------+------+
   *           │    │    │    ║    │  B1  │  C1  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B2  │  C2  │
   *           +--------------║┄ ┄ --------------│
   *           │    │    │    ║    │  B3  │  C3  │
   *           +----+----+----║┄ ┄ +------+------+
   *                               ╷             ╷
   *      -------------------------+-------------+---------------->
   *          FALSE             first    FALSE   last         TRUE
   *                           rendered         rendered
   *                           column           column
   *
   * @param {number} column The visual column index.
   * @memberof Table#
   * @function isColumnAfterRenderedColumns
   * @returns {boolean}
   */
  /* eslint-enable jsdoc/require-description-complete-sentence */
  isColumnAfterRenderedColumns(column) {
    return this.columnFilter && (column > this.getLastRenderedColumn());
  }

  isColumnAfterViewport(column) {
    return this.columnFilter && (column > this.getLastVisibleColumn());
  }

  isRowAfterViewport(row) {
    return this.rowFilter && (row > this.getLastVisibleRow());
  }

  isColumnBeforeViewport(column) {
    return this.columnFilter && (this.columnFilter.sourceToRendered(column) < 0 && column >= 0);
  }

  isLastRowFullyVisible() {
    return this.getLastVisibleRow() === this.getLastRenderedRow();
  }

  isLastColumnFullyVisible() {
    return this.getLastVisibleColumn() === this.getLastRenderedColumn();
  }

  allRowsInViewport() {
    return this.wot.getSetting('totalRows') === this.getVisibleRowsCount();
  }

  allColumnsInViewport() {
    return this.wot.getSetting('totalColumns') === this.getVisibleColumnsCount();
  }

  /**
   * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height.
   *
   * @param {number} sourceRow The physical row index.
   * @returns {number}
   */
  getRowHeight(sourceRow) {
    return this.rowUtils.getHeight(sourceRow);
  }

  /**
   * @param {number} level The column level.
   * @returns {number}
   */
  getColumnHeaderHeight(level) {
    return this.columnUtils.getHeaderHeight(level);
  }

  /**
   * @param {number} sourceColumn The physical column index.
   * @returns {number}
   */
  getColumnWidth(sourceColumn) {
    return this.columnUtils.getWidth(sourceColumn);
  }

  /**
   * @param {number} sourceColumn The physical column index.
   * @returns {number}
   */
  getStretchedColumnWidth(sourceColumn) {
    return this.columnUtils.getStretchedColumnWidth(sourceColumn);
  }

  /**
   * Checks if the table has defined size. It returns `true` when the table has width and height
   * set bigger than `0px`.
   *
   * @returns {boolean}
   */
  hasDefinedSize() {
    return this.hasTableHeight && this.hasTableWidth;
  }

  /**
   * Checks if the table is visible. It returns `true` when the holder element (or its parents)
   * has CSS 'display' property different than 'none'.
   *
   * @returns {boolean}
   */
  isVisible() {
    return isVisible(this.TABLE);
  }

  /**
   * Modify row header widths provided by user in class contructor.
   *
   * @private
   * @param {Function} rowHeaderWidthFactory The function which can provide default width values for rows..
   * @returns {number}
   */
  _modifyRowHeaderWidth(rowHeaderWidthFactory) {
    let widths = isFunction(rowHeaderWidthFactory) ? rowHeaderWidthFactory() : null;

    if (Array.isArray(widths)) {
      widths = [...widths];
      widths[widths.length - 1] = this._correctRowHeaderWidth(widths[widths.length - 1]);
    } else {
      widths = this._correctRowHeaderWidth(widths);
    }

    return widths;
  }

  /**
   * Correct row header width if necessary.
   *
   * @private
   * @param {number} width The width to process.
   * @returns {number}
   */
  _correctRowHeaderWidth(width) {
    let rowHeaderWidth = width;

    if (typeof width !== 'number') {
      rowHeaderWidth = this.wot.getSetting('defaultColumnWidth');
    }
    if (this.correctHeaderWidth) {
      rowHeaderWidth += 1;
    }

    return rowHeaderWidth;
  }
}

export default Table;
