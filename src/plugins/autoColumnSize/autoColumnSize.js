import BasePlugin from './../_base';
import { arrayEach, arrayFilter, arrayReduce, arrayMap } from './../../helpers/array';
import { cancelAnimationFrame, requestAnimationFrame } from './../../helpers/feature';
import GhostTable from './../../utils/ghostTable';
import { isObject, hasOwnProperty } from './../../helpers/object';
import { valueAccordingPercent, rangeEach } from './../../helpers/number';
import { registerPlugin } from './../../plugins';
import SamplesGenerator from './../../utils/samplesGenerator';
import { isPercentValue } from './../../helpers/string';
import { ViewportColumnsCalculator } from './../../3rdparty/walkontable/src';

const privatePool = new WeakMap();

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
class AutoColumnSize extends BasePlugin {
  static get CALCULATION_STEP() {
    return 50;
  }

  static get SYNC_CALCULATION_LIMIT() {
    return 50;
  }

  constructor(hotInstance) {
    super(hotInstance);
    privatePool.set(this, {
      /**
       * Cached column header names. It is used to diff current column headers with previous state and detect which
       * columns width should be updated.
       *
       * @private
       * @type {Array}
       */
      cachedColumnHeaders: [],
    });
    /**
     * Cached columns widths.
     *
     * @type {Number[]}
     */
    this.widths = [];
    /**
     * Instance of {@link GhostTable} for rows and columns size calculations.
     *
     * @private
     * @type {GhostTable}
     */
    this.ghostTable = new GhostTable(this.hot);
    /**
     * Instance of {@link SamplesGenerator} for generating samples necessary for columns width calculations.
     *
     * @private
     * @type {SamplesGenerator}
     */
    this.samplesGenerator = new SamplesGenerator((row, column) => {
      const cellMeta = this.hot.getCellMeta(row, column);
      let cellValue = '';

      if (!cellMeta.spanned) {
        cellValue = this.hot.getDataAtCell(row, column);
      }

      let bundleCountSeed = 0;

      if (cellMeta.label) {
        const { value: labelValue, property: labelProperty } = cellMeta.label;
        let labelText = '';

        if (labelValue) {
          labelText = typeof labelValue === 'function' ? labelValue(row, column, this.hot.colToProp(column), cellValue) : labelValue;

        } else if (labelProperty) {
          const labelData = this.hot.getDataAtRowProp(row, labelProperty);
          labelText = labelData !== null ? labelData : '';
        }

        bundleCountSeed = labelText.length;
      }

      return { value: cellValue, bundleCountSeed };
    });
    /**
     * `true` only if the first calculation was performed
     *
     * @private
     * @type {Boolean}
     */
    this.firstCalculation = true;
    /**
     * `true` if the size calculation is in progress.
     *
     * @type {Boolean}
     */
    this.inProgress = false;

    // moved to constructor to allow auto-sizing the columns when the plugin is disabled
    this.addHook('beforeColumnResize', (col, size, isDblClick) => this.onBeforeColumnResize(col, size, isDblClick));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link AutoColumnSize#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().autoColumnSize !== false && !this.hot.getSettings().colWidths;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const setting = this.hot.getSettings().autoColumnSize;

    if (setting && setting.useHeaders !== null && setting.useHeaders !== void 0) {
      this.ghostTable.setSetting('useHeaders', setting.useHeaders);
    }

    this.setSamplingOptions();

    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('beforeChange', changes => this.onBeforeChange(changes));
    this.addHook('beforeRender', force => this.onBeforeRender(force));
    this.addHook('modifyColWidth', (width, col) => this.getColumnWidth(col, width));
    this.addHook('afterInit', () => this.onAfterInit());
    super.enablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    const changedColumns = this.findColumnsWhereHeaderWasChanged();

    if (changedColumns.length) {
      this.clearCache(changedColumns);
    }
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Calculates a columns width.
   *
   * @param {Number|Object} colRange Column index or an object with `from` and `to` indexes as a range.
   * @param {Number|Object} rowRange Row index or an object with `from` and `to` indexes as a range.
   * @param {Boolean} [force=false] If `true` the calculation will be processed regardless of whether the width exists in the cache.
   */
  calculateColumnsWidth(colRange = { from: 0, to: this.hot.countCols() - 1 }, rowRange = { from: 0, to: this.hot.countRows() - 1 }, force = false) {
    const columnsRange = typeof colRange === 'number' ? { from: colRange, to: colRange } : colRange;
    const rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;

    rangeEach(columnsRange.from, columnsRange.to, (col) => {
      if (force || (this.widths[col] === void 0 && !this.hot._getColWidthFromSettings(col))) {
        const samples = this.samplesGenerator.generateColumnSamples(col, rowsRange);

        arrayEach(samples, ([column, sample]) => this.ghostTable.addColumn(column, sample));
      }
    });

    if (this.ghostTable.columns.length) {
      this.ghostTable.getWidths((col, width) => {
        this.widths[col] = width;
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
  calculateAllColumnsWidth(rowRange = { from: 0, to: this.hot.countRows() - 1 }) {
    let current = 0;
    const length = this.hot.countCols() - 1;
    let timer = null;

    this.inProgress = true;

    const loop = () => {
      // When hot was destroyed after calculating finished cancel frame
      if (!this.hot) {
        cancelAnimationFrame(timer);
        this.inProgress = false;

        return;
      }

      this.calculateColumnsWidth({
        from: current,
        to: Math.min(current + AutoColumnSize.CALCULATION_STEP, length)
      }, rowRange);

      current = current + AutoColumnSize.CALCULATION_STEP + 1;

      if (current < length) {
        timer = requestAnimationFrame(loop);

      } else {
        cancelAnimationFrame(timer);
        this.inProgress = false;

        // @TODO Should call once per render cycle, currently fired separately in different plugins
        this.hot.view.wt.wtOverlays.adjustElementsSize();
      }
    };

    const syncLimit = this.getSyncCalculationLimit();

    // sync
    if (this.firstCalculation && syncLimit >= 0) {
      this.calculateColumnsWidth({ from: 0, to: syncLimit }, rowRange);
      this.firstCalculation = false;
      current = syncLimit + 1;
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
  setSamplingOptions() {
    const setting = this.hot.getSettings().autoColumnSize;
    const samplingRatio = setting && hasOwnProperty(setting, 'samplingRatio') ? this.hot.getSettings().autoColumnSize.samplingRatio : void 0;
    const allowSampleDuplicates = setting && hasOwnProperty(setting, 'allowSampleDuplicates') ? this.hot.getSettings().autoColumnSize.allowSampleDuplicates : void 0;

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
  recalculateAllColumnsWidth() {
    if (this.hot.view && this.hot.view.wt.wtTable.isVisible()) {
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
  getSyncCalculationLimit() {
    /* eslint-disable no-bitwise */
    let limit = AutoColumnSize.SYNC_CALCULATION_LIMIT;
    const colsLimit = this.hot.countCols() - 1;

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
  getColumnWidth(column, defaultWidth = void 0, keepMinimum = true) {
    let width = defaultWidth;

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
   * @returns {Number} Returns column index, -1 if table is not rendered or if there are no columns to base the the calculations on.
   */
  getFirstVisibleColumn() {
    const wot = this.hot.view.wt;

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
  getLastVisibleColumn() {
    const wot = this.hot.view.wt;

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
  findColumnsWhereHeaderWasChanged() {
    const columnHeaders = this.hot.getColHeader();
    const { cachedColumnHeaders } = privatePool.get(this);

    const changedColumns = arrayReduce(columnHeaders, (acc, columnTitle, physicalColumn) => {
      const cachedColumnsLength = cachedColumnHeaders.length;

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
  clearCache(columns = []) {
    if (columns.length) {
      arrayEach(columns, (physicalIndex) => {
        this.widths[physicalIndex] = void 0;
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
  isNeedRecalculate() {
    return !!arrayFilter(this.widths, item => (item === void 0)).length;
  }

  /**
   * On before render listener.
   *
   * @private
   */
  onBeforeRender() {
    const force = this.hot.renderCall;
    const rowsCount = this.hot.countRows();
    const firstVisibleColumn = this.getFirstVisibleColumn();
    const lastVisibleColumn = this.getLastVisibleColumn();

    if (firstVisibleColumn === -1 || lastVisibleColumn === -1) {
      return;
    }

    // Keep last column widths unchanged for situation when all rows was deleted or trimmed (pro #6)
    if (!rowsCount) {
      return;
    }

    this.calculateColumnsWidth({ from: firstVisibleColumn, to: lastVisibleColumn }, void 0, force);

    if (this.isNeedRecalculate() && !this.inProgress) {
      this.calculateAllColumnsWidth();
    }
  }

  /**
   * On after load data listener.
   *
   * @private
   */
  onAfterLoadData() {
    if (this.hot.view) {
      this.recalculateAllColumnsWidth();
    } else {
      // first load - initialization
      setTimeout(() => {
        if (this.hot) {
          this.recalculateAllColumnsWidth();
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
  onBeforeChange(changes) {
    const changedColumns = arrayMap(changes, ([, column]) => this.hot.propToCol(column));

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
  onBeforeColumnResize(col, size, isDblClick) {
    let newSize = size;

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
  onAfterInit() {
    privatePool.get(this).cachedColumnHeaders = this.hot.getColHeader();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}

registerPlugin('autoColumnSize', AutoColumnSize);

export default AutoColumnSize;
