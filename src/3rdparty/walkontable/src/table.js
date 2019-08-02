import {
  getStyle,
  getComputedStyle,
  getTrimmingContainer,
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
import Overlay from './overlay/_base';
import ColumnUtils from './utils/column';
import RowUtils from './utils/row';

/**
 *
 */
class Table {
  /**
   * @param {Walkontable} wotInstance
   * @param {HTMLTableElement} table
   */
  constructor(wotInstance, table) {
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
     * @type {Boolean}
     */
    this.hasTableHeight = true;
    /**
     * Indicates if the table has width bigger than 0px.
     *
     * @type {Boolean}
     */
    this.hasTableWidth = true;
    /**
     * Indicates if the table is visible. By visible, it means that the holder
     * element has CSS 'display' property different than 'none'.
     *
     * @type {Boolean}
     */
    this.isTableVisible = false;

    removeTextNodes(this.TABLE);

    this.spreader = this.createSpreader(this.TABLE);
    this.hider = this.createHider(this.spreader);
    this.holder = this.createHolder(this.hider);

    this.wtRootElement = this.holder.parentNode;
    this.alignOverlaysWithTrimmingContainer();
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
   * @param table
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
   * @param spreader
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
   * @param hider
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
      if (!this.isWorkingOnClone()) {
        holder.parentNode.className += 'ht_master handsontable';
      }
      holder.appendChild(hider);
    }

    return holder;
  }

  alignOverlaysWithTrimmingContainer() {
    if (this.isWorkingOnClone()) {
      return;
    }

    const trimmingElement = getTrimmingContainer(this.wtRootElement);
    const { rootWindow } = this.wot;

    if (trimmingElement === rootWindow) {
      const preventOverflow = this.wot.getSetting('preventOverflow');

      if (!preventOverflow) {
        this.holder.style.overflow = 'visible';
        this.wtRootElement.style.overflow = 'visible';
      }
    } else {
      const trimmingElementParent = trimmingElement.parentElement;
      const trimmingHeight = getStyle(trimmingElement, 'height', rootWindow);
      const trimmingOverflow = getStyle(trimmingElement, 'overflow', rootWindow);
      const holderStyle = this.holder.style;
      const { scrollWidth, scrollHeight } = trimmingElement;
      let { width, height } = trimmingElement.getBoundingClientRect();
      const overflow = ['auto', 'hidden', 'scroll'];

      if (trimmingElementParent && overflow.includes(trimmingOverflow)) {
        const cloneNode = trimmingElement.cloneNode(false);

        trimmingElementParent.insertBefore(cloneNode, trimmingElement);

        const cloneHeight = getComputedStyle(cloneNode, rootWindow).height;

        trimmingElementParent.removeChild(cloneNode);

        if (parseInt(cloneHeight, 10) === 0) {
          height = 0;
        }
      }

      height = Math.min(height, scrollHeight);
      holderStyle.height = trimmingHeight === 'auto' ? 'auto' : `${height}px`;

      width = Math.min(width, scrollWidth);
      holderStyle.width = `${width}px`;

      holderStyle.overflow = '';
      this.hasTableHeight = height > 0;
      this.hasTableWidth = width > 0;
    }

    this.isTableVisible = isVisible(this.TABLE);
  }

  isWorkingOnClone() {
    return !!this.wot.cloneSource;
  }

  /**
   * Redraws the table
   *
   * @param {Boolean} [fastDraw=false] If TRUE, will try to avoid full redraw and only update the border positions.
   *                                   If FALSE or UNDEFINED, will perform a full redraw.
   * @returns {Table}
   */
  draw(fastDraw = false) {
    const { wot } = this;
    const { wtOverlays, wtViewport } = wot;
    const isClone = this.isWorkingOnClone();
    const totalRows = this.instance.getSetting('totalRows');
    const totalColumns = this.instance.getSetting('totalColumns');
    const rowHeaders = wot.getSetting('rowHeaders');
    const rowHeadersCount = rowHeaders.length;
    const columnHeaders = wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;
    let syncScroll = false;
    let runFastDraw = fastDraw;

    if (!isClone) {
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

    if (!isClone) {
      syncScroll = wtOverlays.prepareOverlays();
    }

    if (runFastDraw) {
      if (!isClone) {
        // in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
        wtViewport.createVisibleCalculators();
      }
      if (wtOverlays) {
        wtOverlays.refresh(true);
      }
    } else {
      const { cloneOverlay } = wot;

      if (isClone) {
        this.tableOffset = this.wot.cloneSource.wtTable.tableOffset;
      } else {
        this.tableOffset = offset(this.TABLE);
      }
      let startRow;

      if (Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_TOP) ||
          Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_TOP_LEFT_CORNER)) {
        startRow = 0;
      } else if (Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_BOTTOM) ||
                 Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
        startRow = Math.max(totalRows - wot.getSetting('fixedRowsBottom'), 0);
      } else {
        startRow = wtViewport.rowsRenderCalculator.startRow;
      }
      let startColumn;

      if (Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_LEFT) ||
          Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_TOP_LEFT_CORNER) ||
          Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
        startColumn = 0;
      } else {
        startColumn = wtViewport.columnsRenderCalculator.startColumn;
      }
      this.rowFilter = new RowFilter(startRow, totalRows, columnHeadersCount);
      this.columnFilter = new ColumnFilter(startColumn, totalColumns, rowHeadersCount);

      this.alignOverlaysWithTrimmingContainer();

      let performRedraw = isClone;

      // Only master table rendering can be skipped
      if (!isClone) {
        const skipRender = {};

        this.wot.getSetting('beforeDraw', true, skipRender);

        performRedraw = skipRender.skipRender !== true;
      }

      if (performRedraw) {
        this.tableRenderer.setHeaderContentRenderers(rowHeaders, columnHeaders);

        if (Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_BOTTOM) ||
            Overlay.isOverlayTypeOf(cloneOverlay, Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
          // do NOT render headers on the bottom or bottom-left corner overlay
          this.tableRenderer.setHeaderContentRenderers(rowHeaders, []);
        }

        this.resetOversizedRows();

        this.tableRenderer
          .setViewportSize(this.getRenderedRowsCount(), this.getRenderedColumnsCount())
          .setFilters(this.rowFilter, this.columnFilter)
          .render();

        let workspaceWidth;

        if (!isClone) {
          workspaceWidth = this.wot.wtViewport.getWorkspaceWidth();
          this.wot.wtViewport.containerWidth = null;
        }

        this.markOversizedColumnHeaders();
        this.adjustColumnHeaderHeights();

        if (!isClone || this.wot.isOverlayName(Overlay.CLONE_BOTTOM)) {
          this.markOversizedRows();
        }

        if (!isClone) {
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

        } else if (this.wot.isOverlayName(Overlay.CLONE_BOTTOM)) {
          this.wot.cloneSource.wtOverlays.adjustElementsSize();
        }
      }
    }
    this.refreshSelections(runFastDraw);

    if (!isClone) {
      wtOverlays.topOverlay.resetFixedPosition();

      if (wtOverlays.bottomOverlay.clone) {
        wtOverlays.bottomOverlay.resetFixedPosition();
      }

      wtOverlays.leftOverlay.resetFixedPosition();

      if (wtOverlays.topLeftCornerOverlay) {
        wtOverlays.topLeftCornerOverlay.resetFixedPosition();
      }

      if (wtOverlays.bottomLeftCornerOverlay && wtOverlays.bottomLeftCornerOverlay.clone) {
        wtOverlays.bottomLeftCornerOverlay.resetFixedPosition();
      }
    }
    if (syncScroll) {
      wtOverlays.syncScrollWithMaster();
    }

    wot.drawn = true;

    return this;
  }

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

      if (!previousColHeaderHeight && defaultRowHeight < currentHeaderHeight || previousColHeaderHeight < currentHeaderHeight) {
        this.wot.wtViewport.oversizedColumnHeaders[level] = currentHeaderHeight;
      }

      if (Array.isArray(columnHeaderHeightSetting)) {
        if (columnHeaderHeightSetting[level] !== null && columnHeaderHeightSetting[level] !== void 0) {
          this.wot.wtViewport.oversizedColumnHeaders[level] = columnHeaderHeightSetting[level];
        }

      } else if (!isNaN(columnHeaderHeightSetting)) {
        this.wot.wtViewport.oversizedColumnHeaders[level] = columnHeaderHeightSetting;
      }

      if (this.wot.wtViewport.oversizedColumnHeaders[level] < (columnHeaderHeightSetting[level] || columnHeaderHeightSetting)) {
        this.wot.wtViewport.oversizedColumnHeaders[level] = (columnHeaderHeightSetting[level] || columnHeaderHeightSetting);
      }
    }
  }

  markOversizedColumnHeaders() {
    const { wot } = this;
    const isClone = this.isWorkingOnClone();
    const overlayName = wot.getOverlayName();
    const columnHeaders = wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    if (columnHeadersCount && !wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName] && !isClone) {
      const rowHeaders = wot.getSetting('rowHeaders');
      const rowHeaderCount = rowHeaders.length;
      const columnCount = this.getRenderedColumnsCount();

      for (let i = 0; i < columnHeadersCount; i++) {
        for (let renderedColumnIndex = (-1) * rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
          this.markIfOversizedColumnHeader(renderedColumnIndex);
        }
      }
      wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName] = true;
    }
  }

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

    if (!wot.getSetting('externalRowCalculator') && (!this.isWorkingOnClone() || wot.isOverlayName(Overlay.CLONE_BOTTOM))) {
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

  removeClassFromCells(className) {
    const nodes = this.TABLE.querySelectorAll(`.${className}`);

    for (let i = 0, len = nodes.length; i < len; i++) {
      removeClass(nodes[i], className);
    }
  }

  /**
   * Refresh the table selection by re-rendering Selection instances connected with that instance.
   *
   * @param {Boolean} fastDraw If fast drawing is enabled than additionally className clearing is applied.
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
   *
   * @param {CellCoords} coords
   * @returns {HTMLElement|Number} HTMLElement on success or Number one of the exit codes on error:
   *  -1 row before viewport
   *  -2 row after viewport
   *  -3 column before viewport
   *  -4 column after viewport
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

    const TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

    if (TR) {
      return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(column)];
    }
  }

  /**
   * getColumnHeader
   *
   * @param {Number} col Column index
   * @param {Number} [level=0] Header level (0 = most distant to the table)
   * @returns {Object} HTMLElement on success or undefined on error
   */
  getColumnHeader(col, level = 0) {
    const TR = this.THEAD.childNodes[level];

    if (TR) {
      return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
    }
  }

  /**
   * getRowHeader
   *
   * @param {Number} row Row index
   * @returns {HTMLElement} HTMLElement on success or Number one of the exit codes on error: `null table doesn't have row headers`
   */
  getRowHeader(row) {
    if (this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) === 0) {
      return null;
    }
    const TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

    if (TR) {
      return TR.childNodes[0];
    }
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

    if (overlayContainsElement(Overlay.CLONE_TOP_LEFT_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(Overlay.CLONE_TOP, cellElement, this.wtRootElement)) {
      if (CONTAINER.nodeName === 'THEAD') {
        row -= CONTAINER.childNodes.length;
      }

    } else if (overlayContainsElement(Overlay.CLONE_BOTTOM_LEFT_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(Overlay.CLONE_BOTTOM, cellElement, this.wtRootElement)) {
      const totalRows = this.wot.getSetting('totalRows');

      row = totalRows - CONTAINER.childNodes.length + row;

    } else if (CONTAINER === this.THEAD) {
      row = this.rowFilter.visibleColHeadedRowToSourceRow(row);

    } else {
      row = this.rowFilter.renderedToSource(row);
    }

    if (overlayContainsElement(Overlay.CLONE_TOP_LEFT_CORNER, cellElement, this.wtRootElement)
      || overlayContainsElement(Overlay.CLONE_LEFT, cellElement, this.wtRootElement)
      || overlayContainsElement(Overlay.CLONE_BOTTOM_LEFT_CORNER, cellElement, this.wtRootElement)) {
      col = this.columnFilter.offsettedTH(col);

    } else {
      col = this.columnFilter.visibleRowHeadedColumnToSourceColumn(col);
    }

    return new CellCoords(row, col);
  }

  /**
   * Check if any of the rendered rows is higher than expected, and if so, cache them
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

  getTrForRow(row) {
    return this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
  }

  getFirstRenderedRow() {
    return this.wot.wtViewport.rowsRenderCalculator.startRow;
  }

  getFirstVisibleRow() {
    return this.wot.wtViewport.rowsVisibleCalculator.startRow;
  }

  getFirstRenderedColumn() {
    return this.wot.wtViewport.columnsRenderCalculator.startColumn;
  }

  /**
   * @returns {Number} Returns -1 if no row is visible
   */
  getFirstVisibleColumn() {
    return this.wot.wtViewport.columnsVisibleCalculator.startColumn;
  }

  /**
   * @returns {Number} Returns -1 if no row is visible, otherwise source index of the last rendered row
   */
  getLastRenderedRow() {
    return this.wot.wtViewport.rowsRenderCalculator.endRow;
  }

  /**
   * @returns {Number} Returns source index of last visible row
   */
  getLastVisibleRow() {
    return this.wot.wtViewport.rowsVisibleCalculator.endRow;
  }

  /**
   * @returns {Number} Returns source index of last rendered column
   */
  getLastRenderedColumn() {
    return this.wot.wtViewport.columnsRenderCalculator.endColumn;
  }

  /**
   * @returns {Number} Returns -1 if no column is visible, otherwise source index of the last visible column
   */
  getLastVisibleColumn() {
    return this.wot.wtViewport.columnsVisibleCalculator.endColumn;
  }

  isRowBeforeRenderedRows(row) {
    return this.rowFilter && (this.rowFilter.sourceToRendered(row) < 0 && row >= 0);
  }

  isRowAfterViewport(row) {
    return this.rowFilter && (row > this.getLastVisibleRow());
  }

  isRowAfterRenderedRows(row) {
    if (Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_BOTTOM)
      || Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      return false;
    }

    return this.rowFilter && (row > this.getLastRenderedRow());
  }

  isColumnBeforeViewport(column) {
    return this.columnFilter && (this.columnFilter.sourceToRendered(column) < 0 && column >= 0);
  }

  isColumnBeforeRenderedColumns(column) {
    return this.columnFilter && (this.columnFilter.sourceColumnToVisibleRowHeadedColumn(column) < 0 && column >= 0);
  }

  isColumnAfterViewport(column) {
    return this.columnFilter && (column > this.getLastVisibleColumn());
  }

  isColumnAfterRenderedColumns(column) {
    return this.columnFilter && (column > this.getLastRenderedColumn());
  }

  isLastRowFullyVisible() {
    return this.getLastVisibleRow() === this.getLastRenderedRow();
  }

  isLastColumnFullyVisible() {
    return this.getLastVisibleColumn() === this.getLastRenderedColumn();
  }

  getRenderedColumnsCount() {
    const columnsCount = this.wot.wtViewport.columnsRenderCalculator.count;

    if (this.wot.isOverlayName(Overlay.CLONE_LEFT) ||
        this.wot.isOverlayName(Overlay.CLONE_TOP_LEFT_CORNER) ||
        this.wot.isOverlayName(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      const totalColumns = this.wot.getSetting('totalColumns');

      return Math.min(this.wot.getSetting('fixedColumnsLeft'), totalColumns);
    }

    return columnsCount;
  }

  getRenderedRowsCount() {
    let rowsCount = this.wot.wtViewport.rowsRenderCalculator.count;

    if (this.wot.isOverlayName(Overlay.CLONE_TOP) ||
        this.wot.isOverlayName(Overlay.CLONE_TOP_LEFT_CORNER)) {
      const totalRows = this.wot.getSetting('totalRows');

      rowsCount = Math.min(this.wot.getSetting('fixedRowsTop'), totalRows);

    } else if (this.wot.isOverlayName(Overlay.CLONE_BOTTOM) ||
               this.wot.isOverlayName(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      const totalRows = this.wot.getSetting('totalRows');

      rowsCount = Math.min(this.wot.getSetting('fixedRowsBottom'), totalRows);
    }

    return rowsCount;
  }

  getVisibleRowsCount() {
    return this.wot.wtViewport.rowsVisibleCalculator.count;
  }

  allRowsInViewport() {
    return this.wot.getSetting('totalRows') === this.getVisibleRowsCount();
  }

  getVisibleColumnsCount() {
    return this.wot.wtViewport.columnsVisibleCalculator.count;
  }

  allColumnsInViewport() {
    return this.wot.getSetting('totalColumns') === this.getVisibleColumnsCount();
  }

  /**
   * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
   *
   * @param {Number} sourceRow
   * @returns {Number}
   */
  getRowHeight(sourceRow) {
    return this.rowUtils.getHeight(sourceRow);
  }

  getColumnHeaderHeight(level) {
    return this.columnUtils.getHeaderHeight(level);
  }

  getColumnWidth(sourceColumn) {
    return this.columnUtils.getWidth(sourceColumn);
  }

  getStretchedColumnWidth(sourceColumn) {
    return this.columnUtils.getStretchedColumnWidth(sourceColumn);
  }

  /**
   * Checks if the table has defined size. It returns `true` when the table has width and height
   * set bigger than `0px`.
   *
   * @returns {Boolean}
   */
  hasDefinedSize() {
    return this.hasTableHeight && this.hasTableWidth;
  }

  /**
   * Checks if the table is visible. It returns `true` when the holder element (or its parents)
   * has CSS 'display' property different than 'none'.
   *
   * @returns {Boolean}
   */
  isVisible() {
    return isVisible(this.TABLE);
  }

  /**
   * Modify row header widths provided by user in class contructor.
   *
   * @private
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
