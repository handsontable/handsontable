import {
  hasClass,
  index,
  removeClass,
  removeTextNodes,
  overlayContainsElement,
  closest,
  innerHeight,
  isVisible,
} from './../../../helpers/dom/element';
import CellCoords from './cell/coords';
import ColumnFilter from './filter/column';
import RowFilter from './filter/row';
import { Renderer } from './renderer';
import Overlay from './overlay/_base';
import { BorderRenderer } from './borderRenderer';
import Master from './core/master';

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
    this.isMaster = wotInstance instanceof Master;
    this.wot = wotInstance;

    this.TABLE = table;
    this.TBODY = null;
    this.THEAD = null;
    this.COLGROUP = null;
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

    removeTextNodes(this.TABLE);

    this.spreader = this.createSpreader(this.TABLE);
    this.hider = this.createHider(this.spreader);
    this.holder = this.createHolder(this.hider);

    this.wtRootElement = this.holder.parentNode;

    this.fixTableDomTree();

    this.rowFilter = null;
    this.columnFilter = null;
    this.correctHeaderWidth = false;

    this.tableRenderer = new Renderer({
      TABLE: this.TABLE,
      THEAD: this.THEAD,
      COLGROUP: this.COLGROUP,
      TBODY: this.TBODY,
      rowUtils: this.isMaster ? this.wot.rowUtils : this.wot.overlay.master.rowUtils,
      columnUtils: this.isMaster ? this.wot.columnUtils : this.wot.overlay.master.columnUtils,
      cellRenderer: this.wot.wtSettings.settings.cellRenderer,
    });

    this.borderRenderer = new BorderRenderer(
      this.spreader,
      this.isMaster ? 'master' : this.wot.getOverlayName(),
      this.getCell.bind(this),
    );
  }

  /**
   * Returns a boolean that is true if this intance of Table represents a specific overlay, identified by the overlay name.
   * For MasterTable, it returns false.
   *
   * @param {string} overlayTypeName The overlay type.
   * @returns {boolean}
   */
  is(overlayTypeName) {
    return !this.isMaster && this.wot.getOverlayName() === overlayTypeName;
  }

  /**
   * Creates the border padding object as defined in BorderRenderer.padding.
   *
   * @type {object} Object with properties top, left, bottom, right
   */
  createBorderPaddingObject() {
    let top = 0;
    let left = 0;
    let bottom = 0;
    let right = 0;
    const frozenLineWidth = 1;

    if (this.is(Overlay.CLONE_LEFT) || this.is(Overlay.CLONE_TOP_LEFT_CORNER) || this.is(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      right = frozenLineWidth;

      if (this.wot.getSetting('rowHeaders').length > 0) {
        left = frozenLineWidth;
      }
    }
    if (this.is(Overlay.CLONE_TOP) || this.is(Overlay.CLONE_TOP_LEFT_CORNER)) {
      bottom = frozenLineWidth;

      if (this.wot.getSetting('columnHeaders').length > 0) {
        top = frozenLineWidth;
      }
    }
    if (this.is(Overlay.CLONE_BOTTOM) || this.is(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      top = frozenLineWidth;
    }

    return { top, left, bottom, right };
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
      holder.appendChild(hider);
    }

    return holder;
  }

  /**
   * Redraws the table. Warning, this method is only used by the overlay tables.
   * The master table (table/master.js) uses an override of this function.
   *
   * @param {boolean} [fastDraw=false] If TRUE, will try to avoid full redraw and only update the border positions.
   *                                   If FALSE or UNDEFINED, will perform a full redraw.
   */
  draw(fastDraw = false) {
    const { wot } = this;
    const totalRows = wot.getSetting('totalRows');
    const totalColumns = wot.getSetting('totalColumns');
    const rowHeaders = wot.getSetting('rowHeaders');
    const rowHeadersCount = rowHeaders.length;
    const columnHeaders = wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    if (!fastDraw) {
      const startRow = totalRows > 0 ? this.getFirstRenderedRow() : 0;
      const startColumn = totalColumns > 0 ? this.getFirstRenderedColumn() : 0;

      this.rowFilter = new RowFilter(startRow, totalRows, columnHeadersCount);
      this.columnFilter = new ColumnFilter(startColumn, totalColumns, rowHeadersCount);

      if (this.is(Overlay.CLONE_BOTTOM) ||
        this.is(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
        // do NOT render headers on the bottom or bottom-left corner overlay
        this.tableRenderer.setHeaderContentRenderers(rowHeaders, []);
      } else {
        this.tableRenderer.setHeaderContentRenderers(rowHeaders, columnHeaders);
      }

      if (this.is(Overlay.CLONE_BOTTOM)) {
        this.resetOversizedRows();
      }

      this.tableRenderer
        .setViewportSize(this.getRenderedRowsCount(), this.getRenderedColumnsCount())
        .setFilters(this.rowFilter, this.columnFilter)
        .render();

      this.adjustColumnHeaderHeights();

      if (this.is(Overlay.CLONE_BOTTOM)) {
        this.markOversizedRows();
      }
    }

    this.refreshSelections(fastDraw);
  }

  /**
   * @param {number} col The visual column index.
   */
  markIfOversizedColumnHeader(col) {
    const sourceColIndex = this.columnFilter.renderedToSource(col);
    let level = this.wot.getSetting('columnHeaders').length;
    const defaultRowHeight = this.wot.wtSettings.settings.defaultRowHeight;
    let previousColHeaderHeight;
    let currentHeader;
    let currentHeaderHeight;
    const columnHeaderHeightSetting = this.wot.getSetting('columnHeaderHeight') || [];

    while (level) {
      level -= 1;

      previousColHeaderHeight = this.wot.columnUtils.getHeaderHeight(level);
      currentHeader = this.getColumnHeader(sourceColIndex, level);

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

  /**
   *
   */
  adjustColumnHeaderHeights() {
    const { wot } = this;
    const children = this.THEAD.childNodes;
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

    const selections = Array.isArray(wot.selections) ? wot.selections : wot.selections.getAll(); // .selections is an array in simple Walkontable tests
    const len = selections.length;

    if (fastDraw) {
      const classesToRemove = new Set();
      const additionalClassesToRemove = wot.getSetting('onBeforeRemoveCellClassNames');

      for (let i = 0; i < len; i++) {
        const {
          highlightHeaderClassName,
          highlightRowClassName,
          highlightColumnClassName,
        } = selections[i].settings;

        selections[i].classNames.forEach(classesToRemove.add, classesToRemove);

        if (highlightHeaderClassName) {
          classesToRemove.add(highlightHeaderClassName);
        }
        if (highlightRowClassName) {
          classesToRemove.add(highlightRowClassName);
        }
        if (highlightColumnClassName) {
          classesToRemove.add(highlightColumnClassName);
        }
      }

      if (Array.isArray(additionalClassesToRemove)) {
        additionalClassesToRemove.forEach(classesToRemove.add, classesToRemove);
      }

      classesToRemove.forEach(this.removeClassFromCells, this);
    }

    const tableRowsCount = this.getRenderedRowsCount();
    const tableColumnsCount = this.getRenderedColumnsCount();
    let tableStartRow = this.getFirstRenderedRow();
    const tableStartColumn = this.getFirstRenderedColumn();
    let tableEndRow = this.getLastRenderedRow();
    let tableEndColumn = this.getLastRenderedColumn();
    const borderEdgesDescriptors = [];

    /*
    On the edge of overlays, render borders from the outside of the overlay so that they do not become obscured
    by the overlay's gridline.
    The below adjustments are used to render side effects of borders from other overlays,
    e.g. when fixedRowsTop === 1, this method will render the top border of the cell A2 (from the master table)
    as the bottom border of the cell A1 (on the top overlay table).
    */
    if (this.is(Overlay.CLONE_LEFT) || this.is(Overlay.CLONE_TOP_LEFT_CORNER) || this.is(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      tableEndColumn += 1;
    }
    if (this.is(Overlay.CLONE_TOP) || this.is(Overlay.CLONE_TOP_LEFT_CORNER)) {
      tableEndRow += 1;
    }
    if (this.is(Overlay.CLONE_BOTTOM) || this.is(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      tableStartRow -= 1;
    }

    for (let i = 0; i < len; i++) {
      const borderEdgesDescriptor = selections[i].draw(wot,
        tableRowsCount, tableColumnsCount,
        tableStartRow, tableStartColumn, tableEndRow, tableEndColumn);

      if (borderEdgesDescriptor) {
        borderEdgesDescriptors.push(borderEdgesDescriptor);
      }
    }

    this.wot.getSetting('columnHeaders'); // TODO If this line is removed, an e2e test fails: NestedHeaders > Selection > should highlight only last line of headers on cell selection

    this.borderRenderer.render(this.TABLE, this.createBorderPaddingObject(), borderEdgesDescriptors);
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

    if (TR) {
      return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(col)];
    }
  }

  /**
   * GetRowHeader.
   *
   * @param {number} row Row index.
   * @returns {HTMLElement} HTMLElement on success or Number one of the exit codes on error: `null table doesn't have row headers`.
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
   * Check if any of the rendered rows is higher than expected, and if so, cache them.
   */
  markOversizedRows() {
    if (this.wot.getSetting('externalRowCalculator')) {
      return;
    }

    let rowCount = this.TBODY.childNodes.length;
    const expectedTableHeight = rowCount * this.wot.wtSettings.settings.defaultRowHeight;
    const actualTableHeight = innerHeight(this.TBODY) - 1;
    const rowUtils = this.isMaster ? this.wot.rowUtils : this.wot.overlay.master.rowUtils; // TODO this is not needed if we don't call markOversizedRows in the bottom overlay
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
      previousRowHeight = rowUtils.getHeight(sourceRowIndex);
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
   * 0-based index of column header.
   *
   * @param {number} level The header level to check.
   * @returns {boolean}
   */
  isColumnHeaderLevelRendered(level) {
    const columnHeaders = this.wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    return level > (columnHeadersCount - 1);
  }

  /**
   * 0-based index of row header.
   *
   * @param {number} level The header level to check.
   * @returns {boolean}
   */
  isRowHeaderLevelRendered(level) {
    const columnHeaders = this.wot.getSetting('rowHeaders');
    const columnHeadersCount = columnHeaders.length;

    return level > (columnHeadersCount - 1);
  }

  /**
   * Check if the given row index is smaller than the index of the first row that is currently redered
   * and return TRUE in that case, or FALSE otherwise.
   *
   * Negative row index is used to check the header cells. As a simplification, it checks negative row index
   * the same way as a regular row 0. You can interpret this as follows: If the row 0 is rendered, all header
   * cells are also rendered.
   *
   * @param {number} row The visual row index.
   * @returns {boolean}
   */
  isRowBeforeRenderedRows(row) {
    const first = this.getFirstRenderedRow();

    if (row < 0) {
      row = 0;
    }

    if (first === -1) {
      return true;
    }

    return row < first;
  }

  isRowAfterViewport(row) {
    return this.rowFilter && (row > this.getLastVisibleRow());
  }

  /**
   * Check if the given column index is larger than the index of the last column that is currently redered
   * and return TRUE in that case, or FALSE otherwise.
   *
   * Negative column index is used to check the header cells.
   *
   * @param {nunber} row The visual row index.
   * @returns {boolean}
   */
  isRowAfterRenderedRows(row) {
    if (row < 0) {
      const columnHeaders = this.wot.getSetting('columnHeaders');
      const columnHeadersCount = columnHeaders.length;
      const zeroBasedHeaderLevel = columnHeadersCount + row;

      return this.isColumnHeaderLevelRendered(zeroBasedHeaderLevel);
    }

    return row > this.getLastRenderedRow();
  }

  isColumnBeforeViewport(column) {
    return this.columnFilter && (this.columnFilter.sourceToRendered(column) < 0 && column >= 0);
  }

  /**
   * Check if the given column index is smaller than the index of the first column that is currently redered
   * and return TRUE in that case, or FALSE otherwise.
   *
   * Negative column index is used to check the header cells. As a simplification, it checks negative column index
   * the same way as a regular column 0. You can interpret this as follows: If the column 0 is rendered, all header
   * cells are also rendered.
   *
   * @param {number} column The visual column index.
   * @returns {boolean}
   */
  isColumnBeforeRenderedColumns(column) {
    const first = this.getFirstRenderedColumn();

    if (column < 0) {
      column = 0;
    }

    if (first === -1) {
      return true;
    }

    return column < first;
  }

  isColumnAfterViewport(column) {
    return this.columnFilter && (column > this.getLastVisibleColumn());
  }

  /**
   * Check if the given column index is larger than the index of the last column that is currently redered
   * and return TRUE in that case, or FALSE otherwise.
   *
   * Negative column index is used to check the header cells.
   *
   * @param {number} column The visual column index.
   * @returns {boolean}
   */
  isColumnAfterRenderedColumns(column) {
    if (column < 0) {
      const rowHeaders = this.wot.getSetting('rowHeaders');
      const rowHeadersCount = rowHeaders.length;
      const zeroBasedHeaderLevel = rowHeadersCount + column;

      return this.isRowHeaderLevelRendered(zeroBasedHeaderLevel);
    }

    return this.columnFilter && (column > this.getLastRenderedColumn());
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
   * Checks if the table has defined size. It returns `true` when the table has width and height.
   * Set bigger than `0px`.
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
}

export default Table;
