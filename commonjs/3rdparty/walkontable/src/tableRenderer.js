'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(['Performance tip: Handsontable rendered more than 1000 visible rows. Consider limiting the number \n          of rendered rows by specifying the table height and/or turning off the "renderAllRows" option.'], ['Performance tip: Handsontable rendered more than 1000 visible rows. Consider limiting the number \n          of rendered rows by specifying the table height and/or turning off the "renderAllRows" option.']);

var _element = require('./../../../helpers/dom/element');

var _console = require('./../../../helpers/console');

var _templateLiteralTag = require('./../../../helpers/templateLiteralTag');

var _base = require('./overlay/_base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var performanceWarningAppeared = false;

/**
 * @class TableRenderer
 */

var TableRenderer = function () {
  /**
   * @param {WalkontableTable} wtTable
   */
  function TableRenderer(wtTable) {
    _classCallCheck(this, TableRenderer);

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


  _createClass(TableRenderer, [{
    key: 'render',
    value: function render() {
      if (!this.wtTable.isWorkingOnClone()) {
        var skipRender = {};
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

      var columnsToRender = this.wtTable.getRenderedColumnsCount();
      var rowsToRender = this.wtTable.getRenderedRowsCount();
      var totalColumns = this.wot.getSetting('totalColumns');
      var totalRows = this.wot.getSetting('totalRows');
      var workspaceWidth = void 0;
      var adjusted = false;

      if (_base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_BOTTOM) || _base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_BOTTOM_LEFT_CORNER)) {

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

      if (!this.wtTable.isWorkingOnClone() || this.wot.isOverlayName(_base2.default.CLONE_BOTTOM)) {
        this.markOversizedRows();
      }
      if (!this.wtTable.isWorkingOnClone()) {
        this.wot.wtViewport.createVisibleCalculators();
        this.wot.wtOverlays.refresh(false);

        this.wot.wtOverlays.applyToDOM();

        var hiderWidth = (0, _element.outerWidth)(this.wtTable.hider);
        var tableWidth = (0, _element.outerWidth)(this.wtTable.TABLE);

        if (hiderWidth !== 0 && tableWidth !== hiderWidth) {
          // Recalculate the column widths, if width changes made in the overlays removed the scrollbar, thus changing the viewport width.
          this.adjustColumnWidths(columnsToRender);
        }

        if (workspaceWidth !== this.wot.wtViewport.getWorkspaceWidth()) {
          // workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
          this.wot.wtViewport.containerWidth = null;

          var firstRendered = this.wtTable.getFirstRenderedColumn();
          var lastRendered = this.wtTable.getLastRenderedColumn();
          var defaultColumnWidth = this.wot.getSetting('defaultColumnWidth');
          var rowHeaderWidthSetting = this.wot.getSetting('rowHeaderWidth');

          rowHeaderWidthSetting = this.instance.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

          if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
            for (var i = 0; i < this.rowHeaderCount; i++) {
              var width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[i] : rowHeaderWidthSetting;

              width = width === null || width === void 0 ? defaultColumnWidth : width;

              this.COLGROUP.childNodes[i].style.width = width + 'px';
            }
          }

          for (var _i = firstRendered; _i < lastRendered; _i++) {
            var _width = this.wtTable.getStretchedColumnWidth(_i);
            var renderedIndex = this.columnFilter.sourceToRendered(_i);

            this.COLGROUP.childNodes[renderedIndex + this.rowHeaderCount].style.width = _width + 'px';
          }
        }

        this.wot.getSetting('onDraw', true);
      } else if (this.wot.isOverlayName(_base2.default.CLONE_BOTTOM)) {
        this.wot.cloneSource.wtOverlays.adjustElementsSize();
      }
    }

    /**
     * @param {Number} renderedRowsCount
     */

  }, {
    key: 'removeRedundantRows',
    value: function removeRedundantRows(renderedRowsCount) {
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

  }, {
    key: 'renderRows',
    value: function renderRows(totalRows, rowsToRender, columnsToRender) {
      var TR = void 0;
      var visibleRowIndex = 0;
      var sourceRowIndex = this.rowFilter.renderedToSource(visibleRowIndex);
      var isWorkingOnClone = this.wtTable.isWorkingOnClone();

      while (sourceRowIndex < totalRows && sourceRowIndex >= 0) {
        if (!performanceWarningAppeared && visibleRowIndex > 1000) {
          performanceWarningAppeared = true;
          (0, _console.warn)((0, _templateLiteralTag.toSingleLine)(_templateObject));
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
        this.wot.isOverlayName(_base2.default.CLONE_BOTTOM)) {
          // Reset the oversized row cache for this row
          this.resetOversizedRow(sourceRowIndex);
        }

        if (TR.firstChild) {
          // if I have 2 fixed columns with one-line content and the 3rd column has a multiline content, this is
          // the way to make sure that the overlay will has same row height
          var height = this.wot.wtTable.getRowHeight(sourceRowIndex);

          if (height) {
            // Decrease height. 1 pixel will be "replaced" by 1px border top
            height -= 1;
            TR.firstChild.style.height = height + 'px';
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

  }, {
    key: 'resetOversizedRow',
    value: function resetOversizedRow(sourceRow) {
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

  }, {
    key: 'markOversizedRows',
    value: function markOversizedRows() {
      if (this.wot.getSetting('externalRowCalculator')) {
        return;
      }
      var rowCount = this.instance.wtTable.TBODY.childNodes.length;
      var expectedTableHeight = rowCount * this.instance.wtSettings.settings.defaultRowHeight;
      var actualTableHeight = (0, _element.innerHeight)(this.instance.wtTable.TBODY) - 1;
      var previousRowHeight = void 0;
      var rowInnerHeight = void 0;
      var sourceRowIndex = void 0;
      var currentTr = void 0;
      var rowHeader = void 0;

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
          rowInnerHeight = (0, _element.innerHeight)(rowHeader);
        } else {
          rowInnerHeight = (0, _element.innerHeight)(currentTr) - 1;
        }

        if (!previousRowHeight && this.instance.wtSettings.settings.defaultRowHeight < rowInnerHeight || previousRowHeight < rowInnerHeight) {
          rowInnerHeight += 1;
          this.instance.wtViewport.oversizedRows[sourceRowIndex] = rowInnerHeight;
        }
      }
    }

    /**
     * Check if any of the rendered columns is higher than expected, and if so, cache them.
     */

  }, {
    key: 'markOversizedColumnHeaders',
    value: function markOversizedColumnHeaders() {
      var overlayName = this.wot.getOverlayName();

      if (!this.columnHeaderCount || this.wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName] || this.wtTable.isWorkingOnClone()) {
        return;
      }
      var columnCount = this.wtTable.getRenderedColumnsCount();

      for (var i = 0; i < this.columnHeaderCount; i++) {
        for (var renderedColumnIndex = -1 * this.rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
          this.markIfOversizedColumnHeader(renderedColumnIndex);
        }
      }
      this.wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName] = true;
    }

    /**
     *
     */

  }, {
    key: 'adjustColumnHeaderHeights',
    value: function adjustColumnHeaderHeights() {
      var columnHeaders = this.wot.getSetting('columnHeaders');
      var children = this.wot.wtTable.THEAD.childNodes;
      var oversizedColumnHeaders = this.wot.wtViewport.oversizedColumnHeaders;

      for (var i = 0, len = columnHeaders.length; i < len; i++) {
        if (oversizedColumnHeaders[i]) {
          if (!children[i] || children[i].childNodes.length === 0) {
            return;
          }
          children[i].childNodes[0].style.height = oversizedColumnHeaders[i] + 'px';
        }
      }
    }

    /**
     * Check if column header for the specified column is higher than expected, and if so, cache it
     *
     * @param {Number} col Index of column
     */

  }, {
    key: 'markIfOversizedColumnHeader',
    value: function markIfOversizedColumnHeader(col) {
      var sourceColIndex = this.wot.wtTable.columnFilter.renderedToSource(col);
      var level = this.columnHeaderCount;
      var defaultRowHeight = this.wot.wtSettings.settings.defaultRowHeight;
      var previousColHeaderHeight = void 0;
      var currentHeader = void 0;
      var currentHeaderHeight = void 0;
      var columnHeaderHeightSetting = this.wot.getSetting('columnHeaderHeight') || [];

      while (level) {
        level -= 1;

        previousColHeaderHeight = this.wot.wtTable.getColumnHeaderHeight(level);
        currentHeader = this.wot.wtTable.getColumnHeader(sourceColIndex, level);

        if (!currentHeader) {
          /* eslint-disable no-continue */
          continue;
        }
        currentHeaderHeight = (0, _element.innerHeight)(currentHeader);

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
          this.wot.wtViewport.oversizedColumnHeaders[level] = columnHeaderHeightSetting[level] || columnHeaderHeightSetting;
        }
      }
    }

    /**
     * @param {Number} sourceRowIndex
     * @param {HTMLTableRowElement} TR
     * @param {Number} columnsToRender
     * @returns {HTMLTableCellElement}
     */

  }, {
    key: 'renderCells',
    value: function renderCells(sourceRowIndex, TR, columnsToRender) {
      var TD = void 0;
      var sourceColIndex = void 0;

      for (var visibleColIndex = 0; visibleColIndex < columnsToRender; visibleColIndex++) {
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
        if (!(0, _element.hasClass)(TD, 'hide')) {
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

  }, {
    key: 'adjustColumnWidths',
    value: function adjustColumnWidths(columnsToRender) {
      var scrollbarCompensation = 0;
      var sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
      var mainHolder = sourceInstance.wtTable.holder;
      var defaultColumnWidth = this.wot.getSetting('defaultColumnWidth');
      var rowHeaderWidthSetting = this.wot.getSetting('rowHeaderWidth');

      if (mainHolder.offsetHeight < mainHolder.scrollHeight) {
        scrollbarCompensation = (0, _element.getScrollbarWidth)();
      }
      this.wot.wtViewport.columnsRenderCalculator.refreshStretching(this.wot.wtViewport.getViewportWidth() - scrollbarCompensation);

      rowHeaderWidthSetting = this.instance.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

      if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
        for (var i = 0; i < this.rowHeaderCount; i++) {
          var width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[i] : rowHeaderWidthSetting;

          width = width === null || width === void 0 ? defaultColumnWidth : width;

          this.COLGROUP.childNodes[i].style.width = width + 'px';
        }
      }

      for (var renderedColIndex = 0; renderedColIndex < columnsToRender; renderedColIndex++) {
        var _width2 = this.wtTable.getStretchedColumnWidth(this.columnFilter.renderedToSource(renderedColIndex));

        this.COLGROUP.childNodes[renderedColIndex + this.rowHeaderCount].style.width = _width2 + 'px';
      }
    }

    /**
     * @param {HTMLTableCellElement} TR
     */

  }, {
    key: 'appendToTbody',
    value: function appendToTbody(TR) {
      this.TBODY.appendChild(TR);
      this.wtTable.tbodyChildrenLength += 1;
    }

    /**
     * @param {Number} rowIndex
     * @param {HTMLTableRowElement} currentTr
     * @returns {HTMLTableCellElement}
     */

  }, {
    key: 'getOrCreateTrForRow',
    value: function getOrCreateTrForRow(rowIndex, currentTr) {
      var TR = void 0;

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

  }, {
    key: 'createRow',
    value: function createRow() {
      var TR = document.createElement('TR');

      for (var visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
        TR.appendChild(document.createElement('TH'));
      }

      return TR;
    }

    /**
     * @param {Number} row
     * @param {Number} col
     * @param {HTMLTableCellElement} TH
     */

  }, {
    key: 'renderRowHeader',
    value: function renderRowHeader(row, col, TH) {
      TH.className = '';
      TH.removeAttribute('style');
      this.rowHeaders[col](row, TH, col);
    }

    /**
     * @param {Number} row
     * @param {HTMLTableCellElement} TR
     */

  }, {
    key: 'renderRowHeaders',
    value: function renderRowHeaders(row, TR) {
      for (var TH = TR.firstChild, visibleColIndex = 0; visibleColIndex < this.rowHeaderCount; visibleColIndex++) {
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

  }, {
    key: 'adjustAvailableNodes',
    value: function adjustAvailableNodes() {
      this.adjustColGroups();
      this.adjustThead();
    }

    /**
     * Renders the column headers
     */

  }, {
    key: 'renderColumnHeaders',
    value: function renderColumnHeaders() {
      if (!this.columnHeaderCount) {
        return;
      }
      var columnCount = this.wtTable.getRenderedColumnsCount();

      for (var i = 0; i < this.columnHeaderCount; i++) {
        var TR = this.getTrForColumnHeaders(i);

        for (var renderedColumnIndex = -1 * this.rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
          var sourceCol = this.columnFilter.renderedToSource(renderedColumnIndex);

          this.renderColumnHeader(i, sourceCol, TR.childNodes[renderedColumnIndex + this.rowHeaderCount]);
        }
      }
    }

    /**
     * Adjusts the number of COL elements to match the number of columns that need to be rendered
     */

  }, {
    key: 'adjustColGroups',
    value: function adjustColGroups() {
      var columnCount = this.wtTable.getRenderedColumnsCount();

      while (this.wtTable.colgroupChildrenLength < columnCount + this.rowHeaderCount) {
        this.COLGROUP.appendChild(document.createElement('COL'));
        this.wtTable.colgroupChildrenLength += 1;
      }
      while (this.wtTable.colgroupChildrenLength > columnCount + this.rowHeaderCount) {
        this.COLGROUP.removeChild(this.COLGROUP.lastChild);
        this.wtTable.colgroupChildrenLength -= 1;
      }
      if (this.rowHeaderCount) {
        (0, _element.addClass)(this.COLGROUP.childNodes[0], 'rowHeader');
      }
    }

    /**
     * Adjusts the number of TH elements in THEAD to match the number of headers and columns that need to be rendered
     */

  }, {
    key: 'adjustThead',
    value: function adjustThead() {
      var columnCount = this.wtTable.getRenderedColumnsCount();
      var TR = this.THEAD.firstChild;

      if (this.columnHeaders.length) {
        for (var i = 0, len = this.columnHeaders.length; i < len; i++) {
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
        var theadChildrenLength = this.THEAD.childNodes.length;

        if (theadChildrenLength > this.columnHeaders.length) {
          for (var _i2 = this.columnHeaders.length; _i2 < theadChildrenLength; _i2++) {
            this.THEAD.removeChild(this.THEAD.lastChild);
          }
        }
      } else if (TR) {
        (0, _element.empty)(TR);
      }
    }

    /**
     * @param {Number} index
     * @returns {HTMLTableCellElement}
     */

  }, {
    key: 'getTrForColumnHeaders',
    value: function getTrForColumnHeaders(index) {
      return this.THEAD.childNodes[index];
    }

    /**
     * @param {Number} row
     * @param {Number} col
     * @param {HTMLTableCellElement} TH
     * @returns {*}
     */

  }, {
    key: 'renderColumnHeader',
    value: function renderColumnHeader(row, col, TH) {
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

  }, {
    key: 'adjustColumns',
    value: function adjustColumns(TR, desiredCount) {
      var count = TR.childNodes.length;

      while (count < desiredCount) {
        var TD = document.createElement('TD');

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

  }, {
    key: 'removeRedundantColumns',
    value: function removeRedundantColumns(columnsToRender) {
      while (this.wtTable.tbodyChildrenLength > columnsToRender) {
        this.TBODY.removeChild(this.TBODY.lastChild);
        this.wtTable.tbodyChildrenLength -= 1;
      }
    }
  }]);

  return TableRenderer;
}();

function replaceTdWithTh(TD, TR) {
  var TH = document.createElement('TH');

  TR.insertBefore(TH, TD);
  TR.removeChild(TD);

  return TH;
}

function replaceThWithTd(TH, TR) {
  var TD = document.createElement('TD');

  TR.insertBefore(TD, TH);
  TR.removeChild(TH);

  return TD;
}

exports.default = TableRenderer;