'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _element = require('./../../../helpers/dom/element');

var _function = require('./../../../helpers/function');

var _coords = require('./cell/coords');

var _coords2 = _interopRequireDefault(_coords);

var _column = require('./filter/column');

var _column2 = _interopRequireDefault(_column);

var _row = require('./filter/row');

var _row2 = _interopRequireDefault(_row);

var _tableRenderer = require('./tableRenderer');

var _tableRenderer2 = _interopRequireDefault(_tableRenderer);

var _base = require('./overlay/_base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *
 */
var Table = function () {
  /**
   * @param {Walkontable} wotInstance
   * @param {HTMLTableElement} table
   */
  function Table(wotInstance, table) {
    var _this = this;

    _classCallCheck(this, Table);

    this.wot = wotInstance;

    // legacy support
    this.instance = this.wot;
    this.TABLE = table;
    this.TBODY = null;
    this.THEAD = null;
    this.COLGROUP = null;
    this.tableOffset = 0;
    this.holderOffset = 0;

    (0, _element.removeTextNodes)(this.TABLE);

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

    var origRowHeaderWidth = this.wot.wtSettings.settings.rowHeaderWidth;

    // Fix for jumping row headers (https://github.com/handsontable/handsontable/issues/3850)
    this.wot.wtSettings.settings.rowHeaderWidth = function () {
      return _this._modifyRowHeaderWidth(origRowHeaderWidth);
    };
  }

  /**
   *
   */


  _createClass(Table, [{
    key: 'fixTableDomTree',
    value: function fixTableDomTree() {
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

  }, {
    key: 'createSpreader',
    value: function createSpreader(table) {
      var parent = table.parentNode;
      var spreader = void 0;

      if (!parent || parent.nodeType !== 1 || !(0, _element.hasClass)(parent, 'wtHolder')) {
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

  }, {
    key: 'createHider',
    value: function createHider(spreader) {
      var parent = spreader.parentNode;
      var hider = void 0;

      if (!parent || parent.nodeType !== 1 || !(0, _element.hasClass)(parent, 'wtHolder')) {
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

  }, {
    key: 'createHolder',
    value: function createHolder(hider) {
      var parent = hider.parentNode;
      var holder = void 0;

      if (!parent || parent.nodeType !== 1 || !(0, _element.hasClass)(parent, 'wtHolder')) {
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
  }, {
    key: 'alignOverlaysWithTrimmingContainer',
    value: function alignOverlaysWithTrimmingContainer() {
      var trimmingElement = (0, _element.getTrimmingContainer)(this.wtRootElement);

      if (!this.isWorkingOnClone()) {
        this.holder.parentNode.style.position = 'relative';

        if (trimmingElement === window) {
          var preventOverflow = this.wot.getSetting('preventOverflow');

          if (!preventOverflow) {
            this.holder.style.overflow = 'visible';
            this.wtRootElement.style.overflow = 'visible';
          }
        } else {
          this.holder.style.width = (0, _element.getStyle)(trimmingElement, 'width');
          this.holder.style.height = (0, _element.getStyle)(trimmingElement, 'height');
          this.holder.style.overflow = '';
        }
      }
    }
  }, {
    key: 'isWorkingOnClone',
    value: function isWorkingOnClone() {
      return !!this.wot.cloneSource;
    }

    /**
     * Redraws the table
     *
     * @param {Boolean} fastDraw If TRUE, will try to avoid full redraw and only update the border positions. If FALSE or UNDEFINED, will perform a full redraw
     * @returns {Table}
     */

  }, {
    key: 'draw',
    value: function draw(fastDraw) {
      var _wot = this.wot,
          wtOverlays = _wot.wtOverlays,
          wtViewport = _wot.wtViewport;

      var totalRows = this.instance.getSetting('totalRows');
      var rowHeaders = this.wot.getSetting('rowHeaders').length;
      var columnHeaders = this.wot.getSetting('columnHeaders').length;
      var syncScroll = false;
      var runFastDraw = fastDraw;

      if (!this.isWorkingOnClone()) {
        this.holderOffset = (0, _element.offset)(this.holder);
        runFastDraw = wtViewport.createRenderCalculators(runFastDraw);

        if (rowHeaders && !this.wot.getSetting('fixedColumnsLeft')) {
          var leftScrollPos = wtOverlays.leftOverlay.getScrollPosition();
          var previousState = this.correctHeaderWidth;

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
          this.tableOffset = (0, _element.offset)(this.TABLE);
        }
        var startRow = void 0;

        if (_base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_DEBUG) || _base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_TOP) || _base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_TOP_LEFT_CORNER)) {
          startRow = 0;
        } else if (_base2.default.isOverlayTypeOf(this.instance.cloneOverlay, _base2.default.CLONE_BOTTOM) || _base2.default.isOverlayTypeOf(this.instance.cloneOverlay, _base2.default.CLONE_BOTTOM_LEFT_CORNER)) {
          startRow = Math.max(totalRows - this.wot.getSetting('fixedRowsBottom'), 0);
        } else {
          startRow = wtViewport.rowsRenderCalculator.startRow;
        }
        var startColumn = void 0;

        if (_base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_DEBUG) || _base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_LEFT) || _base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_TOP_LEFT_CORNER) || _base2.default.isOverlayTypeOf(this.wot.cloneOverlay, _base2.default.CLONE_BOTTOM_LEFT_CORNER)) {
          startColumn = 0;
        } else {
          startColumn = wtViewport.columnsRenderCalculator.startColumn;
        }
        this.rowFilter = new _row2.default(startRow, totalRows, columnHeaders);
        this.columnFilter = new _column2.default(startColumn, this.wot.getSetting('totalColumns'), rowHeaders);

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
  }, {
    key: '_doDraw',
    value: function _doDraw() {
      var wtRenderer = new _tableRenderer2.default(this);

      wtRenderer.render();
    }
  }, {
    key: 'removeClassFromCells',
    value: function removeClassFromCells(className) {
      var nodes = this.TABLE.querySelectorAll('.' + className);

      for (var i = 0, len = nodes.length; i < len; i++) {
        (0, _element.removeClass)(nodes[i], className);
      }
    }

    /**
     * Refresh the table selection by re-rendering Selection instances connected with that instance.
     *
     * @param {Boolean} fastDraw If fast drawing is enabled than additionally className clearing is applied.
     */

  }, {
    key: 'refreshSelections',
    value: function refreshSelections(fastDraw) {
      if (!this.wot.selections) {
        return;
      }
      var highlights = Array.from(this.wot.selections);
      var len = highlights.length;

      if (fastDraw) {
        var classesToRemove = [];

        for (var i = 0; i < len; i++) {
          var _highlights$i$setting = highlights[i].settings,
              highlightHeaderClassName = _highlights$i$setting.highlightHeaderClassName,
              highlightRowClassName = _highlights$i$setting.highlightRowClassName,
              highlightColumnClassName = _highlights$i$setting.highlightColumnClassName;

          var classNames = highlights[i].classNames;
          var classNamesLength = classNames.length;

          for (var j = 0; j < classNamesLength; j++) {
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

        var additionalClassesToRemove = this.wot.getSetting('onBeforeRemoveCellClassNames');

        if (Array.isArray(additionalClassesToRemove)) {
          for (var _i = 0; _i < additionalClassesToRemove.length; _i++) {
            classesToRemove.push(additionalClassesToRemove[_i]);
          }
        }

        var classesToRemoveLength = classesToRemove.length;

        for (var _i2 = 0; _i2 < classesToRemoveLength; _i2++) {
          // there was no rerender, so we need to remove classNames by ourselves
          this.removeClassFromCells(classesToRemove[_i2]);
        }
      }

      for (var _i3 = 0; _i3 < len; _i3++) {
        highlights[_i3].draw(this.wot, fastDraw);
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

  }, {
    key: 'getCell',
    value: function getCell(coords) {
      var row = coords.row;
      var column = coords.col;
      var hookResult = this.wot.getSetting('onModifyGetCellCoords', row, column);

      if (hookResult && Array.isArray(hookResult)) {
        var _hookResult = _slicedToArray(hookResult, 2);

        row = _hookResult[0];
        column = _hookResult[1];
      }

      if (this.isRowBeforeRenderedRows(row)) {
        // row before rendered rows
        return -1;
      } else if (this.isRowAfterRenderedRows(row)) {
        // row after rendered rows
        return -2;
      }

      var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

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

  }, {
    key: 'getColumnHeader',
    value: function getColumnHeader(col) {
      var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      var TR = this.THEAD.childNodes[level];

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

  }, {
    key: 'getRowHeader',
    value: function getRowHeader(row) {
      if (this.columnFilter.sourceColumnToVisibleRowHeadedColumn(0) === 0) {
        return null;
      }
      var TR = this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];

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

  }, {
    key: 'getCoords',
    value: function getCoords(TD) {
      var cellElement = TD;

      if (cellElement.nodeName !== 'TD' && cellElement.nodeName !== 'TH') {
        cellElement = (0, _element.closest)(cellElement, ['TD', 'TH']);
      }

      if (cellElement === null) {
        return null;
      }

      var TR = cellElement.parentNode;
      var CONTAINER = TR.parentNode;
      var row = (0, _element.index)(TR);
      var col = cellElement.cellIndex;

      if ((0, _element.overlayContainsElement)(_base2.default.CLONE_TOP_LEFT_CORNER, cellElement) || (0, _element.overlayContainsElement)(_base2.default.CLONE_TOP, cellElement)) {
        if (CONTAINER.nodeName === 'THEAD') {
          row -= CONTAINER.childNodes.length;
        }
      } else if (CONTAINER === this.THEAD) {
        row = this.rowFilter.visibleColHeadedRowToSourceRow(row);
      } else {
        row = this.rowFilter.renderedToSource(row);
      }

      if ((0, _element.overlayContainsElement)(_base2.default.CLONE_TOP_LEFT_CORNER, cellElement) || (0, _element.overlayContainsElement)(_base2.default.CLONE_LEFT, cellElement)) {
        col = this.columnFilter.offsettedTH(col);
      } else {
        col = this.columnFilter.visibleRowHeadedColumnToSourceColumn(col);
      }

      return new _coords2.default(row, col);
    }
  }, {
    key: 'getTrForRow',
    value: function getTrForRow(row) {
      return this.TBODY.childNodes[this.rowFilter.sourceToRendered(row)];
    }
  }, {
    key: 'getFirstRenderedRow',
    value: function getFirstRenderedRow() {
      return this.wot.wtViewport.rowsRenderCalculator.startRow;
    }
  }, {
    key: 'getFirstVisibleRow',
    value: function getFirstVisibleRow() {
      return this.wot.wtViewport.rowsVisibleCalculator.startRow;
    }
  }, {
    key: 'getFirstRenderedColumn',
    value: function getFirstRenderedColumn() {
      return this.wot.wtViewport.columnsRenderCalculator.startColumn;
    }

    /**
     * @returns {Number} Returns -1 if no row is visible
     */

  }, {
    key: 'getFirstVisibleColumn',
    value: function getFirstVisibleColumn() {
      return this.wot.wtViewport.columnsVisibleCalculator.startColumn;
    }

    /**
     * @returns {Number} Returns -1 if no row is visible
     */

  }, {
    key: 'getLastRenderedRow',
    value: function getLastRenderedRow() {
      return this.wot.wtViewport.rowsRenderCalculator.endRow;
    }
  }, {
    key: 'getLastVisibleRow',
    value: function getLastVisibleRow() {
      return this.wot.wtViewport.rowsVisibleCalculator.endRow;
    }
  }, {
    key: 'getLastRenderedColumn',
    value: function getLastRenderedColumn() {
      return this.wot.wtViewport.columnsRenderCalculator.endColumn;
    }

    /**
     * @returns {Number} Returns -1 if no column is visible
     */

  }, {
    key: 'getLastVisibleColumn',
    value: function getLastVisibleColumn() {
      return this.wot.wtViewport.columnsVisibleCalculator.endColumn;
    }
  }, {
    key: 'isRowBeforeRenderedRows',
    value: function isRowBeforeRenderedRows(row) {
      return this.rowFilter && this.rowFilter.sourceToRendered(row) < 0 && row >= 0;
    }
  }, {
    key: 'isRowAfterViewport',
    value: function isRowAfterViewport(row) {
      return this.rowFilter && this.rowFilter.sourceToRendered(row) > this.getLastVisibleRow();
    }
  }, {
    key: 'isRowAfterRenderedRows',
    value: function isRowAfterRenderedRows(row) {
      return this.rowFilter && this.rowFilter.sourceToRendered(row) > this.getLastRenderedRow();
    }
  }, {
    key: 'isColumnBeforeViewport',
    value: function isColumnBeforeViewport(column) {
      return this.columnFilter && this.columnFilter.sourceToRendered(column) < 0 && column >= 0;
    }
  }, {
    key: 'isColumnAfterViewport',
    value: function isColumnAfterViewport(column) {
      return this.columnFilter && this.columnFilter.sourceToRendered(column) > this.getLastVisibleColumn();
    }
  }, {
    key: 'isLastRowFullyVisible',
    value: function isLastRowFullyVisible() {
      return this.getLastVisibleRow() === this.getLastRenderedRow();
    }
  }, {
    key: 'isLastColumnFullyVisible',
    value: function isLastColumnFullyVisible() {
      return this.getLastVisibleColumn() === this.getLastRenderedColumn();
    }
  }, {
    key: 'getRenderedColumnsCount',
    value: function getRenderedColumnsCount() {
      var columnsCount = this.wot.wtViewport.columnsRenderCalculator.count;
      var totalColumns = this.wot.getSetting('totalColumns');

      if (this.wot.isOverlayName(_base2.default.CLONE_DEBUG)) {
        columnsCount = totalColumns;
      } else if (this.wot.isOverlayName(_base2.default.CLONE_LEFT) || this.wot.isOverlayName(_base2.default.CLONE_TOP_LEFT_CORNER) || this.wot.isOverlayName(_base2.default.CLONE_BOTTOM_LEFT_CORNER)) {
        return Math.min(this.wot.getSetting('fixedColumnsLeft'), totalColumns);
      }

      return columnsCount;
    }
  }, {
    key: 'getRenderedRowsCount',
    value: function getRenderedRowsCount() {
      var rowsCount = this.wot.wtViewport.rowsRenderCalculator.count;
      var totalRows = this.wot.getSetting('totalRows');

      if (this.wot.isOverlayName(_base2.default.CLONE_DEBUG)) {
        rowsCount = totalRows;
      } else if (this.wot.isOverlayName(_base2.default.CLONE_TOP) || this.wot.isOverlayName(_base2.default.CLONE_TOP_LEFT_CORNER)) {
        rowsCount = Math.min(this.wot.getSetting('fixedRowsTop'), totalRows);
      } else if (this.wot.isOverlayName(_base2.default.CLONE_BOTTOM) || this.wot.isOverlayName(_base2.default.CLONE_BOTTOM_LEFT_CORNER)) {
        rowsCount = Math.min(this.wot.getSetting('fixedRowsBottom'), totalRows);
      }

      return rowsCount;
    }
  }, {
    key: 'getVisibleRowsCount',
    value: function getVisibleRowsCount() {
      return this.wot.wtViewport.rowsVisibleCalculator.count;
    }
  }, {
    key: 'allRowsInViewport',
    value: function allRowsInViewport() {
      return this.wot.getSetting('totalRows') === this.getVisibleRowsCount();
    }

    /**
     * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
     *
     * @param {Number} sourceRow
     * @returns {Number}
     */

  }, {
    key: 'getRowHeight',
    value: function getRowHeight(sourceRow) {
      var height = this.wot.wtSettings.settings.rowHeight(sourceRow);
      var oversizedHeight = this.wot.wtViewport.oversizedRows[sourceRow];

      if (oversizedHeight !== void 0) {
        height = height === void 0 ? oversizedHeight : Math.max(height, oversizedHeight);
      }

      return height;
    }
  }, {
    key: 'getColumnHeaderHeight',
    value: function getColumnHeaderHeight(level) {
      var height = this.wot.wtSettings.settings.defaultRowHeight;
      var oversizedHeight = this.wot.wtViewport.oversizedColumnHeaders[level];

      if (oversizedHeight !== void 0) {
        height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
      }

      return height;
    }
  }, {
    key: 'getVisibleColumnsCount',
    value: function getVisibleColumnsCount() {
      return this.wot.wtViewport.columnsVisibleCalculator.count;
    }
  }, {
    key: 'allColumnsInViewport',
    value: function allColumnsInViewport() {
      return this.wot.getSetting('totalColumns') === this.getVisibleColumnsCount();
    }
  }, {
    key: 'getColumnWidth',
    value: function getColumnWidth(sourceColumn) {
      var width = this.wot.wtSettings.settings.columnWidth;

      if (typeof width === 'function') {
        width = width(sourceColumn);
      } else if ((typeof width === 'undefined' ? 'undefined' : _typeof(width)) === 'object') {
        width = width[sourceColumn];
      }

      return width || this.wot.wtSettings.settings.defaultColumnWidth;
    }
  }, {
    key: 'getStretchedColumnWidth',
    value: function getStretchedColumnWidth(sourceColumn) {
      var columnWidth = this.getColumnWidth(sourceColumn);
      var width = columnWidth === null || columnWidth === void 0 ? this.instance.wtSettings.settings.defaultColumnWidth : columnWidth;
      var calculator = this.wot.wtViewport.columnsRenderCalculator;

      if (calculator) {
        var stretchedWidth = calculator.getStretchedColumnWidth(sourceColumn, width);

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

  }, {
    key: '_modifyRowHeaderWidth',
    value: function _modifyRowHeaderWidth(rowHeaderWidthFactory) {
      var widths = (0, _function.isFunction)(rowHeaderWidthFactory) ? rowHeaderWidthFactory() : null;

      if (Array.isArray(widths)) {
        widths = [].concat(_toConsumableArray(widths));
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

  }, {
    key: '_correctRowHeaderWidth',
    value: function _correctRowHeaderWidth(width) {
      var rowHeaderWidth = width;

      if (typeof width !== 'number') {
        rowHeaderWidth = this.wot.getSetting('defaultColumnWidth');
      }
      if (this.correctHeaderWidth) {
        rowHeaderWidth += 1;
      }

      return rowHeaderWidth;
    }
  }]);

  return Table;
}();

exports.default = Table;