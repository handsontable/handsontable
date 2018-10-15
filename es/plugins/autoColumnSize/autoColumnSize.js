var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BasePlugin from './../_base';
import { arrayEach, arrayFilter, arrayReduce, arrayMap } from './../../helpers/array';
import { cancelAnimationFrame, requestAnimationFrame } from './../../helpers/feature';
import { isVisible } from './../../helpers/dom/element';
import GhostTable from './../../utils/ghostTable';
import { isObject, hasOwnProperty } from './../../helpers/object';
import { valueAccordingPercent, rangeEach } from './../../helpers/number';
import { registerPlugin } from './../../plugins';
import SamplesGenerator from './../../utils/samplesGenerator';
import { isPercentValue } from './../../helpers/string';
import { ViewportColumnsCalculator } from './../../3rdparty/walkontable/src';

var privatePool = new WeakMap();

/**
 * @plugin AutoColumnSize
 *
 * @description
 * This plugin allows to set column widths based on their widest cells.
 *
 * By default, the plugin is declared as `undefined`, which makes it enabled (same as if it was declared as `true`).
 * Enabling this plugin may decrease the overall table performance, as it needs to calculate the widths of all cells to
 * resize the columns accordingly.
 * If you experience problems with the performance, try turning this feature off and declaring the column widths manually.
 *
 * Column width calculations are divided into sync and async part. Each of this parts has their own advantages and
 * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
 * operations don't block the browser UI.
 *
 * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value to a config object:
 * ```js
 * // as a number (300 columns in sync, rest async)
 * autoColumnSize: {syncLimit: 300},
 *
 * // as a string (percent)
 * autoColumnSize: {syncLimit: '40%'},
 * ```
 *
 * To configure this plugin see {@link Options#autoColumnSize}.
 *
 * @example
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   autoColumnSize: true
 * });
 * // Access to plugin instance:
 * const plugin = hot.getPlugin('autoColumnSize');
 *
 * plugin.getColumnWidth(4);
 *
 * if (plugin.isEnabled()) {
 *   // code...
 * }
 * ```
 */

var AutoColumnSize = function (_BasePlugin) {
  _inherits(AutoColumnSize, _BasePlugin);

  _createClass(AutoColumnSize, null, [{
    key: 'CALCULATION_STEP',
    get: function get() {
      return 50;
    }
  }, {
    key: 'SYNC_CALCULATION_LIMIT',
    get: function get() {
      return 50;
    }
  }]);

  function AutoColumnSize(hotInstance) {
    _classCallCheck(this, AutoColumnSize);

    var _this = _possibleConstructorReturn(this, (AutoColumnSize.__proto__ || Object.getPrototypeOf(AutoColumnSize)).call(this, hotInstance));

    privatePool.set(_this, {
      /**
       * Cached column header names. It is used to diff current column headers with previous state and detect which
       * columns width should be updated.
       *
       * @private
       * @type {Array}
       */
      cachedColumnHeaders: []
    });
    /**
     * Cached columns widths.
     *
     * @type {Number[]}
     */
    _this.widths = [];
    /**
     * Instance of {@link GhostTable} for rows and columns size calculations.
     *
     * @private
     * @type {GhostTable}
     */
    _this.ghostTable = new GhostTable(_this.hot);
    /**
     * Instance of {@link SamplesGenerator} for generating samples necessary for columns width calculations.
     *
     * @private
     * @type {SamplesGenerator}
     */
    _this.samplesGenerator = new SamplesGenerator(function (row, column) {
      var cellMeta = _this.hot.getCellMeta(row, column);
      var cellValue = '';

      if (!cellMeta.spanned) {
        cellValue = _this.hot.getDataAtCell(row, column);
      }

      var bundleCountSeed = 0;

      if (cellMeta.label) {
        var _cellMeta$label = cellMeta.label,
            labelValue = _cellMeta$label.value,
            labelProperty = _cellMeta$label.property;

        var labelText = '';

        if (labelValue) {
          labelText = typeof labelValue === 'function' ? labelValue(row, column, _this.hot.colToProp(column), cellValue) : labelValue;
        } else if (labelProperty) {
          labelText = _this.hot.getDataAtRowProp(row, labelProperty);
        }

        bundleCountSeed = labelText.length;
      }

      return { value: cellValue, bundleCountSeed: bundleCountSeed };
    });
    /**
     * `true` only if the first calculation was performed
     *
     * @private
     * @type {Boolean}
     */
    _this.firstCalculation = true;
    /**
     * `true` if the size calculation is in progress.
     *
     * @type {Boolean}
     */
    _this.inProgress = false;

    // moved to constructor to allow auto-sizing the columns when the plugin is disabled
    _this.addHook('beforeColumnResize', function (col, size, isDblClick) {
      return _this.onBeforeColumnResize(col, size, isDblClick);
    });
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link AutoColumnSize#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(AutoColumnSize, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return this.hot.getSettings().autoColumnSize !== false && !this.hot.getSettings().colWidths;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }

      var setting = this.hot.getSettings().autoColumnSize;

      if (setting && setting.useHeaders !== null && setting.useHeaders !== void 0) {
        this.ghostTable.setSetting('useHeaders', setting.useHeaders);
      }

      this.setSamplingOptions();

      this.addHook('afterLoadData', function () {
        return _this2.onAfterLoadData();
      });
      this.addHook('beforeChange', function (changes) {
        return _this2.onBeforeChange(changes);
      });

      this.addHook('beforeRender', function (force) {
        return _this2.onBeforeRender(force);
      });
      this.addHook('modifyColWidth', function (width, col) {
        return _this2.getColumnWidth(col, width);
      });
      this.addHook('afterInit', function () {
        return _this2.onAfterInit();
      });
      _get(AutoColumnSize.prototype.__proto__ || Object.getPrototypeOf(AutoColumnSize.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      var changedColumns = this.findColumnsWhereHeaderWasChanged();

      if (changedColumns.length) {
        this.clearCache(changedColumns);
      }
      _get(AutoColumnSize.prototype.__proto__ || Object.getPrototypeOf(AutoColumnSize.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      _get(AutoColumnSize.prototype.__proto__ || Object.getPrototypeOf(AutoColumnSize.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Calculates a columns width.
     *
     * @param {Number|Object} colRange Column index or an object with `from` and `to` indexes as a range.
     * @param {Number|Object} rowRange Row index or an object with `from` and `to` indexes as a range.
     * @param {Boolean} [force=false] If `true` the calculation will be processed regardless of whether the width exists in the cache.
     */

  }, {
    key: 'calculateColumnsWidth',
    value: function calculateColumnsWidth() {
      var colRange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { from: 0, to: this.hot.countCols() - 1 };

      var _this3 = this;

      var rowRange = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { from: 0, to: this.hot.countRows() - 1 };
      var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var columnsRange = typeof colRange === 'number' ? { from: colRange, to: colRange } : colRange;
      var rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;

      rangeEach(columnsRange.from, columnsRange.to, function (col) {
        if (force || _this3.widths[col] === void 0 && !_this3.hot._getColWidthFromSettings(col)) {
          var samples = _this3.samplesGenerator.generateColumnSamples(col, rowsRange);

          arrayEach(samples, function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                column = _ref2[0],
                sample = _ref2[1];

            return _this3.ghostTable.addColumn(column, sample);
          });
        }
      });

      if (this.ghostTable.columns.length) {
        this.ghostTable.getWidths(function (col, width) {
          _this3.widths[col] = width;
        });
        this.ghostTable.clean();
      }
    }

    /**
     * Calculates all columns width. The calculated column will be cached in the {@link AutoColumnSize#widths} property.
     * To retrieve width for specyfied column use {@link AutoColumnSize#getColumnWidth} method.
     *
     * @param {Object|Number} rowRange Row index or an object with `from` and `to` properties which define row range.
     */

  }, {
    key: 'calculateAllColumnsWidth',
    value: function calculateAllColumnsWidth() {
      var _this4 = this;

      var rowRange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { from: 0, to: this.hot.countRows() - 1 };

      var current = 0;
      var length = this.hot.countCols() - 1;
      var timer = null;

      this.inProgress = true;

      var loop = function loop() {
        // When hot was destroyed after calculating finished cancel frame
        if (!_this4.hot) {
          cancelAnimationFrame(timer);
          _this4.inProgress = false;

          return;
        }

        _this4.calculateColumnsWidth({
          from: current,
          to: Math.min(current + AutoColumnSize.CALCULATION_STEP, length)
        }, rowRange);

        current = current + AutoColumnSize.CALCULATION_STEP + 1;

        if (current < length) {
          timer = requestAnimationFrame(loop);
        } else {
          cancelAnimationFrame(timer);
          _this4.inProgress = false;

          // @TODO Should call once per render cycle, currently fired separately in different plugins
          _this4.hot.view.wt.wtOverlays.adjustElementsSize(true);
          // tmp
          if (_this4.hot.view.wt.wtOverlays.leftOverlay.needFullRender) {
            _this4.hot.view.wt.wtOverlays.leftOverlay.clone.draw();
          }
        }
      };
      // sync
      if (this.firstCalculation && this.getSyncCalculationLimit()) {
        this.calculateColumnsWidth({ from: 0, to: this.getSyncCalculationLimit() }, rowRange);
        this.firstCalculation = false;
        current = this.getSyncCalculationLimit() + 1;
      }
      // async
      if (current < length) {
        loop();
      } else {
        this.inProgress = false;
      }
    }

    /**
     * Sets the sampling options.
     *
     * @private
     */

  }, {
    key: 'setSamplingOptions',
    value: function setSamplingOptions() {
      var setting = this.hot.getSettings().autoColumnSize;
      var samplingRatio = setting && hasOwnProperty(setting, 'samplingRatio') ? this.hot.getSettings().autoColumnSize.samplingRatio : void 0;
      var allowSampleDuplicates = setting && hasOwnProperty(setting, 'allowSampleDuplicates') ? this.hot.getSettings().autoColumnSize.allowSampleDuplicates : void 0;

      if (samplingRatio && !isNaN(samplingRatio)) {
        this.samplesGenerator.setSampleCount(parseInt(samplingRatio, 10));
      }

      if (allowSampleDuplicates) {
        this.samplesGenerator.setAllowDuplicates(allowSampleDuplicates);
      }
    }

    /**
     * Recalculates all columns width (overwrite cache values).
     */

  }, {
    key: 'recalculateAllColumnsWidth',
    value: function recalculateAllColumnsWidth() {
      if (this.hot.view && isVisible(this.hot.view.wt.wtTable.TABLE)) {
        this.clearCache();
        this.calculateAllColumnsWidth();
      }
    }

    /**
     * Gets value which tells how many columns should be calculated synchronously (rest of the columns will be calculated
     * asynchronously). The limit is calculated based on `syncLimit` set to `autoColumnSize` option (see {@link Options#autoColumnSize}).
     *
     * @returns {Number}
     */

  }, {
    key: 'getSyncCalculationLimit',
    value: function getSyncCalculationLimit() {
      /* eslint-disable no-bitwise */
      var limit = AutoColumnSize.SYNC_CALCULATION_LIMIT;
      var colsLimit = this.hot.countCols() - 1;

      if (isObject(this.hot.getSettings().autoColumnSize)) {
        limit = this.hot.getSettings().autoColumnSize.syncLimit;

        if (isPercentValue(limit)) {
          limit = valueAccordingPercent(colsLimit, limit);
        } else {
          // Force to Number
          limit >>= 0;
        }
      }

      return Math.min(limit, colsLimit);
    }

    /**
     * Gets the calculated column width.
     *
     * @param {Number} column Column index.
     * @param {Number} [defaultWidth] Default column width. It will be picked up if no calculated width found.
     * @param {Boolean} [keepMinimum=true] If `true` then returned value won't be smaller then 50 (default column width).
     * @returns {Number}
     */

  }, {
    key: 'getColumnWidth',
    value: function getColumnWidth(column) {
      var defaultWidth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : void 0;
      var keepMinimum = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      var width = defaultWidth;

      if (width === void 0) {
        width = this.widths[column];

        if (keepMinimum && typeof width === 'number') {
          width = Math.max(width, ViewportColumnsCalculator.DEFAULT_WIDTH);
        }
      }

      return width;
    }

    /**
     * Gets the first visible column.
     *
     * @returns {Number} Returns column index or -1 if table is not rendered.
     */

  }, {
    key: 'getFirstVisibleColumn',
    value: function getFirstVisibleColumn() {
      var wot = this.hot.view.wt;

      if (wot.wtViewport.columnsVisibleCalculator) {
        return wot.wtTable.getFirstVisibleColumn();
      }
      if (wot.wtViewport.columnsRenderCalculator) {
        return wot.wtTable.getFirstRenderedColumn();
      }

      return -1;
    }

    /**
     * Gets the last visible column.
     *
     * @returns {Number} Returns column index or -1 if table is not rendered.
     */

  }, {
    key: 'getLastVisibleColumn',
    value: function getLastVisibleColumn() {
      var wot = this.hot.view.wt;

      if (wot.wtViewport.columnsVisibleCalculator) {
        return wot.wtTable.getLastVisibleColumn();
      }
      if (wot.wtViewport.columnsRenderCalculator) {
        return wot.wtTable.getLastRenderedColumn();
      }

      return -1;
    }

    /**
     * Collects all columns which titles has been changed in comparison to the previous state.
     *
     * @private
     * @returns {Array} It returns an array of physical column indexes.
     */

  }, {
    key: 'findColumnsWhereHeaderWasChanged',
    value: function findColumnsWhereHeaderWasChanged() {
      var columnHeaders = this.hot.getColHeader();

      var _privatePool$get = privatePool.get(this),
          cachedColumnHeaders = _privatePool$get.cachedColumnHeaders;

      var changedColumns = arrayReduce(columnHeaders, function (acc, columnTitle, physicalColumn) {
        var cachedColumnsLength = cachedColumnHeaders.length;

        if (cachedColumnsLength - 1 < physicalColumn || cachedColumnHeaders[physicalColumn] !== columnTitle) {
          acc.push(physicalColumn);
        }
        if (cachedColumnsLength - 1 < physicalColumn) {
          cachedColumnHeaders.push(columnTitle);
        } else {
          cachedColumnHeaders[physicalColumn] = columnTitle;
        }

        return acc;
      }, []);

      return changedColumns;
    }

    /**
     * Clears cache of calculated column widths. If you want to clear only selected columns pass an array with their indexes.
     * Otherwise whole cache will be cleared.
     *
     * @param {Number[]} [columns] List of physical column indexes to clear.
     */

  }, {
    key: 'clearCache',
    value: function clearCache() {
      var _this5 = this;

      var columns = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      if (columns.length) {
        arrayEach(columns, function (physicalIndex) {
          _this5.widths[physicalIndex] = void 0;
        });
      } else {
        this.widths.length = 0;
      }
    }

    /**
     * Checks if all widths were calculated. If not then return `true` (need recalculate).
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isNeedRecalculate',
    value: function isNeedRecalculate() {
      return !!arrayFilter(this.widths, function (item) {
        return item === void 0;
      }).length;
    }

    /**
     * On before render listener.
     *
     * @private
     */

  }, {
    key: 'onBeforeRender',
    value: function onBeforeRender() {
      var force = this.hot.renderCall;
      var rowsCount = this.hot.countRows();

      // Keep last column widths unchanged for situation when all rows was deleted or trimmed (pro #6)
      if (!rowsCount) {
        return;
      }

      this.calculateColumnsWidth({ from: this.getFirstVisibleColumn(), to: this.getLastVisibleColumn() }, void 0, force);

      if (this.isNeedRecalculate() && !this.inProgress) {
        this.calculateAllColumnsWidth();
      }
    }

    /**
     * On after load data listener.
     *
     * @private
     */

  }, {
    key: 'onAfterLoadData',
    value: function onAfterLoadData() {
      var _this6 = this;

      if (this.hot.view) {
        this.recalculateAllColumnsWidth();
      } else {
        // first load - initialization
        setTimeout(function () {
          if (_this6.hot) {
            _this6.recalculateAllColumnsWidth();
          }
        }, 0);
      }
    }

    /**
     * On before change listener.
     *
     * @private
     * @param {Array} changes
     */

  }, {
    key: 'onBeforeChange',
    value: function onBeforeChange(changes) {
      var _this7 = this;

      var changedColumns = arrayMap(changes, function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            column = _ref4[1];

        return _this7.hot.propToCol(column);
      });

      this.clearCache(changedColumns);
    }

    /**
     * On before column resize listener.
     *
     * @private
     * @param {Number} col
     * @param {Number} size
     * @param {Boolean} isDblClick
     * @returns {Number}
     */

  }, {
    key: 'onBeforeColumnResize',
    value: function onBeforeColumnResize(col, size, isDblClick) {
      var newSize = size;

      if (isDblClick) {
        this.calculateColumnsWidth(col, void 0, true);

        newSize = this.getColumnWidth(col, void 0, false);
      }

      return newSize;
    }

    /**
     * On after Handsontable init fill plugin with all necessary values.
     *
     * @private
     */

  }, {
    key: 'onAfterInit',
    value: function onAfterInit() {
      privatePool.get(this).cachedColumnHeaders = this.hot.getColHeader();
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.ghostTable.clean();
      _get(AutoColumnSize.prototype.__proto__ || Object.getPrototypeOf(AutoColumnSize.prototype), 'destroy', this).call(this);
    }
  }]);

  return AutoColumnSize;
}(BasePlugin);

registerPlugin('autoColumnSize', AutoColumnSize);

export default AutoColumnSize;