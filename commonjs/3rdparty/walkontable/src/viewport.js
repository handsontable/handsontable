'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _element = require('./../../../helpers/dom/element');

var _object = require('./../../../helpers/object');

var _eventManager = require('./../../../eventManager');

var _eventManager2 = _interopRequireDefault(_eventManager);

var _viewportColumns = require('./calculator/viewportColumns');

var _viewportColumns2 = _interopRequireDefault(_viewportColumns);

var _viewportRows = require('./calculator/viewportRows');

var _viewportRows2 = _interopRequireDefault(_viewportRows);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class Viewport
 */
var Viewport = function () {
  /**
   * @param wotInstance
   */
  function Viewport(wotInstance) {
    var _this = this;

    _classCallCheck(this, Viewport);

    this.wot = wotInstance;
    // legacy support
    this.instance = this.wot;

    this.oversizedRows = [];
    this.oversizedColumnHeaders = [];
    this.hasOversizedColumnHeadersMarked = {};
    this.clientHeight = 0;
    this.containerWidth = NaN;
    this.rowHeaderWidth = NaN;
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;

    this.eventManager = new _eventManager2.default(this.wot);
    this.eventManager.addEventListener(window, 'resize', function () {
      _this.clientHeight = _this.getWorkspaceHeight();
    });
  }

  /**
   * @returns {number}
   */


  _createClass(Viewport, [{
    key: 'getWorkspaceHeight',
    value: function getWorkspaceHeight() {
      var trimmingContainer = this.instance.wtOverlays.topOverlay.trimmingContainer;
      var elemHeight = void 0;
      var height = 0;

      if (trimmingContainer === window) {
        height = document.documentElement.clientHeight;
      } else {
        elemHeight = (0, _element.outerHeight)(trimmingContainer);
        // returns height without DIV scrollbar
        height = elemHeight > 0 && trimmingContainer.clientHeight > 0 ? trimmingContainer.clientHeight : Infinity;
      }

      return height;
    }
  }, {
    key: 'getWorkspaceWidth',
    value: function getWorkspaceWidth() {
      var width = void 0;
      var totalColumns = this.wot.getSetting('totalColumns');
      var trimmingContainer = this.instance.wtOverlays.leftOverlay.trimmingContainer;
      var overflow = void 0;
      var stretchSetting = this.wot.getSetting('stretchH');
      var docOffsetWidth = document.documentElement.offsetWidth;
      var preventOverflow = this.wot.getSetting('preventOverflow');

      if (preventOverflow) {
        return (0, _element.outerWidth)(this.instance.wtTable.wtRootElement);
      }

      if (this.wot.getSetting('freezeOverlays')) {
        width = Math.min(docOffsetWidth - this.getWorkspaceOffset().left, docOffsetWidth);
      } else {
        width = Math.min(this.getContainerFillWidth(), docOffsetWidth - this.getWorkspaceOffset().left, docOffsetWidth);
      }

      if (trimmingContainer === window && totalColumns > 0 && this.sumColumnWidths(0, totalColumns - 1) > width) {
        // in case sum of column widths is higher than available stylesheet width, let's assume using the whole window
        // otherwise continue below, which will allow stretching
        // this is used in `scroll_window.html`
        // TODO test me
        return document.documentElement.clientWidth;
      }

      if (trimmingContainer !== window) {
        overflow = (0, _element.getStyle)(this.instance.wtOverlays.leftOverlay.trimmingContainer, 'overflow');

        if (overflow === 'scroll' || overflow === 'hidden' || overflow === 'auto') {
          // this is used in `scroll.html`
          // TODO test me
          return Math.max(width, trimmingContainer.clientWidth);
        }
      }

      if (stretchSetting === 'none' || !stretchSetting) {
        // if no stretching is used, return the maximum used workspace width
        return Math.max(width, (0, _element.outerWidth)(this.instance.wtTable.TABLE));
      }

      // if stretching is used, return the actual container width, so the columns can fit inside it
      return width;
    }

    /**
     * Checks if viewport has vertical scroll
     *
     * @returns {Boolean}
     */

  }, {
    key: 'hasVerticalScroll',
    value: function hasVerticalScroll() {
      return this.getWorkspaceActualHeight() > this.getWorkspaceHeight();
    }

    /**
     * Checks if viewport has horizontal scroll
     *
     * @returns {Boolean}
     */

  }, {
    key: 'hasHorizontalScroll',
    value: function hasHorizontalScroll() {
      return this.getWorkspaceActualWidth() > this.getWorkspaceWidth();
    }

    /**
     * @param from
     * @param length
     * @returns {Number}
     */

  }, {
    key: 'sumColumnWidths',
    value: function sumColumnWidths(from, length) {
      var wtTable = this.wot.wtTable;
      var sum = 0;
      var column = from;

      while (column < length) {
        sum += wtTable.getColumnWidth(column);
        column += 1;
      }

      return sum;
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getContainerFillWidth',
    value: function getContainerFillWidth() {
      if (this.containerWidth) {
        return this.containerWidth;
      }

      var mainContainer = this.instance.wtTable.holder;
      var dummyElement = document.createElement('div');

      dummyElement.style.width = '100%';
      dummyElement.style.height = '1px';
      mainContainer.appendChild(dummyElement);

      var fillWidth = dummyElement.offsetWidth;

      this.containerWidth = fillWidth;
      mainContainer.removeChild(dummyElement);

      return fillWidth;
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getWorkspaceOffset',
    value: function getWorkspaceOffset() {
      return (0, _element.offset)(this.wot.wtTable.TABLE);
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getWorkspaceActualHeight',
    value: function getWorkspaceActualHeight() {
      return (0, _element.outerHeight)(this.wot.wtTable.TABLE);
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getWorkspaceActualWidth',
    value: function getWorkspaceActualWidth() {
      return (0, _element.outerWidth)(this.wot.wtTable.TABLE) || (0, _element.outerWidth)(this.wot.wtTable.TBODY) || (0, _element.outerWidth)(this.wot.wtTable.THEAD); // IE8 reports 0 as <table> offsetWidth;
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getColumnHeaderHeight',
    value: function getColumnHeaderHeight() {
      if (isNaN(this.columnHeaderHeight)) {
        this.columnHeaderHeight = (0, _element.outerHeight)(this.wot.wtTable.THEAD);
      }

      return this.columnHeaderHeight;
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getViewportHeight',
    value: function getViewportHeight() {
      var containerHeight = this.getWorkspaceHeight();

      if (containerHeight === Infinity) {
        return containerHeight;
      }

      var columnHeaderHeight = this.getColumnHeaderHeight();

      if (columnHeaderHeight > 0) {
        containerHeight -= columnHeaderHeight;
      }

      return containerHeight;
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getRowHeaderWidth',
    value: function getRowHeaderWidth() {
      var rowHeadersHeightSetting = this.instance.getSetting('rowHeaderWidth');
      var rowHeaders = this.instance.getSetting('rowHeaders');

      if (rowHeadersHeightSetting) {
        this.rowHeaderWidth = 0;

        for (var i = 0, len = rowHeaders.length; i < len; i++) {
          this.rowHeaderWidth += rowHeadersHeightSetting[i] || rowHeadersHeightSetting;
        }
      }

      if (this.wot.cloneSource) {
        return this.wot.cloneSource.wtViewport.getRowHeaderWidth();
      }

      if (isNaN(this.rowHeaderWidth)) {

        if (rowHeaders.length) {
          var TH = this.instance.wtTable.TABLE.querySelector('TH');
          this.rowHeaderWidth = 0;

          for (var _i = 0, _len = rowHeaders.length; _i < _len; _i++) {
            if (TH) {
              this.rowHeaderWidth += (0, _element.outerWidth)(TH);
              TH = TH.nextSibling;
            } else {
              // yes this is a cheat but it worked like that before, just taking assumption from CSS instead of measuring.
              // TODO: proper fix
              this.rowHeaderWidth += 50;
            }
          }
        } else {
          this.rowHeaderWidth = 0;
        }
      }

      this.rowHeaderWidth = this.instance.getSetting('onModifyRowHeaderWidth', this.rowHeaderWidth) || this.rowHeaderWidth;

      return this.rowHeaderWidth;
    }

    /**
     * @returns {Number}
     */

  }, {
    key: 'getViewportWidth',
    value: function getViewportWidth() {
      var containerWidth = this.getWorkspaceWidth();

      if (containerWidth === Infinity) {
        return containerWidth;
      }

      var rowHeaderWidth = this.getRowHeaderWidth();

      if (rowHeaderWidth > 0) {
        return containerWidth - rowHeaderWidth;
      }

      return containerWidth;
    }

    /**
     * Creates:
     *  - rowsRenderCalculator (before draw, to qualify rows for rendering)
     *  - rowsVisibleCalculator (after draw, to measure which rows are actually visible)
     *
     * @returns {ViewportRowsCalculator}
     */

  }, {
    key: 'createRowsCalculator',
    value: function createRowsCalculator() {
      var _this2 = this;

      var visible = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var height = void 0;
      var scrollbarHeight = void 0;
      var fixedRowsHeight = void 0;

      this.rowHeaderWidth = NaN;

      if (this.wot.wtSettings.settings.renderAllRows && !visible) {
        height = Infinity;
      } else {
        height = this.getViewportHeight();
      }

      var pos = this.wot.wtOverlays.topOverlay.getScrollPosition() - this.wot.wtOverlays.topOverlay.getTableParentOffset();

      if (pos < 0) {
        pos = 0;
      }

      var fixedRowsTop = this.wot.getSetting('fixedRowsTop');
      var fixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
      var totalRows = this.wot.getSetting('totalRows');

      if (fixedRowsTop) {
        fixedRowsHeight = this.wot.wtOverlays.topOverlay.sumCellSizes(0, fixedRowsTop);
        pos += fixedRowsHeight;
        height -= fixedRowsHeight;
      }

      if (fixedRowsBottom && this.wot.wtOverlays.bottomOverlay.clone) {
        fixedRowsHeight = this.wot.wtOverlays.bottomOverlay.sumCellSizes(totalRows - fixedRowsBottom, totalRows);

        height -= fixedRowsHeight;
      }

      if (this.wot.wtTable.holder.clientHeight === this.wot.wtTable.holder.offsetHeight) {
        scrollbarHeight = 0;
      } else {
        scrollbarHeight = (0, _element.getScrollbarWidth)();
      }

      return new _viewportRows2.default(height, pos, this.wot.getSetting('totalRows'), function (sourceRow) {
        return _this2.wot.wtTable.getRowHeight(sourceRow);
      }, visible ? null : this.wot.wtSettings.settings.viewportRowCalculatorOverride, visible, scrollbarHeight);
    }

    /**
     * Creates:
     *  - columnsRenderCalculator (before draw, to qualify columns for rendering)
     *  - columnsVisibleCalculator (after draw, to measure which columns are actually visible)
     *
     * @returns {ViewportRowsCalculator}
     */

  }, {
    key: 'createColumnsCalculator',
    value: function createColumnsCalculator() {
      var _this3 = this;

      var visible = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var width = this.getViewportWidth();
      var pos = this.wot.wtOverlays.leftOverlay.getScrollPosition() - this.wot.wtOverlays.leftOverlay.getTableParentOffset();

      this.columnHeaderHeight = NaN;

      if (pos < 0) {
        pos = 0;
      }

      var fixedColumnsLeft = this.wot.getSetting('fixedColumnsLeft');

      if (fixedColumnsLeft) {
        var fixedColumnsWidth = this.wot.wtOverlays.leftOverlay.sumCellSizes(0, fixedColumnsLeft);
        pos += fixedColumnsWidth;
        width -= fixedColumnsWidth;
      }
      if (this.wot.wtTable.holder.clientWidth !== this.wot.wtTable.holder.offsetWidth) {
        width -= (0, _element.getScrollbarWidth)();
      }

      return new _viewportColumns2.default(width, pos, this.wot.getSetting('totalColumns'), function (sourceCol) {
        return _this3.wot.wtTable.getColumnWidth(sourceCol);
      }, visible ? null : this.wot.wtSettings.settings.viewportColumnCalculatorOverride, visible, this.wot.getSetting('stretchH'), function (stretchedWidth, column) {
        return _this3.wot.getSetting('onBeforeStretchingColumnWidth', stretchedWidth, column);
      });
    }

    /**
     * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and
     * cols should be rendered)
     *
     * @param fastDraw {Boolean} If `true`, will try to avoid full redraw and only update the border positions.
     *                           If `false` or `undefined`, will perform a full redraw
     * @returns fastDraw {Boolean} The fastDraw value, possibly modified
     */

  }, {
    key: 'createRenderCalculators',
    value: function createRenderCalculators() {
      var fastDraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var runFastDraw = fastDraw;

      if (runFastDraw) {
        var proposedRowsVisibleCalculator = this.createRowsCalculator(true);
        var proposedColumnsVisibleCalculator = this.createColumnsCalculator(true);

        if (!(this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) && this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator))) {
          runFastDraw = false;
        }
      }

      if (!runFastDraw) {
        this.rowsRenderCalculator = this.createRowsCalculator();
        this.columnsRenderCalculator = this.createColumnsCalculator();
      }
      // delete temporarily to make sure that renderers always use rowsRenderCalculator, not rowsVisibleCalculator
      this.rowsVisibleCalculator = null;
      this.columnsVisibleCalculator = null;

      return runFastDraw;
    }

    /**
     * Creates rowsVisibleCalculator and columnsVisibleCalculator (after draw, to determine what are
     * the actually visible rows and columns)
     */

  }, {
    key: 'createVisibleCalculators',
    value: function createVisibleCalculators() {
      this.rowsVisibleCalculator = this.createRowsCalculator(true);
      this.columnsVisibleCalculator = this.createColumnsCalculator(true);
    }

    /**
     * Returns information whether proposedRowsVisibleCalculator viewport
     * is contained inside rows rendered in previous draw (cached in rowsRenderCalculator)
     *
     * @param {Object} proposedRowsVisibleCalculator
     * @returns {Boolean} Returns `true` if all proposed visible rows are already rendered (meaning: redraw is not needed).
     *                    Returns `false` if at least one proposed visible row is not already rendered (meaning: redraw is needed)
     */

  }, {
    key: 'areAllProposedVisibleRowsAlreadyRendered',
    value: function areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) {
      if (this.rowsVisibleCalculator) {
        if (proposedRowsVisibleCalculator.startRow < this.rowsRenderCalculator.startRow || proposedRowsVisibleCalculator.startRow === this.rowsRenderCalculator.startRow && proposedRowsVisibleCalculator.startRow > 0) {
          return false;
        } else if (proposedRowsVisibleCalculator.endRow > this.rowsRenderCalculator.endRow || proposedRowsVisibleCalculator.endRow === this.rowsRenderCalculator.endRow && proposedRowsVisibleCalculator.endRow < this.wot.getSetting('totalRows') - 1) {
          return false;
        }
        return true;
      }

      return false;
    }

    /**
     * Returns information whether proposedColumnsVisibleCalculator viewport
     * is contained inside column rendered in previous draw (cached in columnsRenderCalculator)
     *
     * @param {Object} proposedColumnsVisibleCalculator
     * @returns {Boolean} Returns `true` if all proposed visible columns are already rendered (meaning: redraw is not needed).
     *                    Returns `false` if at least one proposed visible column is not already rendered (meaning: redraw is needed)
     */

  }, {
    key: 'areAllProposedVisibleColumnsAlreadyRendered',
    value: function areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator) {
      if (this.columnsVisibleCalculator) {
        if (proposedColumnsVisibleCalculator.startColumn < this.columnsRenderCalculator.startColumn || proposedColumnsVisibleCalculator.startColumn === this.columnsRenderCalculator.startColumn && proposedColumnsVisibleCalculator.startColumn > 0) {
          return false;
        } else if (proposedColumnsVisibleCalculator.endColumn > this.columnsRenderCalculator.endColumn || proposedColumnsVisibleCalculator.endColumn === this.columnsRenderCalculator.endColumn && proposedColumnsVisibleCalculator.endColumn < this.wot.getSetting('totalColumns') - 1) {
          return false;
        }
        return true;
      }

      return false;
    }

    /**
     * Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.
     */

  }, {
    key: 'resetHasOversizedColumnHeadersMarked',
    value: function resetHasOversizedColumnHeadersMarked() {
      (0, _object.objectEach)(this.hasOversizedColumnHeadersMarked, function (value, key, object) {
        object[key] = void 0;
      });
    }
  }]);

  return Viewport;
}();

exports.default = Viewport;