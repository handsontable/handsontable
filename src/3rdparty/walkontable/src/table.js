import {
  getStyle,
  getTrimmingContainer,
  hasClass,
  index,
  offset,
  removeClass,
  removeTextNodes,
  overlayContainsElement,
  closest
} from './../../../helpers/dom/element';
import { isFunction } from './../../../helpers/function';
import CellCoords from './cell/coords';
import ColumnFilter from './filter/column';
import RowFilter from './filter/row';
import TableRenderer from './tableRenderer';
import Overlay from './overlay/_base';

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

    removeTextNodes(this.TABLE);

    this.spreader = this.createSpreader(this.TABLE);
    this.hider = this.createHider(this.spreader);
    this.holder = this.createHolder(this.hider);

    this.wtRootElement = this.holder.parentNode;
    this.alignOverlaysWithTrimmingContainer();
    this.fixTableDomTree();

    this.colgroupChildrenLength = this.COLGROUP.childNodes.length;
    this.theadChildrenLength = this.THEAD.firstChild ? this.THEAD.firstChild.childNodes.length : 0;
    this.tbodyChildrenLength = this.TBODY.childNodes.length;

    this.rowFilter = null;
    this.columnFilter = null;
    this.correctHeaderWidth = false;

    const origRowHeaderWidth = this.wot.wtSettings.settings.rowHeaderWidth;

    // Fix for jumping row headers (https://github.com/handsontable/handsontable/issues/3850)
    this.wot.wtSettings.settings.rowHeaderWidth = () => this._modifyRowHeaderWidth(origRowHeaderWidth);
  }

  /**
   *
   */
  fixTableDomTree() {
    this.TBODY = this.TABLE.querySelector('tbody');

    if (!this.TBODY) {
      this.TBODY = document.createElement('tbody');
      this.TABLE.appendChild(this.TBODY);
    }
    this.THEAD = this.TABLE.querySelector('thead');

    if (!this.THEAD) {
      this.THEAD = document.createElement('thead');
      this.TABLE.insertBefore(this.THEAD, this.TBODY);
    }
    this.COLGROUP = this.TABLE.querySelector('colgroup');

    if (!this.COLGROUP) {
      this.COLGROUP = document.createElement('colgroup');
      this.TABLE.insertBefore(this.COLGROUP, this.THEAD);
    }

    if (this.wot.getSetting('columnHeaders').length && !this.THEAD.childNodes.length) {
      this.THEAD.appendChild(document.createElement('TR'));
    }
  }

  /**
   * @param table
   * @returns {HTMLElement}
   */
  createSpreader(table) {
    const parent = table.parentNode;
    let spreader;

    if (!parent || parent.nodeType !== 1 || !hasClass(parent, 'wtHolder')) {
      spreader = document.createElement('div');
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

    if (!parent || parent.nodeType !== 1 || !hasClass(parent, 'wtHolder')) {
      hider = document.createElement('div');
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

    if (!parent || parent.nodeType !== 1 || !hasClass(parent, 'wtHolder')) {
      holder = document.createElement('div');
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
    const trimmingElement = getTrimmingContainer(this.wtRootElement);

    if (!this.isWorkingOnClone()) {
      this.holder.parentNode.style.position = 'relative';

      if (trimmingElement === window) {
        const preventOverflow = this.wot.getSetting('preventOverflow');

        if (!preventOverflow) {
          this.holder.style.overflow = 'visible';
          this.wtRootElement.style.overflow = 'visible';
        }
      } else {
        this.holder.style.width = getStyle(trimmingElement, 'width');
        this.holder.style.height = getStyle(trimmingElement, 'height');
        this.holder.style.overflow = '';
      }
    }
  }

  isWorkingOnClone() {
    return !!this.wot.cloneSource;
  }

  /**
   * Redraws the table
   *
   * @param {Boolean} fastDraw If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
   * @returns {Table}
   */
  draw(fastDraw) {
    const { wtOverlays, wtViewport } = this.wot;
    const totalRows = this.instance.getSetting('totalRows');
    const rowHeaders = this.wot.getSetting('rowHeaders').length;
    const columnHeaders = this.wot.getSetting('columnHeaders').length;
    let syncScroll = false;
    let runFastDraw = fastDraw;

    if (!this.isWorkingOnClone()) {
      this.holderOffset = offset(this.holder);
      runFastDraw = wtViewport.createRenderCalculators(runFastDraw);

      if (rowHeaders && !this.wot.getSetting('fixedColumnsLeft')) {
        const leftScrollPos = wtOverlays.leftOverlay.getScrollPosition();
        const previousState = this.correctHeaderWidth;

        this.correctHeaderWidth = leftScrollPos > 0;

        if (previousState !== this.correctHeaderWidth) {
          runFastDraw = false;
        }
      }
    }

    if (!this.isWorkingOnClone()) {
      syncScroll = wtOverlays.prepareOverlays();
    }

    if (runFastDraw) {
      if (!this.isWorkingOnClone()) {
        // in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
        wtViewport.createVisibleCalculators();
      }
      if (wtOverlays) {
        wtOverlays.refresh(true);
      }
    } else {
      if (this.isWorkingOnClone()) {
        this.tableOffset = this.wot.cloneSource.wtTable.tableOffset;
      } else {
        this.tableOffset = offset(this.TABLE);
      }
      let startRow;

      if (Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_DEBUG) ||
          Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_TOP) ||
          Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_TOP_LEFT_CORNER)) {
        startRow = 0;
      } else if (Overlay.isOverlayTypeOf(this.instance.cloneOverlay, Overlay.CLONE_BOTTOM) ||
          Overlay.isOverlayTypeOf(this.instance.cloneOverlay, Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
        startRow = Math.max(totalRows - this.wot.getSetting('fixedRowsBottom'), 0);
      } else {
        startRow = wtViewport.rowsRenderCalculator.startRow;
      }
      let startColumn;

      if (Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_DEBUG) ||
          Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_LEFT) ||
          Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_TOP_LEFT_CORNER) ||
          Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
        startColumn = 0;
      } else {
        startColumn = wtViewport.columnsRenderCalculator.startColumn;
      }
      this.rowFilter = new RowFilter(startRow, totalRows, columnHeaders);
      this.columnFilter = new ColumnFilter(startColumn, this.wot.getSetting('totalColumns'), rowHeaders);

      this.alignOverlaysWithTrimmingContainer();
      this._doDraw(); // creates calculator after draw
    }
    this.refreshSelections(runFastDraw);

    if (!this.isWorkingOnClone()) {
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
    this.wot.drawn = true;

    return this;
  }

  _doDraw() {
    const wtRenderer = new TableRenderer(this);

    wtRenderer.render();
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
    if (!this.wot.selections) {
      return;
    }
    const highlights = Array.from(this.wot.selections);
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

      const additionalClassesToRemove = this.wot.getSetting('onBeforeRemoveCellClassNames');

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
      highlights[i].draw(this.wot, fastDraw);
    }
  }

  /**
   * Get cell element at coords.
   *
   * @param {CellCoords} coords
   * @returns {HTMLElement|Number} HTMLElement on success or Number one of the exit codes on error:
   *  -1 row before viewport
   *  -2 row after viewport
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

    if (overlayContainsElement(Overlay.CLONE_TOP_LEFT_CORNER, cellElement) || overlayContainsElement(Overlay.CLONE_TOP, cellElement)) {
      if (CONTAINER.nodeName === 'THEAD') {
        row -= CONTAINER.childNodes.length;
      }

    } else if (CONTAINER === this.THEAD) {
      row = this.rowFilter.visibleColHeadedRowToSourceRow(row);

    } else {
      row = this.rowFilter.renderedToSource(row);
    }

    if (overlayContainsElement(Overlay.CLONE_TOP_LEFT_CORNER, cellElement) || overlayContainsElement(Overlay.CLONE_LEFT, cellElement)) {
      col = this.columnFilter.offsettedTH(col);

    } else {
      col = this.columnFilter.visibleRowHeadedColumnToSourceColumn(col);
    }

    return new CellCoords(row, col);
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
   * @returns {Number} Returns -1 if no row is visible
   */
  getLastRenderedRow() {
    return this.wot.wtViewport.rowsRenderCalculator.endRow;
  }

  getLastVisibleRow() {
    return this.wot.wtViewport.rowsVisibleCalculator.endRow;
  }

  getLastRenderedColumn() {
    return this.wot.wtViewport.columnsRenderCalculator.endColumn;
  }

  /**
   * @returns {Number} Returns -1 if no column is visible
   */
  getLastVisibleColumn() {
    return this.wot.wtViewport.columnsVisibleCalculator.endColumn;
  }

  isRowBeforeRenderedRows(row) {
    return this.rowFilter && (this.rowFilter.sourceToRendered(row) < 0 && row >= 0);
  }

  isRowAfterViewport(row) {
    return this.rowFilter && (this.rowFilter.sourceToRendered(row) > this.getLastVisibleRow());
  }

  isRowAfterRenderedRows(row) {
    return this.rowFilter && (this.rowFilter.sourceToRendered(row) > this.getLastRenderedRow());
  }

  isColumnBeforeViewport(column) {
    return this.columnFilter && (this.columnFilter.sourceToRendered(column) < 0 && column >= 0);
  }

  isColumnAfterViewport(column) {
    return this.columnFilter && (this.columnFilter.sourceToRendered(column) > this.getLastVisibleColumn());
  }

  isLastRowFullyVisible() {
    return this.getLastVisibleRow() === this.getLastRenderedRow();
  }

  isLastColumnFullyVisible() {
    return this.getLastVisibleColumn() === this.getLastRenderedColumn();
  }

  getRenderedColumnsCount() {
    let columnsCount = this.wot.wtViewport.columnsRenderCalculator.count;
    const totalColumns = this.wot.getSetting('totalColumns');

    if (this.wot.isOverlayName(Overlay.CLONE_DEBUG)) {
      columnsCount = totalColumns;

    } else if (this.wot.isOverlayName(Overlay.CLONE_LEFT) ||
               this.wot.isOverlayName(Overlay.CLONE_TOP_LEFT_CORNER) ||
               this.wot.isOverlayName(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
      return Math.min(this.wot.getSetting('fixedColumnsLeft'), totalColumns);

    }

    return columnsCount;
  }

  getRenderedRowsCount() {
    let rowsCount = this.wot.wtViewport.rowsRenderCalculator.count;
    const totalRows = this.wot.getSetting('totalRows');

    if (this.wot.isOverlayName(Overlay.CLONE_DEBUG)) {
      rowsCount = totalRows;

    } else if (this.wot.isOverlayName(Overlay.CLONE_TOP) ||
               this.wot.isOverlayName(Overlay.CLONE_TOP_LEFT_CORNER)) {
      rowsCount = Math.min(this.wot.getSetting('fixedRowsTop'), totalRows);

    } else if (this.wot.isOverlayName(Overlay.CLONE_BOTTOM) ||
               this.wot.isOverlayName(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
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

  /**
   * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
   *
   * @param {Number} sourceRow
   * @returns {Number}
   */
  getRowHeight(sourceRow) {
    let height = this.wot.wtSettings.settings.rowHeight(sourceRow);
    const oversizedHeight = this.wot.wtViewport.oversizedRows[sourceRow];

    if (oversizedHeight !== void 0) {
      height = height === void 0 ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }

  getColumnHeaderHeight(level) {
    let height = this.wot.wtSettings.settings.defaultRowHeight;
    const oversizedHeight = this.wot.wtViewport.oversizedColumnHeaders[level];

    if (oversizedHeight !== void 0) {
      height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
    }

    return height;
  }

  getVisibleColumnsCount() {
    return this.wot.wtViewport.columnsVisibleCalculator.count;
  }

  allColumnsInViewport() {
    return this.wot.getSetting('totalColumns') === this.getVisibleColumnsCount();
  }

  getColumnWidth(sourceColumn) {
    let width = this.wot.wtSettings.settings.columnWidth;

    if (typeof width === 'function') {
      width = width(sourceColumn);

    } else if (typeof width === 'object') {
      width = width[sourceColumn];
    }

    return width || this.wot.wtSettings.settings.defaultColumnWidth;
  }

  getStretchedColumnWidth(sourceColumn) {
    const columnWidth = this.getColumnWidth(sourceColumn);
    let width = (columnWidth === null || columnWidth === void 0) ? this.instance.wtSettings.settings.defaultColumnWidth : columnWidth;
    const calculator = this.wot.wtViewport.columnsRenderCalculator;

    if (calculator) {
      const stretchedWidth = calculator.getStretchedColumnWidth(sourceColumn, width);

      if (stretchedWidth) {
        width = stretchedWidth;
      }
    }

    return width;
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
