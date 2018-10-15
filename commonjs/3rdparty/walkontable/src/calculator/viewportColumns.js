'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privatePool = new WeakMap();

/**
 * Calculates indexes of columns to render OR columns that are visible.
 * To redo the calculation, you need to create a new calculator.
 *
 * @class ViewportColumnsCalculator
 */

var ViewportColumnsCalculator = function () {
  _createClass(ViewportColumnsCalculator, null, [{
    key: 'DEFAULT_WIDTH',

    /**
     * Default column width
     *
     * @type {Number}
     */
    get: function get() {
      return 50;
    }

    /**
     * @param {Number} viewportWidth Width of the viewport
     * @param {Number} scrollOffset Current horizontal scroll position of the viewport
     * @param {Number} totalColumns Total number of rows
     * @param {Function} columnWidthFn Function that returns the width of the column at a given index (in px)
     * @param {Function} overrideFn Function that changes calculated this.startRow, this.endRow (used by MergeCells plugin)
     * @param {Boolean} onlyFullyVisible if `true`, only startRow and endRow will be indexes of rows that are fully in viewport
     * @param {Boolean} stretchH
     * @param {Function} [stretchingColumnWidthFn] Function that returns the new width of the stretched column.
     */

  }]);

  function ViewportColumnsCalculator(viewportWidth, scrollOffset, totalColumns, columnWidthFn, overrideFn, onlyFullyVisible, stretchH) {
    var stretchingColumnWidthFn = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : function (width) {
      return width;
    };

    _classCallCheck(this, ViewportColumnsCalculator);

    privatePool.set(this, {
      viewportWidth: viewportWidth,
      scrollOffset: scrollOffset,
      totalColumns: totalColumns,
      columnWidthFn: columnWidthFn,
      overrideFn: overrideFn,
      onlyFullyVisible: onlyFullyVisible,
      stretchingColumnWidthFn: stretchingColumnWidthFn
    });

    /**
     * Number of rendered/visible columns
     *
     * @type {Number}
     */
    this.count = 0;

    /**
     * Index of the first rendered/visible column (can be overwritten using overrideFn)
     *
     * @type {Number|null}
     */
    this.startColumn = null;

    /**
     * Index of the last rendered/visible column (can be overwritten using overrideFn)
     *
     * @type {null}
     */
    this.endColumn = null;

    /**
     * Position of the first rendered/visible column (in px)
     *
     * @type {Number|null}
     */
    this.startPosition = null;

    this.stretchAllRatio = 0;
    this.stretchLastWidth = 0;
    this.stretch = stretchH;
    this.totalTargetWidth = 0;
    this.needVerifyLastColumnWidth = true;
    this.stretchAllColumnsWidth = [];

    this.calculate();
  }

  /**
   * Calculates viewport
   */


  _createClass(ViewportColumnsCalculator, [{
    key: 'calculate',
    value: function calculate() {
      var sum = 0;
      var needReverse = true;
      var startPositions = [];
      var columnWidth = void 0;

      var priv = privatePool.get(this);
      var onlyFullyVisible = priv.onlyFullyVisible;
      var overrideFn = priv.overrideFn;
      var scrollOffset = priv.scrollOffset;
      var totalColumns = priv.totalColumns;
      var viewportWidth = priv.viewportWidth;

      for (var i = 0; i < totalColumns; i++) {
        columnWidth = this._getColumnWidth(i);

        if (sum <= scrollOffset && !onlyFullyVisible) {
          this.startColumn = i;
        }

        // +1 pixel for row header width compensation for horizontal scroll > 0
        var compensatedViewportWidth = scrollOffset > 0 ? viewportWidth + 1 : viewportWidth;

        if (sum >= scrollOffset && sum + columnWidth <= scrollOffset + compensatedViewportWidth) {
          if (this.startColumn === null || this.startColumn === void 0) {
            this.startColumn = i;
          }
          this.endColumn = i;
        }
        startPositions.push(sum);
        sum += columnWidth;

        if (!onlyFullyVisible) {
          this.endColumn = i;
        }
        if (sum >= scrollOffset + viewportWidth) {
          needReverse = false;
          break;
        }
      }

      if (this.endColumn === totalColumns - 1 && needReverse) {
        this.startColumn = this.endColumn;

        while (this.startColumn > 0) {
          var viewportSum = startPositions[this.endColumn] + columnWidth - startPositions[this.startColumn - 1];

          if (viewportSum <= viewportWidth || !onlyFullyVisible) {
            this.startColumn -= 1;
          }
          if (viewportSum > viewportWidth) {
            break;
          }
        }
      }

      if (this.startColumn !== null && overrideFn) {
        overrideFn(this);
      }
      this.startPosition = startPositions[this.startColumn];

      if (this.startPosition === void 0) {
        this.startPosition = null;
      }
      if (this.startColumn !== null) {
        this.count = this.endColumn - this.startColumn + 1;
      }
    }

    /**
     * Recalculate columns stretching.
     *
     * @param {Number} totalWidth
     */

  }, {
    key: 'refreshStretching',
    value: function refreshStretching(totalWidth) {
      if (this.stretch === 'none') {
        return;
      }
      var totalColumnsWidth = totalWidth;
      this.totalTargetWidth = totalColumnsWidth;

      var priv = privatePool.get(this);
      var totalColumns = priv.totalColumns;
      var sumAll = 0;

      for (var i = 0; i < totalColumns; i++) {
        var columnWidth = this._getColumnWidth(i);
        var permanentColumnWidth = priv.stretchingColumnWidthFn(void 0, i);

        if (typeof permanentColumnWidth === 'number') {
          totalColumnsWidth -= permanentColumnWidth;
        } else {
          sumAll += columnWidth;
        }
      }
      var remainingSize = totalColumnsWidth - sumAll;

      if (this.stretch === 'all' && remainingSize > 0) {
        this.stretchAllRatio = totalColumnsWidth / sumAll;
        this.stretchAllColumnsWidth = [];
        this.needVerifyLastColumnWidth = true;
      } else if (this.stretch === 'last' && totalColumnsWidth !== Infinity) {
        var _columnWidth = this._getColumnWidth(totalColumns - 1);
        var lastColumnWidth = remainingSize + _columnWidth;

        this.stretchLastWidth = lastColumnWidth >= 0 ? lastColumnWidth : _columnWidth;
      }
    }

    /**
     * Get stretched column width based on stretchH (all or last) setting passed in handsontable instance.
     *
     * @param {Number} column
     * @param {Number} baseWidth
     * @returns {Number|null}
     */

  }, {
    key: 'getStretchedColumnWidth',
    value: function getStretchedColumnWidth(column, baseWidth) {
      var result = null;

      if (this.stretch === 'all' && this.stretchAllRatio !== 0) {
        result = this._getStretchedAllColumnWidth(column, baseWidth);
      } else if (this.stretch === 'last' && this.stretchLastWidth !== 0) {
        result = this._getStretchedLastColumnWidth(column);
      }

      return result;
    }

    /**
     * @param {Number} column
     * @param {Number} baseWidth
     * @returns {Number}
     * @private
     */

  }, {
    key: '_getStretchedAllColumnWidth',
    value: function _getStretchedAllColumnWidth(column, baseWidth) {
      var sumRatioWidth = 0;
      var priv = privatePool.get(this);
      var totalColumns = priv.totalColumns;

      if (!this.stretchAllColumnsWidth[column]) {
        var stretchedWidth = Math.round(baseWidth * this.stretchAllRatio);
        var newStretchedWidth = priv.stretchingColumnWidthFn(stretchedWidth, column);

        if (newStretchedWidth === void 0) {
          this.stretchAllColumnsWidth[column] = stretchedWidth;
        } else {
          this.stretchAllColumnsWidth[column] = isNaN(newStretchedWidth) ? this._getColumnWidth(column) : newStretchedWidth;
        }
      }

      if (this.stretchAllColumnsWidth.length === totalColumns && this.needVerifyLastColumnWidth) {
        this.needVerifyLastColumnWidth = false;

        for (var i = 0; i < this.stretchAllColumnsWidth.length; i++) {
          sumRatioWidth += this.stretchAllColumnsWidth[i];
        }
        if (sumRatioWidth !== this.totalTargetWidth) {
          this.stretchAllColumnsWidth[this.stretchAllColumnsWidth.length - 1] += this.totalTargetWidth - sumRatioWidth;
        }
      }

      return this.stretchAllColumnsWidth[column];
    }

    /**
     * @param {Number} column
     * @returns {Number|null}
     * @private
     */

  }, {
    key: '_getStretchedLastColumnWidth',
    value: function _getStretchedLastColumnWidth(column) {
      var priv = privatePool.get(this);
      var totalColumns = priv.totalColumns;

      if (column === totalColumns - 1) {
        return this.stretchLastWidth;
      }

      return null;
    }

    /**
     * @param {Number} column Column index.
     * @returns {Number}
     * @private
     */

  }, {
    key: '_getColumnWidth',
    value: function _getColumnWidth(column) {
      var width = privatePool.get(this).columnWidthFn(column);

      if (isNaN(width)) {
        width = ViewportColumnsCalculator.DEFAULT_WIDTH;
      }

      return width;
    }
  }]);

  return ViewportColumnsCalculator;
}();

exports.default = ViewportColumnsCalculator;