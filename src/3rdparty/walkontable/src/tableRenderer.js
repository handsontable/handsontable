import {
  addClass,
  empty,
  getScrollbarWidth,
  hasClass,
  innerHeight,
  outerWidth
} from './../../../helpers/dom/element';
import { warn } from './../../../helpers/console';
import { toSingleLine } from './../../../helpers/templateLiteralTag';
import Overlay from './overlay/_base';

let performanceWarningAppeared = false;

/**
 * @class TableRenderer
 */
class TableRenderer {
  /**
   * @param {WalkontableTable} wtTable
   */
  constructor(wtTable) {
    this.wtTable = wtTable;
    this.wot = wtTable.instance;

    // legacy support
    this.instance = wtTable.instance;

    this.rowFilter = wtTable.rowFilter;
    this.columnFilter = wtTable.columnFilter;

    this.TABLE = wtTable.TABLE;
    this.THEAD = wtTable.THEAD;
    this.TBODY = wtTable.TBODY;
    this.COLGROUP = wtTable.COLGROUP;

    this.rowHeaders = [];
    this.rowHeaderCount = 0;
    this.columnHeaders = [];
    this.columnHeaderCount = 0;
    this.fixedRowsTop = 0;
    this.fixedRowsBottom = 0;
  }

  /**
   *
   */
  render() {
    if (!this.wtTable.isWorkingOnClone()) {
      const skipRender = {};
      this.wot.getSetting('beforeDraw', true, skipRender);

      if (skipRender.skipRender === true) {
        return;
      }
    }

    this.rowHeaders = this.wot.getSetting('rowHeaders');
    this.rowHeaderCount = this.rowHeaders.length;
    this.fixedRowsTop = this.wot.getSetting('fixedRowsTop');
    this.fixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
    this.columnHeaders = this.wot.getSetting('columnHeaders');
    this.columnHeaderCount = this.columnHeaders.length;

    const columnsToRender = this.wtTable.getRenderedColumnsCount();
    const rowsToRender = this.wtTable.getRenderedRowsCount();
    const totalColumns = this.wot.getSetting('totalColumns');
    const totalRows = this.wot.getSetting('totalRows');
    let workspaceWidth;
    let adjusted = false;

    if (Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_BOTTOM) ||
      Overlay.isOverlayTypeOf(this.wot.cloneOverlay, Overlay.CLONE_BOTTOM_LEFT_CORNER)) {

      // do NOT render headers on the bottom or bottom-left corner overlay
      this.columnHeaders = [];
      this.columnHeaderCount = 0;
    }

    if (totalColumns >= 0) {
      // prepare COL and TH elements for rendering
      this.adjustAvailableNodes();
      adjusted = true;

      // adjust column widths according to user widths settings
      this.renderColumnHeaders();

      // Render table rows
      this.renderRows(totalRows, rowsToRender, columnsToRender);

      if (!this.wtTable.isWorkingOnClone()) {
        workspaceWidth = this.wot.wtViewport.getWorkspaceWidth();
        this.wot.wtViewport.containerWidth = null;
      }

      this.adjustColumnWidths(columnsToRender);
      this.markOversizedColumnHeaders();
      this.adjustColumnHeaderHeights();
    }

    if (!adjusted) {
      this.adjustAvailableNodes();
    }
    this.removeRedundantRows(rowsToRender);

    if (!this.wtTable.isWorkingOnClone() || this.wot.isOverlayName(Overlay.CLONE_BOTTOM)) {
      this.markOversizedRows();
    }
    if (!this.wtTable.isWorkingOnClone()) {
      this.wot.wtViewport.createVisibleCalculators();
      this.wot.wtOverlays.refresh(false);

      this.wot.wtOverlays.applyToDOM();

      const hiderWidth = outerWidth(this.wtTable.hider);
      const tableWidth = outerWidth(this.wtTable.TABLE);

      if (hiderWidth !== 0 && (tableWidth !== hiderWidth)) {
        // Recalculate the column widths, if width changes made in the overlays removed the scrollbar, thus changing the viewport width.
        this.adjustColumnWidths(columnsToRender);
      }

      if (workspaceWidth !== this.wot.wtViewport.getWorkspaceWidth()) {
        // workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
        this.wot.wtViewport.containerWidth = null;

        const firstRendered = this.wtTable.getFirstRenderedColumn();
        const lastRendered = this.wtTable.getLastRenderedColumn();
        const defaultColumnWidth = this.wot.getSetting('defaultColumnWidth');
        let rowHeaderWidthSetting = this.wot.getSetting('rowHeaderWidth');

        rowHeaderWidthSetting = this.instance.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

        if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
          for (let i = 0; i < this.rowHeaderCount; i++) {
            let width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[i] : rowHeaderWidthSetting;

            width = (width === null || width === void 0) ? defaultColumnWidth : width;

            this.COLGROUP.childNodes[i].style.width = `${width}px`;
          }
        }

        for (let i = firstRendered; i < lastRendered; i++) {
          const width = this.wtTable.getStretchedColumnWidth(i);
          const renderedIndex = this.columnFilter.sourceToRendered(i);

          this.COLGROUP.childNodes[renderedIndex + this.rowHeaderCount].style.width = `${width}px`;
        }
      }

      this.wot.getSetting('onDraw', true);

    } else if (this.wot.isOverlayName(Overlay.CLONE_BOTTOM)) {
      this.wot.cloneSource.wtOverlays.adjustElementsSize();
    }
  }

  /**
   * @param {Number} renderedRowsCount
   */
  removeRedundantRows(renderedRowsCount) {
    while (this.wtTable.tbodyChildrenLength > renderedRowsCount) {
      this.TBODY.removeChild(this.TBODY.lastChild);
      this.wtTable.tbodyChildrenLength -= 1;
    }
  }

  /**
   * @param {Number} totalRows
   * @param {Number} rowsToRender
   * @param {Number} columnsToRender
   */
  renderRows(totalRows, rowsToRender, columnsToRender) {
    let TR;
    let visibleRowIndex = 0;
    let sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
    const isWorkingOnClone = this.wtTable.isWorkingOnClone();

    while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
      if (!performanceWarningAppeared && visibleRowIndex > 1000) {
        performanceWarningAppeared = true;
        warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible rows. Consider limiting the number 
          of rendered rows by specifying the table height and/or turning off the "renderAllRows" option.`);
      }
      if (rowsToRender !== void 0 && visibleRowIndex === rowsToRender) {
        // We have as much rows as needed for this clone
        break;
      }
      TR = this.getOrCreateTrForRow(visibleRowIndex, TR);

      // Render row headers
      this.renderRowHeaders(sourceRowIndex, TR);
      // Add and/or remove TDs to TR to match the desired number
      this.adjustColumns(TR, columnsToRender + this.rowHeaderCount);
      // Render cells
      this.renderCells(sourceRowIndex, TR, columnsToRender);

      if (!isWorkingOnClone ||
          // Necessary to refresh oversized row heights after editing cell in overlays
          this.wot.isOverlayName(Overlay.CLONE_BOTTOM)) {
        // Reset the oversized row cache for this row
        this.resetOversizedRow(sourceRowIndex);
      }

      if (TR.firstChild) {
        // if I have 2 fixed columns with one-line content and the 3rd column has a multiline content, this is
        // the way to make sure that the overlay will has same row height
        let height = this.wot.wtTable.getRowHeight(sourceRowIndex);

        if (height) {
          // Decrease height. 1 pixel will be "replaced" by 1px border top
          height -= 1;
          TR.firstChild.style.height = `${height}px`;
        } else {
          TR.firstChild.style.height = '';
        }
      }
      visibleRowIndex += 1;
      sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
    }
  }

  /**
   * Reset the oversized row cache for the provided index
   *
   * @param {Number} sourceRow Row index
   */
  resetOversizedRow(sourceRow) {
    if (this.wot.getSetting('externalRowCalculator')) {
      return;
    }
    if (this.wot.wtViewport.oversizedRows && this.wot.wtViewport.oversizedRows[sourceRow]) {
      this.wot.wtViewport.oversizedRows[sourceRow] = void 0;
    }
  }

  /**
   * Check if any of the rendered rows is higher than expected, and if so, cache them
   */
  markOversizedRows() {
    if (this.wot.getSetting('externalRowCalculator')) {
      return;
    }
    let rowCount = this.instance.wtTable.TBODY.childNodes.length;
    const expectedTableHeight = rowCount * this.instance.wtSettings.settings.defaultRowHeight;
    const actualTableHeight = innerHeight(this.instance.wtTable.TBODY) - 1;
    let previousRowHeight;
    let rowInnerHeight;
    let sourceRowIndex;
    let currentTr;
    let rowHeader;

    if (expectedTableHeight === actualTableHeight && !this.instance.getSetting('fixedRowsBottom')) {
      // If the actual table height equals rowCount * default single row height, no row is oversized -> no need to iterate over them
      return;
    }

    while (rowCount) {
      rowCount -= 1;
      sourceRowIndex = this.instance.wtTable.rowFilter.renderedToSource(rowCount);
      previousRowHeight = this.instance.wtTable.getRowHeight(sourceRowIndex);
      currentTr = this.instance.wtTable.getTrForRow(sourceRowIndex);
      rowHeader = currentTr.querySelector('th');

      if (rowHeader) {
        rowInnerHeight = innerHeight(rowHeader);
      } else {
        rowInnerHeight = innerHeight(currentTr) - 1;
      }

      if ((!previousRowHeight && this.instance.wtSettings.settings.defaultRowHeight < rowInnerHeight ||
          previousRowHeight < rowInnerHeight)) {
        rowInnerHeight += 1;
        this.instance.wtViewport.oversizedRows[sourceRowIndex] = rowInnerHeight;
      }
    }
  }

  /**
   * Check if any of the rendered columns is higher than expected, and if so, cache them.
   */
  markOversizedColumnHeaders() {
    const overlayName = this.wot.getOverlayName();

    if (!this.columnHeaderCount || this.wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName] || this.wtTable.isWorkingOnClone()) {
      return;
    }
    const columnCount = this.wtTable.getRenderedColumnsCount();

    for (let i = 0; i < this.columnHeaderCount; i++) {
      for (let renderedColumnIndex = (-1) * this.rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
        this.markIfOversizedColumnHeader(renderedColumnIndex);
      }
    }
    this.wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName] = true;
  }

  /**
   *
   */
  adjustColumnHeaderHeights() {
    const columnHeaders = this.wot.getSetting('columnHeaders');
    const children = this.wot.wtTable.THEAD.childNodes;
    const oversizedColumnHeaders = this.wot.wtViewport.oversizedColumnHeaders;

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
   * Check if column header for the specified column is higher than expected, and if so, cache it
   *
   * @param {Number} col Index of column
   */
  markIfOversizedColumnHeader(col) {
    const sourceColIndex = this.wot.wtTable.columnFilter.renderedToSource(col);
    let level = this.columnHeaderCount;
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

  /**
   * @param {Number} sourceRowIndex
   * @param {HTMLTableRowElement} TR
   * @param {Number} columnsToRender
   * @returns {HTMLTableCellElement}
   */
  renderCells(sourceRowIndex, TR, columnsToRender) {
    let TD;
    let sourceColIndex;

    for (let visibleColIndex = 0; visibleColIndex < columnsToRender; visibleColIndex++) {
      sourceColIndex = this.columnFilter.renderedToSource(visibleColIndex);

      if (visibleColIndex === 0) {
        TD = TR.childNodes[this.columnFilter.sourceColumnToVisibleRowHeadedColumn(sourceColIndex)];
      } else {
        TD = TD.nextSibling; // http://jsperf.com/nextsibling-vs-indexed-childnodes
      }
      // If the number of headers has been reduced, we need to replace excess TH with TD
      if (TD.nodeName === 'TH') {
        TD = replaceThWithTd(TD, TR);
      }
      if (!hasClass(TD, 'hide')) {
        TD.className = '';
      }
      TD.removeAttribute('style');
      this.wot.wtSettings.settings.cellRenderer(sourceRowIndex, sourceColIndex, TD);
    }

    return TD;
  }

  /**
   * @param {Number} columnsToRender Number of columns to render.
   */
  adjustColumnWidths(columnsToRender) {
    let scrollbarCompensation = 0;
    const sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    const defaultColumnWidth = this.wot.getSetting('defaultColumnWidth');
    let rowHeaderWidthSetting = this.wot.getSetting('rowHeaderWidth');

    if (mainHolder.offsetHeight < mainHolder.scrollHeight) {
      scrollbarCompensation = getScrollbarWidth();
    }
    this.wot.wtViewport.columnsRenderCalculator.refreshStretching(this.wot.wtViewport.getViewportWidth() - scrollbarCompensation);

    rowHeaderWidthSetting = this.instance.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
      for (let i = 0; i < this.rowHeaderCount; i++) {
        let width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[i] : rowHeaderWidthSetting;

        width = (width === null || width === void 0) ? defaultColumnWidth : width;

        this.COLGROUP.childNodes[i].style.width = `${width}px`;
      }
    }

    for (let renderedColIndex = 0; renderedColIndex < columnsToRender; renderedColIndex++) {
      const width = this.wtTable.getStretchedColumnWidth(this.columnFilter.renderedToSource(renderedColIndex));

      this.COLGROUP.childNodes[renderedColIndex + this.rowHeaderCount].style.width = `${width}px`;
    }
  }

  /**
   * @param {HTMLTableCellElement} TR
   */
  appendToTbody(TR) {
    this.TBODY.appendChild(TR);
    this.wtTable.tbodyChildrenLength += 1;
  }

  /**
   * @param {Number} rowIndex
   * @param {HTMLTableRowElement} currentTr
   * @returns {HTMLTableCellElement}
   */
  getOrCreateTrForRow(rowIndex, currentTr) {
    let TR;

    if (rowIndex >= this.wtTable.tbodyChildrenLength) {
      TR = this.createRow();
      this.appendToTbody(TR);

    } else if (rowIndex === 0) {
      TR = this.TBODY.firstChild;

    } else {
      // http://jsperf.com/nextsibling-vs-indexed-childnodes
      TR = currentTr.nextSibling;
    }
    if (TR.className) {
      TR.removeAttribute('class');
    }

    return TR;
  }

  /**
   * @returns {HTMLTableCellElement}
   */
  createRow() {
    const TR = document.createElement('TR');

    for (let visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
      TR.appendChild(document.createElement('TH'));
    }

    return TR;
  }

  /**
   * @param {Number} row
   * @param {Number} col
   * @param {HTMLTableCellElement} TH
   */
  renderRowHeader(row, col, TH) {
    TH.className = '';
    TH.removeAttribute('style');
    this.rowHeaders[col](row, TH, col);
  }

  /**
   * @param {Number} row
   * @param {HTMLTableCellElement} TR
   */
  renderRowHeaders(row, TR) {
    for (let TH = TR.firstChild, visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
      // If the number of row headers increased we need to create TH or replace an existing TD node with TH
      if (!TH) {
        TH = document.createElement('TH');
        TR.appendChild(TH);

      } else if (TH.nodeName === 'TD') {
        TH = replaceTdWithTh(TH, TR);
      }
      this.renderRowHeader(row, visibleColIndex, TH);
      // http://jsperf.com/nextsibling-vs-indexed-childnodes
      TH = TH.nextSibling;
    }
  }

  /**
   * Adjust the number of COL and TH elements to match the number of columns and headers that need to be rendered
   */
  adjustAvailableNodes() {
    this.adjustColGroups();
    this.adjustThead();
  }

  /**
   * Renders the column headers
   */
  renderColumnHeaders() {
    if (!this.columnHeaderCount) {
      return;
    }
    const columnCount = this.wtTable.getRenderedColumnsCount();

    for (let i = 0; i < this.columnHeaderCount; i++) {
      const TR = this.getTrForColumnHeaders(i);

      for (let renderedColumnIndex = (-1) * this.rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
        const sourceCol = this.columnFilter.renderedToSource(renderedColumnIndex);

        this.renderColumnHeader(i, sourceCol, TR.childNodes[renderedColumnIndex + this.rowHeaderCount]);
      }
    }
  }

  /**
   * Adjusts the number of COL elements to match the number of columns that need to be rendered
   */
  adjustColGroups() {
    const columnCount = this.wtTable.getRenderedColumnsCount();

    while (this.wtTable.colgroupChildrenLength < columnCount + this.rowHeaderCount) {
      this.COLGROUP.appendChild(document.createElement('COL'));
      this.wtTable.colgroupChildrenLength += 1;
    }
    while (this.wtTable.colgroupChildrenLength > columnCount + this.rowHeaderCount) {
      this.COLGROUP.removeChild(this.COLGROUP.lastChild);
      this.wtTable.colgroupChildrenLength -= 1;
    }
    if (this.rowHeaderCount) {
      addClass(this.COLGROUP.childNodes[0], 'rowHeader');
    }
  }

  /**
   * Adjusts the number of TH elements in THEAD to match the number of headers and columns that need to be rendered
   */
  adjustThead() {
    const columnCount = this.wtTable.getRenderedColumnsCount();
    let TR = this.THEAD.firstChild;

    if (this.columnHeaders.length) {
      for (let i = 0, len = this.columnHeaders.length; i < len; i++) {
        TR = this.THEAD.childNodes[i];

        if (!TR) {
          TR = document.createElement('TR');
          this.THEAD.appendChild(TR);
        }
        this.theadChildrenLength = TR.childNodes.length;

        while (this.theadChildrenLength < columnCount + this.rowHeaderCount) {
          TR.appendChild(document.createElement('TH'));
          this.theadChildrenLength += 1;
        }
        while (this.theadChildrenLength > columnCount + this.rowHeaderCount) {
          TR.removeChild(TR.lastChild);
          this.theadChildrenLength -= 1;
        }
      }
      const theadChildrenLength = this.THEAD.childNodes.length;

      if (theadChildrenLength > this.columnHeaders.length) {
        for (let i = this.columnHeaders.length; i < theadChildrenLength; i++) {
          this.THEAD.removeChild(this.THEAD.lastChild);
        }
      }
    } else if (TR) {
      empty(TR);
    }
  }

  /**
   * @param {Number} index
   * @returns {HTMLTableCellElement}
   */
  getTrForColumnHeaders(index) {
    return this.THEAD.childNodes[index];
  }

  /**
   * @param {Number} row
   * @param {Number} col
   * @param {HTMLTableCellElement} TH
   * @returns {*}
   */
  renderColumnHeader(row, col, TH) {
    TH.className = '';
    TH.removeAttribute('style');

    return this.columnHeaders[row](col, TH, row);
  }

  /**
   * Add and/or remove the TDs to match the desired number
   *
   * @param {HTMLTableCellElement} TR Table row in question
   * @param {Number} desiredCount The desired number of TDs in the TR
   */
  adjustColumns(TR, desiredCount) {
    let count = TR.childNodes.length;

    while (count < desiredCount) {
      const TD = document.createElement('TD');

      TR.appendChild(TD);
      count += 1;
    }
    while (count > desiredCount) {
      TR.removeChild(TR.lastChild);
      count -= 1;
    }
  }

  /**
   * @param {Number} columnsToRender
   */
  removeRedundantColumns(columnsToRender) {
    while (this.wtTable.tbodyChildrenLength > columnsToRender) {
      this.TBODY.removeChild(this.TBODY.lastChild);
      this.wtTable.tbodyChildrenLength -= 1;
    }
  }
}

function replaceTdWithTh(TD, TR) {
  const TH = document.createElement('TH');

  TR.insertBefore(TH, TD);
  TR.removeChild(TD);

  return TH;
}

function replaceThWithTd(TH, TR) {
  const TD = document.createElement('TD');

  TR.insertBefore(TD, TH);
  TR.removeChild(TH);

  return TD;
}

export default TableRenderer;
