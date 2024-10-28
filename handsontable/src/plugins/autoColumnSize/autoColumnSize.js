import { BasePlugin } from '../base';
import { cancelAnimationFrame, requestAnimationFrame } from '../../helpers/feature';
import GhostTable from '../../utils/ghostTable';
import { Hooks } from '../../core/hooks';
import { isObject } from '../../helpers/object';
import { valueAccordingPercent, rangeEach } from '../../helpers/number';
import SamplesGenerator from '../../utils/samplesGenerator';
import { isPercentValue } from '../../helpers/string';
import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
import { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';

Hooks.getSingleton().register('modifyAutoColumnSizeSeed');

export const PLUGIN_KEY = 'autoColumnSize';
export const PLUGIN_PRIORITY = 10;
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
 * autoColumnSize: {syncLimit: 300},
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
 * ::: only-for javascript
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
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * ...
 *
 * // First, let's contruct Handsontable
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 *   autoColumnSize={true}
 * />
 *
 * ...
 *
 * // Access to plugin instance:
 * const hot = hotRef.current.hotInstance;
 * const plugin = hot.getPlugin('autoColumnSize');
 *
 * plugin.getColumnWidth(4);
 *
 * if (plugin.isEnabled()) {
 *   // code...
 * }
 * ```
 * :::
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export class AutoColumnSize extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return true;
  }

  static get DEFAULT_SETTINGS() {
    return {
      useHeaders: true,
      samplingRatio: null,
      allowSampleDuplicates: false,
    };
  }

  static get CALCULATION_STEP() {
    return 50;
  }

  static get SYNC_CALCULATION_LIMIT() {
    return 50;
  }

  /**
   * Instance of {@link GhostTable} for rows and columns size calculations.
   *
   * @private
   * @type {GhostTable}
   */
  ghostTable = new GhostTable(this.hot);
  /**
   * Instance of {@link SamplesGenerator} for generating samples necessary for columns width calculations.
   *
   * @private
   * @type {SamplesGenerator}
   * @fires Hooks#modifyAutoColumnSizeSeed
   */
  samplesGenerator = new SamplesGenerator((row, column) => {
    const physicalRow = this.hot.toPhysicalRow(row);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (this.hot.rowIndexMapper.isHidden(physicalRow) || this.hot.columnIndexMapper.isHidden(physicalColumn)) {
      return false;
    }

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
   * `true` if the size calculation is in progress.
   *
   * @type {boolean}
   */
  inProgress = false;
  /**
   * Number of already measured columns (we already know their sizes).
   *
   * @type {number}
   */
  measuredColumns = 0;
  /**
   * PhysicalIndexToValueMap to keep and track widths for physical column indexes.
   *
   * @private
   * @type {PhysicalIndexToValueMap}
   */
  columnWidthsMap = new IndexToValueMap();

  /**
   * Cached column header names. It is used to diff current column headers with previous state and detect which
   * columns width should be updated.
   *
   * @type {Array}
   */
  #cachedColumnHeaders = [];
  /**
   * An array of column indexes whose width will be recalculated.
   *
   * @type {number[]}
   */
  #visualColumnsToRefresh = [];

  constructor(hotInstance) {
    super(hotInstance);
    this.hot.columnIndexMapper.registerMap(COLUMN_SIZE_MAP_NAME, this.columnWidthsMap);

    // Leave the listener active to allow auto-sizing the columns when the plugin is disabled.
    // This is necessary for width recalculation for resize handler doubleclick (ManualColumnResize).
    this.addHook('beforeColumnResize',
      (size, column, isDblClick) => this.#onBeforeColumnResize(size, column, isDblClick));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link #enablePlugin} method is called.
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

    this.ghostTable.setSetting('useHeaders', this.getSetting('useHeaders'));
    this.samplesGenerator.setAllowDuplicates(this.getSetting('allowSampleDuplicates'));

    const samplingRatio = this.getSetting('samplingRatio');

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.samplesGenerator.setSampleCount(parseInt(samplingRatio, 10));
    }

    this.addHook('afterLoadData', (...args) => this.#onAfterLoadData(...args));
    this.addHook('beforeChangeRender', (...args) => this.#onBeforeChange(...args));
    this.addHook('afterFormulasValuesUpdate', (...args) => this.#onAfterFormulasValuesUpdate(...args));
    this.addHook('beforeRender', () => this.#onBeforeRender());
    this.addHook('modifyColWidth', (width, col) => this.getColumnWidth(col, width));
    this.addHook('init', () => this.#onInit());

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    this.#visualColumnsToRefresh = this.findColumnsWhereHeaderWasChanged();
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();

    // Leave the listener active to allow auto-sizing the columns when the plugin is disabled.
    // This is necessary for width recalculation for resize handler doubleclick (ManualColumnResize).
    this.addHook('beforeColumnResize',
      (size, column, isDblClick) => this.#onBeforeColumnResize(size, column, isDblClick));
  }

  /**
   * Calculates widths for visible columns in the viewport only.
   */
  calculateVisibleColumnsWidth() {
    // Keep last column widths unchanged for situation when all rows was deleted or trimmed (pro #6)
    if (!this.hot.countRows()) {
      return;
    }

    const firstVisibleColumn = this.getFirstVisibleColumn();
    const lastVisibleColumn = this.getLastVisibleColumn();

    if (firstVisibleColumn === -1 || lastVisibleColumn === -1) {
      return;
    }

    const overwriteCache = this.hot.renderCall;

    this.calculateColumnsWidth({ from: firstVisibleColumn, to: lastVisibleColumn }, undefined, overwriteCache);
  }

  /**
   * Calculates a columns width.
   *
   * @param {number|object} colRange Visual column index or an object with `from` and `to` visual indexes as a range.
   * @param {number|object} rowRange Visual row index or an object with `from` and `to` visual indexes as a range.
   * @param {boolean} [overwriteCache=false] If `true` the calculation will be processed regardless of whether the width exists in the cache.
   */
  calculateColumnsWidth(
    colRange = { from: 0, to: this.hot.countCols() - 1 },
    rowRange = { from: 0, to: this.hot.countRows() - 1 },
    overwriteCache = false
  ) {
    const columnsRange = typeof colRange === 'number' ? { from: colRange, to: colRange } : colRange;
    const rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;

    rangeEach(columnsRange.from, columnsRange.to, (visualColumn) => {
      let physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn === null) {
        physicalColumn = visualColumn;
      }

      if (overwriteCache || (this.columnWidthsMap.getValueAtIndex(physicalColumn) === null &&
          !this.hot._getColWidthFromSettings(physicalColumn))) {
        const samples = this.samplesGenerator.generateColumnSamples(visualColumn, rowsRange);

        samples.forEach((sample, column) => this.ghostTable.addColumn(column, sample));
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
   * @param {boolean} [overwriteCache] If `true` the calculation will be processed regardless of whether the width exists in the cache.
   */
  calculateAllColumnsWidth(rowRange = { from: 0, to: this.hot.countRows() - 1 }, overwriteCache = false) {
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
      }, rowRange, overwriteCache);

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
    if (syncLimit >= 0) {
      this.calculateColumnsWidth({ from: 0, to: syncLimit }, rowRange, overwriteCache);
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
   * Calculates specific columns width (overwrite cache values).
   *
   * @param {number[]} visualColumns List of visual columns to calculate.
   */
  #calculateSpecificColumnsWidth(visualColumns) {
    const rowsRange = {
      from: 0,
      to: this.hot.countRows() - 1,
    };

    visualColumns.forEach((visualColumn) => {
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn === null) {
        return;
      }

      if (!this.hot._getColWidthFromSettings(physicalColumn)) {
        const samples = this.samplesGenerator.generateColumnSamples(visualColumn, rowsRange);

        samples.forEach((sample, column) => this.ghostTable.addColumn(column, sample));
      }
    });

    if (this.ghostTable.columns.length) {
      this.hot.batchExecution(() => {
        this.ghostTable.getWidths((visualColumn, width) => {
          const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

          this.columnWidthsMap.setValueAtIndex(physicalColumn, width);
        });
      }, true);

      this.ghostTable.clean();
    }
  }

  /**
   * Recalculates all columns width (overwrite cache values).
   */
  recalculateAllColumnsWidth() {
    if (this.hot.view.isVisible()) {
      this.calculateAllColumnsWidth({ from: 0, to: this.hot.countRows() - 1 }, true);
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
  getColumnWidth(column, defaultWidth, keepMinimum = true) {
    let width = defaultWidth;

    if (width === undefined) {
      width = this.columnWidthsMap.getValueAtIndex(this.hot.toPhysicalColumn(column));

      if (keepMinimum && typeof width === 'number') {
        width = Math.max(width, DEFAULT_COLUMN_WIDTH);
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
    return this.hot.getFirstRenderedVisibleColumn() ?? -1;
  }

  /**
   * Gets the last visible column.
   *
   * @returns {number} Returns visual column index or -1 if table is not rendered.
   */
  getLastVisibleColumn() {
    return this.hot.getLastRenderedVisibleColumn() ?? -1;
  }

  /**
   * Collects all columns which titles has been changed in comparison to the previous state.
   *
   * @private
   * @returns {Array} It returns an array of visual column indexes.
   */
  findColumnsWhereHeaderWasChanged() {
    const columnHeaders = this.hot.getColHeader();

    const changedColumns = columnHeaders.reduce((acc, columnTitle, physicalColumn) => {
      const cachedColumnsLength = this.#cachedColumnHeaders.length;

      if (cachedColumnsLength - 1 < physicalColumn || this.#cachedColumnHeaders[physicalColumn] !== columnTitle) {
        acc.push(this.hot.toVisualColumn(physicalColumn));
      }
      if (cachedColumnsLength - 1 < physicalColumn) {
        this.#cachedColumnHeaders.push(columnTitle);
      } else {
        this.#cachedColumnHeaders[physicalColumn] = columnTitle;
      }

      return acc;
    }, []);

    return changedColumns;
  }

  /**
   * Clears cache of calculated column widths. If you want to clear only selected columns pass an array with their indexes.
   * Otherwise whole cache will be cleared.
   *
   * @param {number[]} [physicalColumns] List of physical column indexes to clear.
   */
  clearCache(physicalColumns) {
    if (Array.isArray(physicalColumns)) {
      this.hot.batchExecution(() => {
        physicalColumns.forEach((physicalIndex) => {
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
    return !!this.columnWidthsMap.getValues()
      .slice(0, this.measuredColumns).filter(item => (item === null)).length;
  }

  /**
   * On before view render listener.
   */
  #onBeforeRender() {
    this.calculateVisibleColumnsWidth();

    if (!this.inProgress) {
      this.#calculateSpecificColumnsWidth(this.#visualColumnsToRefresh);
      this.#visualColumnsToRefresh = [];
    }
  }

  /**
   * On after load data listener.
   *
   * @param {Array} sourceData Source data.
   * @param {boolean} isFirstLoad `true` if this is the first load.
   */
  #onAfterLoadData(sourceData, isFirstLoad) {
    if (!isFirstLoad) {
      this.recalculateAllColumnsWidth();
    }
  }

  /**
   * On before change listener.
   *
   * @param {Array} changes An array of modified data.
   */
  #onBeforeChange(changes) {
    const changedColumns = changes.reduce((acc, [, columnProperty]) => {
      const visualColumn = this.hot.propToCol(columnProperty);

      if (Number.isInteger(visualColumn) && acc.indexOf(visualColumn) === -1) {
        acc.push(visualColumn);
      }

      return acc;
    }, []);

    this.#visualColumnsToRefresh.push(...changedColumns);
  }

  /**
   * On before column resize listener.
   *
   * @param {number} size Calculated new column width.
   * @param {number} column Visual index of the resized column.
   * @param {boolean} isDblClick  Flag that determines whether there was a double-click.
   * @returns {number}
   */
  #onBeforeColumnResize(size, column, isDblClick) {
    let newSize = size;

    if (isDblClick) {
      this.calculateColumnsWidth(column, undefined, true);

      newSize = this.getColumnWidth(column, undefined, false);
    }

    return newSize;
  }

  /**
   * On after Handsontable init fill plugin with all necessary values.
   */
  #onInit() {
    this.#cachedColumnHeaders = this.hot.getColHeader();
    this.recalculateAllColumnsWidth();
  }

  /**
   * After formulas values updated listener.
   *
   * @param {Array} changes An array of modified data.
   */
  #onAfterFormulasValuesUpdate(changes) {
    const changedColumns = changes.reduce((acc, change) => {
      const physicalColumn = change.address?.col;

      if (Number.isInteger(physicalColumn)) {
        const visualColumn = this.hot.toVisualColumn(physicalColumn);

        if (acc.indexOf(visualColumn) === -1) {
          acc.push(visualColumn);
        }
      }

      return acc;
    }, []);

    this.#visualColumnsToRefresh.push(...changedColumns);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}
