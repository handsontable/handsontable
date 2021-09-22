import { BasePlugin } from '../base';
import { arrayEach, arrayFilter, arrayReduce, arrayMap } from '../../helpers/array';
import { cancelAnimationFrame, requestAnimationFrame } from '../../helpers/feature';
import GhostTable from '../../utils/ghostTable';
import Hooks from '../../pluginHooks';
import { isObject, hasOwnProperty } from '../../helpers/object';
import { valueAccordingPercent, rangeEach } from '../../helpers/number';
import SamplesGenerator from '../../utils/samplesGenerator';
import { isPercentValue } from '../../helpers/string';
import { ViewportColumnsCalculator } from '../../3rdparty/walkontable/src';
import { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { isDefined } from '../../helpers/mixed';

Hooks.getSingleton().register('modifyAutoColumnSizeSeed');

export const PLUGIN_KEY = 'autoColumnSize';
export const PLUGIN_PRIORITY = 10;
const privatePool = new WeakMap();
const COLUMN_SIZE_MAP_NAME = 'autoColumnSize';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin AutoColumnSize
 * @class AutoColumnSize
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
 *
 * ```js
 * // as a number (300 columns in sync, rest async)
 * autoColumnSize: {syncLimit: 300},.
 *
 * // as a string (percent)
 * autoColumnSize: {syncLimit: '40%'},
 * ```
 *
 * The plugin uses {@link GhostTable} and {@link SamplesGenerator} for calculations.
 * First, {@link SamplesGenerator} prepares samples of data with its coordinates.
 * Next {@link GhostTable} uses coordinates to get cells' renderers and append all to the DOM through DocumentFragment.
 *
 * Sampling accepts additional options:
 * - *samplingRatio* - Defines how many samples for the same length will be used to calculate. Default is `3`.
 *
 * ```js
 *   autoColumnSize: {
 *     samplingRatio: 10,
 *   }
 * ```
 *
 * - *allowSampleDuplicates* - Defines if duplicated values might be used in sampling. Default is `false`.
 *
 * ```js
 *   autoColumnSize: {
 *     allowSampleDuplicates: true,
 *   }
 * ```
 *
 * To configure this plugin see {@link Options#autoColumnSize}.
 *
 * @example
 *
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   data: getData(),
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
/* eslint-enable jsdoc/require-description-complete-sentence */
export class AutoColumnSize extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

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
     * @fires Hooks#modifyAutoColumnSizeSeed
     */
    this.samplesGenerator = new SamplesGenerator((row, column) => {
      const cellMeta = this.hot.getCellMeta(row, column);
      let cellValue = '';

      if (!cellMeta.spanned) {
        cellValue = this.hot.getDataAtCell(row, column);
      }

      let bundleSeed = '';

      if (this.hot.hasHook('modifyAutoColumnSizeSeed')) {
        bundleSeed = this.hot.runHooks('modifyAutoColumnSizeSeed', bundleSeed, cellMeta, cellValue);
      }

      return { value: cellValue, bundleSeed };
    });
    /**
     * `true` only if the first calculation was performed.
     *
     * @private
     * @type {boolean}
     */
    this.firstCalculation = true;
    /**
     * `true` if the size calculation is in progress.
     *
     * @type {boolean}
     */
    this.inProgress = false;
    /**
     * Number of already measured columns (we already know their sizes).
     *
     * @type {number}
     */
    this.measuredColumns = 0;
    /**
     * PhysicalIndexToValueMap to keep and track widths for physical column indexes.
     *
     * @private
     * @type {PhysicalIndexToValueMap}
     */
    this.columnWidthsMap = new IndexToValueMap();
    this.hot.columnIndexMapper.registerMap(COLUMN_SIZE_MAP_NAME, this.columnWidthsMap);

    // Leave the listener active to allow auto-sizing the columns when the plugin is disabled.
    // This is necesseary for width recalculation for resize handler doubleclick (ManualColumnResize).
    this.addHook('beforeColumnResize',
      (size, column, isDblClick) => this.onBeforeColumnResize(size, column, isDblClick));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link #enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return this.hot.getSettings()[PLUGIN_KEY] !== false && !this.hot.getSettings().colWidths;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const setting = this.hot.getSettings()[PLUGIN_KEY];

    if (setting && setting.useHeaders !== null && setting.useHeaders !== void 0) {
      this.ghostTable.setSetting('useHeaders', setting.useHeaders);
    }

    this.setSamplingOptions();

    this.addHook('afterLoadData', () => this.onAfterLoadData());
    this.addHook('beforeChange', changes => this.onBeforeChange(changes));
    this.addHook('afterFormulasValuesUpdate', changes => this.onAfterFormulasValuesUpdate(changes));
    this.addHook('beforeViewRender', force => this.onBeforeViewRender(force));
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
      this.calculateVisibleColumnsWidth();
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();

    // Leave the listener active to allow auto-sizing the columns when the plugin is disabled.
    // This is necesseary for width recalculation for resize handler doubleclick (ManualColumnResize).
    this.addHook('beforeColumnResize',
      (size, column, isDblClick) => this.onBeforeColumnResize(size, column, isDblClick));
  }

  /**
   * Calculates visible columns width.
   */
  calculateVisibleColumnsWidth() {
    const rowsCount = this.hot.countRows();

    // Keep last column widths unchanged for situation when all rows was deleted or trimmed (pro #6)
    if (!rowsCount) {
      return;
    }

    const force = this.hot.renderCall;
    const firstVisibleColumn = this.getFirstVisibleColumn();
    const lastVisibleColumn = this.getLastVisibleColumn();

    if (firstVisibleColumn === -1 || lastVisibleColumn === -1) {
      return;
    }

    this.calculateColumnsWidth({ from: firstVisibleColumn, to: lastVisibleColumn }, void 0, force);
  }

  /**
   * Calculates a columns width.
   *
   * @param {number|object} colRange Visual column index or an object with `from` and `to` visual indexes as a range.
   * @param {number|object} rowRange Visual row index or an object with `from` and `to` visual indexes as a range.
   * @param {boolean} [force=false] If `true` the calculation will be processed regardless of whether the width exists in the cache.
   */
  calculateColumnsWidth(colRange = { from: 0, to: this.hot.countCols() - 1 }, rowRange = { from: 0, to: this.hot.countRows() - 1 }, force = false) { // eslint-disable-line max-len
    const columnsRange = typeof colRange === 'number' ? { from: colRange, to: colRange } : colRange;
    const rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;

    rangeEach(columnsRange.from, columnsRange.to, (visualColumn) => {
      let physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn === null) {
        physicalColumn = visualColumn;
      }

      if (force || (this.columnWidthsMap.getValueAtIndex(physicalColumn) === null &&
          !this.hot._getColWidthFromSettings(physicalColumn))) {
        const samples = this.samplesGenerator.generateColumnSamples(visualColumn, rowsRange);

        arrayEach(samples, ([column, sample]) => this.ghostTable.addColumn(column, sample));
      }
    });

    if (this.ghostTable.columns.length) {
      this.hot.batchExecution(() => {
        this.ghostTable.getWidths((visualColumn, width) => {
          const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

          this.columnWidthsMap.setValueAtIndex(physicalColumn, width);
        });
      }, true);

      this.measuredColumns = columnsRange.to + 1;

      this.ghostTable.clean();
    }
  }

  /**
   * Calculates all columns width. The calculated column will be cached in the {@link AutoColumnSize#widths} property.
   * To retrieve width for specified column use {@link AutoColumnSize#getColumnWidth} method.
   *
   * @param {object|number} rowRange Row index or an object with `from` and `to` properties which define row range.
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
        this.hot.view.adjustElementsSize();
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
    const setting = this.hot.getSettings()[PLUGIN_KEY];
    const samplingRatio = setting && hasOwnProperty(setting, 'samplingRatio') ?
      setting.samplingRatio : void 0;
    const allowSampleDuplicates = setting && hasOwnProperty(setting, 'allowSampleDuplicates') ?
      setting.allowSampleDuplicates : void 0;

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
   * @returns {number}
   */
  getSyncCalculationLimit() {
    const settings = this.hot.getSettings()[PLUGIN_KEY];
    /* eslint-disable no-bitwise */
    let limit = AutoColumnSize.SYNC_CALCULATION_LIMIT;
    const colsLimit = this.hot.countCols() - 1;

    if (isObject(settings)) {
      limit = settings.syncLimit;

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
   * @param {number} column Visual column index.
   * @param {number} [defaultWidth] Default column width. It will be picked up if no calculated width found.
   * @param {boolean} [keepMinimum=true] If `true` then returned value won't be smaller then 50 (default column width).
   * @returns {number}
   */
  getColumnWidth(column, defaultWidth = void 0, keepMinimum = true) {
    let width = defaultWidth;

    if (width === void 0) {
      width = this.columnWidthsMap.getValueAtIndex(this.hot.toPhysicalColumn(column));

      if (keepMinimum && typeof width === 'number') {
        width = Math.max(width, ViewportColumnsCalculator.DEFAULT_WIDTH);
      }
    }

    return width;
  }

  /**
   * Gets the first visible column.
   *
   * @returns {number} Returns visual column index, -1 if table is not rendered or if there are no columns to base the the calculations on.
   */
  getFirstVisibleColumn() {
    const wot = this.hot.view.wt;

    if (wot.wtViewport.columnsVisibleCalculator) {
      // Fist fully visible column is stored as renderable index.
      const firstFullyVisibleColumn = wot.wtTable.getFirstVisibleColumn();

      if (firstFullyVisibleColumn !== -1) {
        return this.hot.columnIndexMapper.getVisualFromRenderableIndex(firstFullyVisibleColumn);
      }
    }

    if (wot.wtViewport.columnsRenderCalculator) {
      const firstRenderedColumn = wot.wtTable.getFirstRenderedColumn();

      // There are no rendered column.
      if (firstRenderedColumn !== -1) {
        return this.hot.columnIndexMapper.getVisualFromRenderableIndex(firstRenderedColumn);
      }
    }

    return -1;
  }

  /**
   * Gets the last visible column.
   *
   * @returns {number} Returns visual column index or -1 if table is not rendered.
   */
  getLastVisibleColumn() {
    const wot = this.hot.view.wt;

    if (wot.wtViewport.columnsVisibleCalculator) {
      // Last fully visible column is stored as renderable index.
      const lastFullyVisibleColumn = wot.wtTable.getLastVisibleColumn();

      if (lastFullyVisibleColumn !== -1) {
        return this.hot.columnIndexMapper.getVisualFromRenderableIndex(lastFullyVisibleColumn);
      }
    }

    if (wot.wtViewport.columnsRenderCalculator) {
      // Last fully visible column is stored as renderable index.
      const lastRenderedColumn = wot.wtTable.getLastRenderedColumn();

      // There are no rendered columns.
      if (lastRenderedColumn !== -1) {
        return this.hot.columnIndexMapper.getVisualFromRenderableIndex(lastRenderedColumn);
      }
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
   * @param {number[]} [columns] List of physical column indexes to clear.
   */
  clearCache(columns = []) {
    if (columns.length) {
      this.hot.batchExecution(() => {
        arrayEach(columns, (physicalIndex) => {
          this.columnWidthsMap.setValueAtIndex(physicalIndex, null);
        });
      }, true);

    } else {
      this.columnWidthsMap.clear();
    }
  }

  /**
   * Checks if all widths were calculated. If not then return `true` (need recalculate).
   *
   * @returns {boolean}
   */
  isNeedRecalculate() {
    return !!arrayFilter(this.columnWidthsMap.getValues()
      .slice(0, this.measuredColumns), item => (item === null)).length;
  }

  /**
   * On before view render listener.
   *
   * @private
   */
  onBeforeViewRender() {
    this.calculateVisibleColumnsWidth();

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
   * @param {Array} changes An array of modified data.
   */
  onBeforeChange(changes) {
    const changedColumns = arrayMap(changes, ([, columnProperty]) => {
      return this.hot.toPhysicalColumn(this.hot.propToCol(columnProperty));
    });

    this.clearCache(Array.from(new Set(changedColumns)));
  }

  /**
   * On before column resize listener.
   *
   * @private
   * @param {number} size Calculated new column width.
   * @param {number} column Visual index of the resized column.
   * @param {boolean} isDblClick  Flag that determines whether there was a double-click.
   * @returns {number}
   */
  onBeforeColumnResize(size, column, isDblClick) {
    let newSize = size;

    if (isDblClick) {
      this.calculateColumnsWidth(column, void 0, true);

      newSize = this.getColumnWidth(column, void 0, false);
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
   * After formulas values updated listener.
   *
   * @private
   * @param {Array} changes An array of modified data.
   */
  onAfterFormulasValuesUpdate(changes) {
    const filteredChanges = arrayFilter(changes, change => isDefined(change.address?.col));
    const changedColumns = arrayMap(filteredChanges, change => change.address.col);

    this.clearCache(Array.from(new Set(changedColumns)));
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}
