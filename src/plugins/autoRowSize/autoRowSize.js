
import BasePlugin from './../_base';
import {arrayEach, arrayFilter} from './../../helpers/array';
import {cancelAnimationFrame, requestAnimationFrame, isVisible} from './../../helpers/dom/element';
import {GhostTable} from './../../utils/ghostTable';
import {isObject, objectEach} from './../../helpers/object';
import {valueAccordingPercent, rangeEach} from './../../helpers/number';
import {registerPlugin} from './../../plugins';
import {SamplesGenerator} from './../../utils/samplesGenerator';
import {isPercentValue} from './../../helpers/string';


/**
 * @plugin AutoRowSize
 *
 * @description
 * This plugin allows to set row height related to the highest cell in row.
 *
 * Default value is `undefined` which is the same effect as `false`. Enable this plugin can decrease performance.
 *
 * Row height calculations are divided into sync and async part. Each of this part has own advantages and
 * disadvantages. Synchronous counting is faster but it blocks browser UI and asynchronous is slower but it does not
 * block Browser UI.
 *
 * To configure this plugin see {@link Options#autoRowSize}.
 *
 *
 * @example
 *
 * ```js
 * ...
 * var hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   autoRowSize: true
 * });
 * // Access to plugin instance:
 * var plugin = hot.getPlugin('autoRowSize');
 *
 * plugin.getRowHeight(4);
 *
 * if (plugin.isEnabled()) {
 *   // code...
 * }
 * ...
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
     * @type {Array}
     */
    this.heights = [];
    /**
     * Instance of GhostTable for rows and columns size calculations.
     *
     * @type {GhostTable}
     */
    this.ghostTable = new GhostTable(this.hot);
    /**
     * Instance of SamplesGenerator for generating samples necessary for rows height calculations.
     *
     * @type {SamplesGenerator}
     */
    this.samplesGenerator = new SamplesGenerator((row, col) => this.hot.getDataAtCell(row, col));
    /**
     * @type {Boolean}
     */
    this.firstCalculation = true;
    /**
     * @type {Boolean}
     */
    this.inProgress = false;

    // moved to constructor to allow auto-sizing the rows when the plugin is disabled
    this.addHook('beforeRowResize', (row, size, isDblClick) => this.onBeforeRowResize(row, size, isDblClick));
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().autoRowSize === true || isObject(this.hot.getSettings().autoRowSize);
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('beforeChange', (changes) => this.onBeforeChange(changes));
    this.addHook('beforeColumnMove', () => this.recalculateAllRowsHeight());
    this.addHook('beforeColumnResize', () => this.recalculateAllRowsHeight());
    this.addHook('beforeColumnSort', () => this.clearCache());
    this.addHook('beforeRender', (force) => this.onBeforeRender(force));
    this.addHook('beforeRowMove', (rowStart, rowEnd) => this.onBeforeRowMove(rowStart, rowEnd));
    this.addHook('modifyRowHeight', (height, row) => this.getRowHeight(row, height));
    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Calculate rows height.
   *
   * @param {Number|Object} rowRange Row range object.
   * @param {Number|Object} colRange Column range object.
   * @param {Boolean} [force=false] If `true` force calculate height even when value was cached earlier.
   */
  calculateRowsHeight(rowRange = {from: 0, to: this.hot.countRows() - 1}, colRange = {from: 0, to: this.hot.countCols() - 1}, force = false) {
    if (typeof rowRange === 'number') {
      rowRange = {from: rowRange, to: rowRange};
    }
    if (typeof colRange === 'number') {
      colRange = {from: colRange, to: colRange};
    }
    rangeEach(rowRange.from, rowRange.to, (row) => {
      // For rows we must calculate row height even when user had set height value manually.
      // We can shrink column but cannot shrink rows!
      if (force || this.heights[row] === void 0) {
        const samples = this.samplesGenerator.generateRowSamples(row, colRange);

        samples.forEach((sample, row) => this.ghostTable.addRow(row, sample));
      }
    });
    if (this.ghostTable.rows.length) {
      this.ghostTable.getHeights((row, height) => this.heights[row] = height);
      this.ghostTable.clean();
    }
  }

  /**
   * Calculate all rows height.
   *
   * @param {Object|Number} colRange Column range object.
   */
  calculateAllRowsHeight(colRange = {from: 0, to: this.hot.countCols() - 1}) {
    let current = 0;
    let length = this.hot.countRows() - 1;
    let timer = null;

    this.inProgress = true;

    let loop = () => {
      // When hot was destroyed after calculating finished cancel frame
      if (!this.hot) {
        cancelAnimationFrame(timer);
        this.inProgress = false;

        return;
      }
      this.calculateRowsHeight({from: current, to: Math.min(current + AutoRowSize.CALCULATION_STEP, length)}, colRange);
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
    // sync
    if (this.firstCalculation && this.getSyncCalculationLimit()) {
      this.calculateRowsHeight({from: 0, to: this.getSyncCalculationLimit()}, colRange);
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
   * Recalculate all rows height (overwrite cache values).
   */
  recalculateAllRowsHeight() {
    if (isVisible(this.hot.view.wt.wtTable.TABLE)) {
      this.clearCache();
      this.calculateAllRowsHeight();
    }
  }

  /**
   * Get value which tells how much rows will be calculated synchronously. Rest rows will be calculated asynchronously.
   *
   * @returns {Number}
   */
  getSyncCalculationLimit() {
    let limit = AutoRowSize.SYNC_CALCULATION_LIMIT;
    let rowsLimit = this.hot.countRows() - 1;

    if (isObject(this.hot.getSettings().autoRowSize)) {
      limit = this.hot.getSettings().autoRowSize.syncLimit;

      if (isPercentValue(limit)) {
        limit = valueAccordingPercent(rowsLimit, limit);
      } else {
        // Force to Number
        limit = limit >> 0;
      }
    }

    return Math.min(limit, rowsLimit);
  }

  /**
   * Get calculated row height.
   *
   * @param {Number} row Row index.
   * @param {Number} [defaultHeight] Default row height. It will be pick up if no calculated height found.
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
   * Get first visible row.
   *
   * @returns {Number} Returns row index or -1 if table is not rendered.
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
   * Get last visible row.
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
   * Clear cached heights.
   */
  clearCache() {
    this.heights.length = 0;
  }

  /**
   * Clear cache by range.
   *
   * @param {Object|Number} range Row range object.
   */
  clearCacheByRange(range) {
    if (typeof range === 'number') {
      range = {from: range, to: range};
    }
    rangeEach(Math.min(range.from, range.to), Math.max(range.from, range.to), (row) => this.heights[row] = void 0);
  }

  /**
   * @returns {Boolean}
   */
  isNeedRecalculate() {
     return arrayFilter(this.heights, (item) => (item === void 0)).length ? true : false;
  }

  /**
   * On before render listener.
   *
   * @private
   */
  onBeforeRender() {
    let force = this.hot.renderCall;
    this.calculateRowsHeight({from: this.getFirstVisibleRow(), to: this.getLastVisibleRow()}, void 0, force);

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
    this.clearCacheByRange({from, to});
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
    if (isDblClick) {
      this.calculateRowsHeight(row, void 0, true);
      size = this.getRowHeight(row);
    }

    return size;
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
        to: changes[changes.length - 1][0]
      };
    }
    if (range !== null) {
      this.clearCacheByRange(range);
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}

export {AutoRowSize};

registerPlugin('autoRowSize', AutoRowSize);
