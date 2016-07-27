import BasePlugin from './../_base';
import {arrayEach, arrayFilter} from './../../helpers/array';
import {cancelAnimationFrame, requestAnimationFrame} from './../../helpers/feature';
import {isVisible} from './../../helpers/dom/element';
import {GhostTable} from './../../utils/ghostTable';
import {isObject, objectEach} from './../../helpers/object';
import {valueAccordingPercent, rangeEach} from './../../helpers/number';
import {registerPlugin} from './../../plugins';
import {SamplesGenerator} from './../../utils/samplesGenerator';
import {isPercentValue} from './../../helpers/string';
import {WalkontableViewportColumnsCalculator} from './../../3rdparty/walkontable/src/calculator/viewportColumns';

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
 * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous operations don't
 * block the browser UI.
 *
 * To configure the sync/async distribution, you can pass an absolute value (number of columns) or a percentage value to a config object:
 * ```js
 * ...
 * // as a number (300 columns in sync, rest async)
 * autoColumnSize: {syncLimit: 300},
 * ...
 *
 * ...
 * // as a string (percent)
 * autoColumnSize: {syncLimit: '40%'},
 * ...
 * ```
 *
 * To configure this plugin see {@link Options#autoColumnSize}.
 *
 * @example
 * ```js
 * ...
 * var hot = new Handsontable(document.getElementById('example'), {
 *   date: getData(),
 *   autoColumnSize: true
 * });
 * // Access to plugin instance:
 * var plugin = hot.getPlugin('autoColumnSize');
 *
 * plugin.getColumnWidth(4);
 *
 * if (plugin.isEnabled()) {
 *   // code...
 * }
 * ...
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
    /**
     * Cached columns widths.
     *
     * @type {Array}
     */
    this.widths = [];
    /**
     * Instance of {@link GhostTable} for rows and columns size calculations.
     *
     * @type {GhostTable}
     */
    this.ghostTable = new GhostTable(this.hot);
    /**
     * Instance of {@link SamplesGenerator} for generating samples necessary for columns width calculations.
     *
     * @type {SamplesGenerator}
     */
    this.samplesGenerator = new SamplesGenerator((row, col) => this.hot.getDataAtCell(row, col));
    /**
     * `true` only if the first calculation was performed
     *
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
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().autoColumnSize !== false && !this.hot.getSettings().colWidths;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    let setting = this.hot.getSettings().autoColumnSize;
    let samplingRatio = setting && setting.hasOwnProperty('samplingRatio') ? this.hot.getSettings().autoColumnSize.samplingRatio : void 0;

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.samplesGenerator.customSampleCount = parseInt(samplingRatio, 10);
    }

    if (setting && setting.useHeaders != null) {
      this.ghostTable.setSetting('useHeaders', setting.useHeaders);
    }

    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('beforeChange', (changes) => this.onBeforeChange(changes));

    this.addHook('beforeRender', (force) => this.onBeforeRender(force));
    this.addHook('modifyColWidth', (width, col) => this.getColumnWidth(col, width));
    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Calculate a columns width.
   *
   * @param {Number|Object} colRange Column range object.
   * @param {Number|Object} rowRange Row range object.
   * @param {Boolean} [force=false] If `true` force calculate width even when value was cached earlier.
   */
  calculateColumnsWidth(colRange = {from: 0, to: this.hot.countCols() - 1}, rowRange = {from: 0, to: this.hot.countRows() - 1}, force = false) {
    if (typeof colRange === 'number') {
      colRange = {from: colRange, to: colRange};
    }
    if (typeof rowRange === 'number') {
      rowRange = {from: rowRange, to: rowRange};
    }
    rangeEach(colRange.from, colRange.to, (col) => {
      if (force || (this.widths[col] === void 0 && !this.hot._getColWidthFromSettings(col))) {
        const samples = this.samplesGenerator.generateColumnSamples(col, rowRange);

        samples.forEach((sample, col) => this.ghostTable.addColumn(col, sample));
      }
    });

    if (this.ghostTable.columns.length) {
      this.ghostTable.getWidths((col, width) => this.widths[col] = width);
      this.ghostTable.clean();
    }
  }

  /**
   * Calculate all columns width.
   *
   * @param {Object|Number} rowRange Row range object.
   */
  calculateAllColumnsWidth(rowRange = {from: 0, to: this.hot.countRows() - 1}) {
    let current = 0;
    let length = this.hot.countCols() - 1;
    let timer = null;

    this.inProgress = true;

    let loop = () => {
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
        this.hot.view.wt.wtOverlays.adjustElementsSize(true);
        // tmp
        if (this.hot.view.wt.wtOverlays.leftOverlay.needFullRender) {
          this.hot.view.wt.wtOverlays.leftOverlay.clone.draw();
        }
      }
    };
    // sync
    if (this.firstCalculation && this.getSyncCalculationLimit()) {
      this.calculateColumnsWidth({from: 0, to: this.getSyncCalculationLimit()}, rowRange);
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
   * Recalculate all columns width (overwrite cache values).
   */
  recalculateAllColumnsWidth() {
    if (this.hot.view && isVisible(this.hot.view.wt.wtTable.TABLE)) {
      this.clearCache();
      this.calculateAllColumnsWidth();
    }
  }

  /**
   * Get value which tells how many columns should be calculated synchronously. Rest of the columns will be calculated asynchronously.
   *
   * @returns {Number}
   */
  getSyncCalculationLimit() {
    let limit = AutoColumnSize.SYNC_CALCULATION_LIMIT;
    let colsLimit = this.hot.countCols() - 1;

    if (isObject(this.hot.getSettings().autoColumnSize)) {
      limit = this.hot.getSettings().autoColumnSize.syncLimit;

      if (isPercentValue(limit)) {
        limit = valueAccordingPercent(colsLimit, limit);
      } else {
        // Force to Number
        limit = limit >> 0;
      }
    }

    return Math.min(limit, colsLimit);
  }

  /**
   * Get the calculated column width.
   *
   * @param {Number} col Column index.
   * @param {Number} [defaultWidth] Default column width. It will be picked up if no calculated width found.
   * @param {Boolean} [keepMinimum=true] If `true` then returned value won't be smaller then 50 (default column width).
   * @returns {Number}
   */
  getColumnWidth(col, defaultWidth = void 0, keepMinimum = true) {
    let width = defaultWidth;

    if (width === void 0) {
      width = this.widths[col];

      if (keepMinimum && typeof width === 'number') {
        width = Math.max(width, WalkontableViewportColumnsCalculator.DEFAULT_WIDTH);
      }
    }

    return width;
  }

  /**
   * Get the first visible column.
   *
   * @returns {Number} Returns column index or -1 if table is not rendered.
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
   * Get the last visible column.
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
   * Clear cached widths.
   */
  clearCache() {
    this.widths.length = 0;
  }

  /**
   * Check if all widths were calculated. If not then return `true` (need recalculate).
   *
   * @returns {Boolean}
   */
  isNeedRecalculate() {
    return arrayFilter(this.widths, (item) => (item === void 0)).length ? true : false;
  }

  /**
   * On before render listener.
   *
   * @private
   */
  onBeforeRender() {
    const force = this.hot.renderCall;
    const rowsCount = this.hot.countRows();

    // Keep last column widths unchanged for situation when all rows was deleted or trimmed (pro #6)
    if (!rowsCount) {
      return;
    }

    this.calculateColumnsWidth({from: this.getFirstVisibleColumn(), to: this.getLastVisibleColumn()}, void 0, force);

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
    arrayEach(changes, (data) => this.widths[this.hot.propToCol(data[1])] = void 0);
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
    if (isDblClick) {
      this.calculateColumnsWidth(col, void 0, true);
      size = this.getColumnWidth(col, void 0, false);
    }

    return size;
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}

export {AutoColumnSize};

registerPlugin('autoColumnSize', AutoColumnSize);
