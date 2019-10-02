import BasePlugin from './../_base';
import { arrayEach, arrayFilter } from './../../helpers/array';
import { cancelAnimationFrame, requestAnimationFrame } from './../../helpers/feature';
import { isVisible } from './../../helpers/dom/element';
import GhostTable from './../../utils/ghostTable';
import { isObject, hasOwnProperty } from './../../helpers/object';
import { valueAccordingPercent, rangeEach } from './../../helpers/number';
import { registerPlugin } from './../../plugins';
import SamplesGenerator from './../../utils/samplesGenerator';
import { isPercentValue } from './../../helpers/string';

/**
 * @plugin AutoRowSize
 *
 * @description
 * This plugin allows to set row heights based on their highest cells.
 *
 * By default, the plugin is declared as `undefined`, which makes it disabled (same as if it was declared as `false`).
 * Enabling this plugin may decrease the overall table performance, as it needs to calculate the heights of all cells to
 * resize the rows accordingly.
 * If you experience problems with the performance, try turning this feature off and declaring the row heights manually.
 *
 * Row height calculations are divided into sync and async part. Each of this parts has their own advantages and
 * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
 * operations don't block the browser UI.
 *
 * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value to a config object:
 * ```js
 * // as a number (300 columns in sync, rest async)
 * autoRowSize: {syncLimit: 300},
 *
 * // as a string (percent)
 * autoRowSize: {syncLimit: '40%'},
 *
 * // allow sample duplication
 * autoRowSize: {syncLimit: '40%', allowSampleDuplicates: true},
 * ```
 *
 * You can also use the `allowSampleDuplicates` option to allow sampling duplicate values when calculating the row
 * height. __Note__, that this might have a negative impact on performance.
 *
 * To configure this plugin see {@link Options#autoRowSize}.
 *
 * @example
 *
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   autoRowSize: true
 * });
 * // Access to plugin instance:
 * const plugin = hot.getPlugin('autoRowSize');
 *
 * plugin.getRowHeight(4);
 *
 * if (plugin.isEnabled()) {
 *   // code...
 * }
 * ```
 */
class AutoRowSize extends BasePlugin {
  static get CALCULATION_STEP() {
    return 50;
  }

  static get SYNC_CALCULATION_LIMIT() {
    return 500;
  }

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Cached rows heights.
     *
     * @type {Number[]}
     */
    this.heights = [];
    /**
     * Instance of {@link GhostTable} for rows and columns size calculations.
     *
     * @private
     * @type {GhostTable}
     */
    this.ghostTable = new GhostTable(this.hot);
    /**
     * Instance of {@link SamplesGenerator} for generating samples necessary for rows height calculations.
     *
     * @private
     * @type {SamplesGenerator}
     */
    this.samplesGenerator = new SamplesGenerator((row, col) => {
      let cellValue;

      if (row >= 0) {
        cellValue = this.hot.getDataAtCell(row, col);

      } else if (row === -1) {
        cellValue = this.hot.getColHeader(col);
      }

      return { value: cellValue };
    });
    /**
     * `true` if only the first calculation was performed.
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

    // moved to constructor to allow auto-sizing the rows when the plugin is disabled
    this.addHook('beforeRowResize', (row, size, isDblClick) => this.onBeforeRowResize(row, size, isDblClick));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link AutoRowSize#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().autoRowSize === true || isObject(this.hot.getSettings().autoRowSize);
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.setSamplingOptions();

    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('beforeChange', changes => this.onBeforeChange(changes));
    this.addHook('beforeColumnMove', () => this.recalculateAllRowsHeight());
    this.addHook('beforeColumnResize', () => this.recalculateAllRowsHeight());
    this.addHook('beforeColumnSort', () => this.clearCache());
    this.addHook('beforeRender', force => this.onBeforeRender(force));
    this.addHook('beforeRowMove', (rowStart, rowEnd) => this.onBeforeRowMove(rowStart, rowEnd));
    this.addHook('modifyRowHeight', (height, row) => this.getRowHeight(row, height));
    this.addHook('modifyColumnHeaderHeight', () => this.getColumnHeaderHeight());
    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Calculate a given rows height.
   *
   * @param {Number|Object} rowRange Row index or an object with `from` and `to` indexes as a range.
   * @param {Number|Object} colRange Column index or an object with `from` and `to` indexes as a range.
   * @param {Boolean} [force=false] If `true` the calculation will be processed regardless of whether the width exists in the cache.
   */
  calculateRowsHeight(rowRange = { from: 0, to: this.hot.countRows() - 1 }, colRange = { from: 0, to: this.hot.countCols() - 1 }, force = false) {
    const rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;
    const columnsRange = typeof colRange === 'number' ? { from: colRange, to: colRange } : colRange;

    if (this.hot.getColHeader(0) !== null) {
      const samples = this.samplesGenerator.generateRowSamples(-1, columnsRange);

      this.ghostTable.addColumnHeadersRow(samples.get(-1));
    }

    rangeEach(rowsRange.from, rowsRange.to, (row) => {
      // For rows we must calculate row height even when user had set height value manually.
      // We can shrink column but cannot shrink rows!
      if (force || this.heights[row] === void 0) {
        const samples = this.samplesGenerator.generateRowSamples(row, columnsRange);

        arrayEach(samples, ([rowIndex, sample]) => this.ghostTable.addRow(rowIndex, sample));
      }
    });
    if (this.ghostTable.rows.length) {
      this.ghostTable.getHeights((row, height) => {
        this.heights[row] = height;
      });
      this.ghostTable.clean();
    }
  }

  /**
   * Calculate all rows heights. The calculated row will be cached in the {@link AutoRowSize#heights} property.
   * To retrieve height for specyfied row use {@link AutoRowSize#getRowHeight} method.
   *
   * @param {Object|Number} rowRange Row index or an object with `from` and `to` properties which define row range.
   */
  calculateAllRowsHeight(colRange = { from: 0, to: this.hot.countCols() - 1 }) {
    let current = 0;
    const length = this.hot.countRows() - 1;
    let timer = null;

    this.inProgress = true;

    const loop = () => {
      // When hot was destroyed after calculating finished cancel frame
      if (!this.hot) {
        cancelAnimationFrame(timer);
        this.inProgress = false;

        return;
      }
      this.calculateRowsHeight({ from: current, to: Math.min(current + AutoRowSize.CALCULATION_STEP, length) }, colRange);
      current = current + AutoRowSize.CALCULATION_STEP + 1;

      if (current < length) {
        timer = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(timer);
        this.inProgress = false;

        // @TODO Should call once per render cycle, currently fired separately in different plugins
        this.hot.view.wt.wtOverlays.adjustElementsSize(true);
        // tmp
        if (this.hot.view.wt.wtOverlays.leftOverlay.needFullRender) {
          this.hot.view.wt.wtOverlays.leftOverlay.clone.draw();
        }
      }
    };

    const syncLimit = this.getSyncCalculationLimit();

    // sync
    if (this.firstCalculation && syncLimit >= 0) {
      this.calculateRowsHeight({ from: 0, to: syncLimit }, colRange);
      this.firstCalculation = false;
      current = syncLimit + 1;
    }
    // async
    if (current < length) {
      loop();
    } else {
      this.inProgress = false;
      this.hot.view.wt.wtOverlays.adjustElementsSize(false);
    }
  }

  /**
   * Sets the sampling options.
   *
   * @private
   */
  setSamplingOptions() {
    const setting = this.hot.getSettings().autoRowSize;
    const samplingRatio = setting && hasOwnProperty(setting, 'samplingRatio') ? this.hot.getSettings().autoRowSize.samplingRatio : void 0;
    const allowSampleDuplicates = setting && hasOwnProperty(setting, 'allowSampleDuplicates') ? this.hot.getSettings().autoRowSize.allowSampleDuplicates : void 0;

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.samplesGenerator.setSampleCount(parseInt(samplingRatio, 10));
    }

    if (allowSampleDuplicates) {
      this.samplesGenerator.setAllowDuplicates(allowSampleDuplicates);
    }
  }

  /**
   * Recalculates all rows height (overwrite cache values).
   */
  recalculateAllRowsHeight() {
    if (isVisible(this.hot.view.wt.wtTable.TABLE)) {
      this.clearCache();
      this.calculateAllRowsHeight();
    }
  }

  /**
   * Gets value which tells how many rows should be calculated synchronously (rest of the rows will be calculated
   * asynchronously). The limit is calculated based on `syncLimit` set to autoRowSize option (see {@link Options#autoRowSize}).
   *
   * @returns {Number}
   */
  getSyncCalculationLimit() {
    /* eslint-disable no-bitwise */
    let limit = AutoRowSize.SYNC_CALCULATION_LIMIT;
    const rowsLimit = this.hot.countRows() - 1;

    if (isObject(this.hot.getSettings().autoRowSize)) {
      limit = this.hot.getSettings().autoRowSize.syncLimit;

      if (isPercentValue(limit)) {
        limit = valueAccordingPercent(rowsLimit, limit);
      } else {
        // Force to Number
        limit >>= 0;
      }
    }

    return Math.min(limit, rowsLimit);
  }

  /**
   * Gets the calculated row height.
   *
   * @param {Number} row Visual row index.
   * @param {Number} [defaultHeight] Default row height. It will be picked up if no calculated height found.
   * @returns {Number}
   */
  getRowHeight(row, defaultHeight = void 0) {
    let height = defaultHeight;

    if (this.heights[row] !== void 0 && this.heights[row] > (defaultHeight || 0)) {
      height = this.heights[row];
    }

    return height;
  }

  /**
   * Get the calculated column header height.
   *
   * @returns {Number|undefined}
   */
  getColumnHeaderHeight() {
    return this.heights[-1];
  }

  /**
   * Get the first visible row.
   *
   * @returns {Number} Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.
   */
  getFirstVisibleRow() {
    const wot = this.hot.view.wt;

    if (wot.wtViewport.rowsVisibleCalculator) {
      return wot.wtTable.getFirstVisibleRow();
    }
    if (wot.wtViewport.rowsRenderCalculator) {
      return wot.wtTable.getFirstRenderedRow();
    }

    return -1;
  }

  /**
   * Gets the last visible row.
   *
   * @returns {Number} Returns row index or -1 if table is not rendered.
   */
  getLastVisibleRow() {
    const wot = this.hot.view.wt;

    if (wot.wtViewport.rowsVisibleCalculator) {
      return wot.wtTable.getLastVisibleRow();
    }
    if (wot.wtViewport.rowsRenderCalculator) {
      return wot.wtTable.getLastRenderedRow();
    }

    return -1;
  }

  /**
   * Clears cached heights.
   */
  clearCache() {
    this.heights.length = 0;
    this.heights[-1] = void 0;
  }

  /**
   * Clears cache by range.
   *
   * @param {Object|Number} range Row index or an object with `from` and `to` properties which define row range.
   */
  clearCacheByRange(range) {
    const { from, to } = typeof range === 'number' ? { from: range, to: range } : range;

    rangeEach(Math.min(from, to), Math.max(from, to), (row) => {
      this.heights[row] = void 0;
    });
  }

  /**
   * Checks if all heights were calculated. If not then return `true` (need recalculate).
   *
   * @returns {Boolean}
   */
  isNeedRecalculate() {
    return !!arrayFilter(this.heights, item => (item === void 0)).length;
  }

  /**
   * On before render listener.
   *
   * @private
   */
  onBeforeRender() {
    const force = this.hot.renderCall;
    const fixedRowsBottom = this.hot.getSettings().fixedRowsBottom;
    const firstVisibleRow = this.getFirstVisibleRow();
    const lastVisibleRow = this.getLastVisibleRow();

    if (firstVisibleRow === -1 || lastVisibleRow === -1) {
      return;
    }

    this.calculateRowsHeight({ from: firstVisibleRow, to: lastVisibleRow }, void 0, force);

    // Calculate rows height synchronously for bottom overlay
    if (fixedRowsBottom) {
      const totalRows = this.hot.countRows() - 1;
      this.calculateRowsHeight({ from: totalRows - fixedRowsBottom, to: totalRows });
    }

    if (this.isNeedRecalculate() && !this.inProgress) {
      this.calculateAllRowsHeight();
    }
  }

  /**
   * On before row move listener.
   *
   * @private
   * @param {Number} from Row index where was grabbed.
   * @param {Number} to Destination row index.
   */
  onBeforeRowMove(from, to) {
    this.clearCacheByRange({ from, to });
    this.calculateAllRowsHeight();
  }

  /**
   * On before row resize listener.
   *
   * @private
   * @param {Number} row
   * @param {Number} size
   * @param {Boolean} isDblClick
   * @returns {Number}
   */
  onBeforeRowResize(row, size, isDblClick) {
    let newSize = size;

    if (isDblClick) {
      this.calculateRowsHeight(row, void 0, true);

      newSize = this.getRowHeight(row);
    }

    return newSize;
  }

  /**
   * On after load data listener.
   *
   * @private
   */
  onAfterLoadData() {
    if (this.hot.view) {
      this.recalculateAllRowsHeight();
    } else {
      // first load - initialization
      setTimeout(() => {
        if (this.hot) {
          this.recalculateAllRowsHeight();
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
    let range = null;

    if (changes.length === 1) {
      range = changes[0][0];
    } else if (changes.length > 1) {
      range = {
        from: changes[0][0],
        to: changes[changes.length - 1][0],
      };
    }
    if (range !== null) {
      this.clearCacheByRange(range);
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}

registerPlugin('autoRowSize', AutoRowSize);

export default AutoRowSize;
