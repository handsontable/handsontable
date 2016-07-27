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
import {WalkontableCellCoords} from './cell/coords';
import {WalkontableCellRange} from './cell/range';
import {WalkontableColumnFilter} from './filter/column';
import {WalkontableRowFilter} from './filter/row';
import {WalkontableTableRenderer} from './tableRenderer';

/**
 *
 */
class WalkontableTable {
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
        let preventOverflow = this.wot.getSetting('preventOverflow');

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
   * @param fastDraw {Boolean} If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
   * @returns {WalkontableTable}
   */
  draw(fastDraw) {
    let totalRows = this.instance.getSetting('totalRows');

    if (!this.isWorkingOnClone()) {
      this.holderOffset = offset(this.holder);
      fastDraw = this.wot.wtViewport.createRenderCalculators(fastDraw);
    }

    if (fastDraw) {
      if (!this.isWorkingOnClone()) {
        // in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
        this.wot.wtViewport.createVisibleCalculators();
      }
      if (this.wot.wtOverlays) {
        this.wot.wtOverlays.refresh(true);
      }
    } else {
      if (this.isWorkingOnClone()) {
        this.tableOffset = this.wot.cloneSource.wtTable.tableOffset;
      } else {
        this.tableOffset = offset(this.TABLE);
      }
      let startRow;

      if (WalkontableOverlay.isOverlayTypeOf(this.wot.cloneOverlay, WalkontableOverlay.CLONE_DEBUG) ||
          WalkontableOverlay.isOverlayTypeOf(this.wot.cloneOverlay, WalkontableOverlay.CLONE_TOP) ||
          WalkontableOverlay.isOverlayTypeOf(this.wot.cloneOverlay, WalkontableOverlay.CLONE_TOP_LEFT_CORNER)) {
        startRow = 0;
      } else if (WalkontableOverlay.isOverlayTypeOf(this.instance.cloneOverlay, WalkontableOverlay.CLONE_BOTTOM) ||
          WalkontableOverlay.isOverlayTypeOf(this.instance.cloneOverlay, WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER)) {
        startRow = Math.max(totalRows - this.wot.getSetting('fixedRowsBottom'), 0);
      } else {
        startRow = this.wot.wtViewport.rowsRenderCalculator.startRow;
      }
      let startColumn;

      if (WalkontableOverlay.isOverlayTypeOf(this.wot.cloneOverlay, WalkontableOverlay.CLONE_DEBUG) ||
          WalkontableOverlay.isOverlayTypeOf(this.wot.cloneOverlay, WalkontableOverlay.CLONE_LEFT) ||
          WalkontableOverlay.isOverlayTypeOf(this.wot.cloneOverlay, WalkontableOverlay.CLONE_TOP_LEFT_CORNER) ||
          WalkontableOverlay.isOverlayTypeOf(this.wot.cloneOverlay, WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER)) {
        startColumn = 0;
      } else {
        startColumn = this.wot.wtViewport.columnsRenderCalculator.startColumn;
      }
      this.rowFilter = new WalkontableRowFilter(startRow, totalRows, this.wot.getSetting('columnHeaders').length);
      this.columnFilter = new WalkontableColumnFilter(startColumn, this.wot.getSetting('totalColumns'), this.wot.getSetting('rowHeaders').length);

      this.alignOverlaysWithTrimmingContainer();
      this._doDraw(); //creates calculator after draw
    }
    this.refreshSelections(fastDraw);

    if (!this.isWorkingOnClone()) {
      this.wot.wtOverlays.topOverlay.resetFixedPosition();

      if (this.wot.wtOverlays.bottomOverlay.clone) {
        this.wot.wtOverlays.bottomOverlay.resetFixedPosition();
      }

      this.wot.wtOverlays.leftOverlay.resetFixedPosition();

      if (this.wot.wtOverlays.topLeftCornerOverlay) {
        this.wot.wtOverlays.topLeftCornerOverlay.resetFixedPosition();
      }

      if (this.instance.wtOverlays.bottomLeftCornerOverlay && this.instance.wtOverlays.bottomLeftCornerOverlay.clone) {
        this.wot.wtOverlays.bottomLeftCornerOverlay.resetFixedPosition();
      }
    }
    this.wot.drawn = true;

    return this;
  }

  _doDraw() {
    const wtRenderer = new WalkontableTableRenderer(this);

    wtRenderer.render();
  }

  removeClassFromCells(className) {
    const nodes = this.TABLE.querySelectorAll('.' + className);

    for (let i = 0, len = nodes.length; i < len; i++) {
      removeClass(nodes[i], className);
    }
  }

  refreshSelections(fastDraw) {
    if (!this.wot.selections) {
      return;
    }
    let len = this.wot.selections.length;

    if (fastDraw) {
      for (let i = 0; i < len; i++) {
        // there was no rerender, so we need to remove classNames by ourselves
        if (this.wot.selections[i].settings.className) {
          this.removeClassFromCells(this.wot.selections[i].settings.className);
        }
        if (this.wot.selections[i].settings.highlightRowClassName) {
          this.removeClassFromCells(this.wot.selections[i].settings.highlightRowClassName);
        }
        if (this.wot.selections[i].settings.highlightColumnClassName) {
          this.removeClassFromCells(this.wot.selections[i].settings.highlightColumnClassName);
        }
      }
    }
    for (let i = 0; i < len; i++) {
      this.wot.selections[i].draw(this.wot, fastDraw);
    }
  }

  /**
   * Get cell element at coords.
   *
   * @param {WalkontableCellCoords} coords
   * @returns {HTMLElement|Number} HTMLElement on success or Number one of the exit codes on error:
   *  -1 row before viewport
   *  -2 row after viewport
   */
  getCell(coords) {
    if (this.isRowBeforeRenderedRows(coords.row)) {
      // row before rendered rows
      return -1;

    } else if (this.isRowAfterRenderedRows(coords.row)) {
      // row after rendered rows
      return -2;
    }
    const TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(coords.row)];

    if (TR) {
      return TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(coords.col)];
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
   * Returns cell coords object for a given TD
   *
   * @param {HTMLTableCellElement} TD
   * @returns {WalkontableCellCoords}
   */
  getCoords(TD) {
    if (TD.nodeName !== 'TD' && TD.nodeName !== 'TH') {
      TD = closest(TD, ['TD', 'TH']);
    }

    const TR = TD.parentNode;
    const CONTAINER = TR.parentNode;
    let row = index(TR);
    let col = TD.cellIndex;

    if (overlayContainsElement(WalkontableOverlay.CLONE_TOP_LEFT_CORNER, TD) || overlayContainsElement(WalkontableOverlay.CLONE_TOP, TD)) {
      if (CONTAINER.nodeName === 'THEAD') {
        row -= CONTAINER.childNodes.length;
      }

    } else {
      if (CONTAINER === this.THEAD) {
        row = this.rowFilter.visibleColHeadedRowToSourceRow(row);
      } else {
        row = this.rowFilter.renderedToSource(row);
      }
    }

    if (overlayContainsElement(WalkontableOverlay.CLONE_TOP_LEFT_CORNER, TD) || overlayContainsElement(WalkontableOverlay.CLONE_LEFT, TD)) {
      col = this.columnFilter.offsettedTH(col);

    } else {
      col = this.columnFilter.visibleRowHeadedColumnToSourceColumn(col);
    }

    return new WalkontableCellCoords(row, col);
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
    return (this.rowFilter.sourceToRendered(row) < 0 && row >= 0);
  }

  isRowAfterViewport(row) {
    return (this.rowFilter.sourceToRendered(row) > this.getLastVisibleRow());
  }

  isRowAfterRenderedRows(row) {
    return (this.rowFilter.sourceToRendered(row) > this.getLastRenderedRow());
  }

  isColumnBeforeViewport(column) {
    return this.columnFilter.sourceToRendered(column) < 0 && column >= 0;
  }

  isColumnAfterViewport(column) {
    return (this.columnFilter.sourceToRendered(column) > this.getLastVisibleColumn());
  }

  isLastRowFullyVisible() {
    return this.getLastVisibleRow() === this.getLastRenderedRow();
  }

  isLastColumnFullyVisible() {
    return this.getLastVisibleColumn() === this.getLastRenderedColumn();
  }

  getRenderedColumnsCount() {
    let columnsCount = this.wot.wtViewport.columnsRenderCalculator.count;
    let totalColumns = this.wot.getSetting('totalColumns');

    if (this.wot.isOverlayName(WalkontableOverlay.CLONE_DEBUG)) {
      columnsCount = totalColumns;

    } else if (this.wot.isOverlayName(WalkontableOverlay.CLONE_LEFT) ||
               this.wot.isOverlayName(WalkontableOverlay.CLONE_TOP_LEFT_CORNER) ||
               this.wot.isOverlayName(WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER)) {
      return Math.min(this.wot.getSetting('fixedColumnsLeft'), totalColumns);

    }

    return columnsCount;
  }

  getRenderedRowsCount() {
    let rowsCount = this.wot.wtViewport.rowsRenderCalculator.count;
    let totalRows = this.wot.getSetting('totalRows');

    if (this.wot.isOverlayName(WalkontableOverlay.CLONE_DEBUG)) {
      rowsCount = totalRows;

    } else if (this.wot.isOverlayName(WalkontableOverlay.CLONE_TOP) ||
               this.wot.isOverlayName(WalkontableOverlay.CLONE_TOP_LEFT_CORNER)) {
      rowsCount = Math.min(this.wot.getSetting('fixedRowsTop'), totalRows);

    } else if (this.wot.isOverlayName(WalkontableOverlay.CLONE_BOTTOM) ||
               this.wot.isOverlayName(WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER)) {
      rowsCount = Math.min(this.wot.getSetting('fixedRowsBottom'), totalRows);
    }

    return rowsCount;
  }

  getVisibleRowsCount() {
    return this.wot.wtViewport.rowsVisibleCalculator.count;
  }

  allRowsInViewport() {
    return this.wot.getSetting('totalRows') == this.getVisibleRowsCount();
  }

  /**
   * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
   *
   * @param {Number} sourceRow
   * @returns {Number}
   */
  getRowHeight(sourceRow) {
    let height = this.wot.wtSettings.settings.rowHeight(sourceRow);
    let oversizedHeight = this.wot.wtViewport.oversizedRows[sourceRow];

    if (oversizedHeight !== void 0) {
      height = height === void 0 ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }

  getColumnHeaderHeight(level) {
    let height = this.wot.wtSettings.settings.defaultRowHeight;
    let oversizedHeight = this.wot.wtViewport.oversizedColumnHeaders[level];

    if (oversizedHeight !== void 0) {
      height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
    }

    return height;
  }

  getVisibleColumnsCount() {
    return this.wot.wtViewport.columnsVisibleCalculator.count;
  }

  allColumnsInViewport() {
    return this.wot.getSetting('totalColumns') == this.getVisibleColumnsCount();
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
    let columnWidth = this.getColumnWidth(sourceColumn);
    let width = columnWidth == null ? this.instance.wtSettings.settings.defaultColumnWidth : columnWidth;
    let calculator = this.wot.wtViewport.columnsRenderCalculator;

    if (calculator) {
      let stretchedWidth = calculator.getStretchedColumnWidth(sourceColumn, width);

      if (stretchedWidth) {
        width = stretchedWidth;
      }
    }

    return width;
  }
}

export {WalkontableTable};

window.WalkontableTable = WalkontableTable;
