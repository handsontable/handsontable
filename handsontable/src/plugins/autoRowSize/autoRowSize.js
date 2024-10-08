import { BasePlugin } from '../base';
import { cancelAnimationFrame, requestAnimationFrame } from '../../helpers/feature';
import GhostTable from '../../utils/ghostTable';
import { isObject } from '../../helpers/object';
import { valueAccordingPercent, rangeEach } from '../../helpers/number';
import SamplesGenerator from '../../utils/samplesGenerator';
import { isPercentValue } from '../../helpers/string';
import { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';

export const PLUGIN_KEY = 'autoRowSize';
export const PLUGIN_PRIORITY = 40;
const ROW_WIDTHS_MAP_NAME = 'autoRowSize';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin AutoRowSize
 * @class AutoRowSize
 * @description
 * The `AutoRowSize` plugin allows you to set row heights based on their highest cells.
 *
 * By default, the plugin is declared as `undefined`, which makes it disabled (same as if it was declared as `false`).
 * Enabling this plugin may decrease the overall table performance, as it needs to calculate the heights of all cells to
 * resize the rows accordingly.
 * If you experience problems with the performance, try turning this feature off and declaring the row heights manually.
 *
 * But, to display Handsontable's scrollbar in a proper size, you need to enable the `AutoRowSize` plugin,
 * by setting the [`autoRowSize`](@/api/options.md#autoRowSize) option to `true`.
 *
 * Row height calculations are divided into sync and async part. Each of this parts has their own advantages and
 * disadvantages. Synchronous calculations are faster but they block the browser UI, while the slower asynchronous
 * operations don't block the browser UI.
 *
 * To configure the sync/async distribution, you can pass an absolute value (number of rows) or a percentage value to a config object:
 * ```js
 * // as a number (300 rows in sync, rest async)
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
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   data: getData(),
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
 *   autoRowSize={true}
 * />
 *
 * ...
 *
 * // Access to plugin instance:
 * const hot = hotRef.current.hotInstance;
 * const plugin = hot.getPlugin('autoRowSize');
 *
 * plugin.getRowHeight(4);
 *
 * if (plugin.isEnabled()) {
 *   // code...
 * }
 * ```
 * :::
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
export class AutoRowSize extends BasePlugin {
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
    return 500;
  }

  /**
   * Columns header's height cache.
   *
   * @private
   * @type {number}
   */
  headerHeight = null;
  /**
   * Instance of {@link GhostTable} for rows and columns size calculations.
   *
   * @private
   * @type {GhostTable}
   */
  ghostTable = new GhostTable(this.hot);
  /**
   * Instance of {@link SamplesGenerator} for generating samples necessary for rows height calculations.
   *
   * @private
   * @type {SamplesGenerator}
   */
  samplesGenerator = new SamplesGenerator((row, column) => {
    const physicalRow = this.hot.toPhysicalRow(row);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (this.hot.rowIndexMapper.isHidden(physicalRow) || this.hot.columnIndexMapper.isHidden(physicalColumn)) {
      return false;
    }

    if (row >= 0 && column >= 0) {
      const cellMeta = this.hot.getCellMeta(row, column);

      if (cellMeta.hidden) {
        // do not generate samples for cells that are covered by merged cell (null values)
        return false;
      }
    }

    let cellValue;

    if (row >= 0) {
      cellValue = this.hot.getDataAtCell(row, column);

    } else if (row === -1) {
      cellValue = this.hot.getColHeader(column);
    }

    return { value: cellValue };
  });
  /**
   * `true` if the size calculation is in progress.
   *
   * @type {boolean}
   */
  inProgress = false;
  /**
   * Number of already measured rows (we already know their sizes).
   *
   * @type {number}
   */
  measuredRows = 0;
  /**
   * PhysicalIndexToValueMap to keep and track heights for physical row indexes.
   *
   * @private
   * @type {PhysicalIndexToValueMap}
   */
  rowHeightsMap = new IndexToValueMap();
  /**
   * An array of row indexes whose height will be recalculated.
   *
   * @type {number[]}
   */
  #visualRowsToRefresh = [];

  constructor(hotInstance) {
    super(hotInstance);
    this.hot.rowIndexMapper.registerMap(ROW_WIDTHS_MAP_NAME, this.rowHeightsMap);

    // Leave the listener active to allow auto-sizing the rows when the plugin is disabled.
    // This is necessary for height recalculation for resize handler doubleclick (ManualRowResize).
    this.addHook('beforeRowResize', (size, row, isDblClick) => this.#onBeforeRowResize(size, row, isDblClick));
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link AutoRowSize#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    const settings = this.hot.getSettings()[PLUGIN_KEY];

    return settings === true || isObject(settings);
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.samplesGenerator.setAllowDuplicates(this.getSetting('allowSampleDuplicates'));

    const samplingRatio = this.getSetting('samplingRatio');

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.samplesGenerator.setSampleCount(parseInt(samplingRatio, 10));
    }

    this.addHook('afterLoadData', (...args) => this.#onAfterLoadData(...args));
    this.addHook('beforeChangeRender', (...args) => this.#onBeforeChange(...args));
    this.addHook('beforeColumnResize', () => this.recalculateAllRowsHeight());
    this.addHook('afterFormulasValuesUpdate', (...args) => this.#onAfterFormulasValuesUpdate(...args));
    this.addHook('beforeRender', () => this.#onBeforeRender());
    this.addHook('modifyRowHeight', (height, row) => this.getRowHeight(row, height));
    this.addHook('init', () => this.#onInit());
    this.addHook('modifyColumnHeaderHeight', () => this.getColumnHeaderHeight());

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.headerHeight = null;

    super.disablePlugin();

    // Leave the listener active to allow auto-sizing the rows when the plugin is disabled.
    // This is necessary for height recalculation for resize handler doubleclick (ManualRowResize).
    this.addHook('beforeRowResize', (size, row, isDblClick) => this.#onBeforeRowResize(size, row, isDblClick));
  }

  /**
   * Calculates heights for visible rows in the viewport only.
   */
  calculateVisibleRowsHeight() {
    // Keep last row heights unchanged for situation when all columns was deleted or trimmed
    if (!this.hot.countCols()) {
      return;
    }

    const firstVisibleRow = this.getFirstVisibleRow();
    const lastVisibleRow = this.getLastVisibleRow();

    if (firstVisibleRow === -1 || lastVisibleRow === -1) {
      return;
    }

    const overwriteCache = this.hot.renderCall;

    this.calculateRowsHeight({ from: firstVisibleRow, to: lastVisibleRow }, undefined, overwriteCache);
  }

  /**
   * Calculate a given rows height.
   *
   * @param {number|object} rowRange Row index or an object with `from` and `to` indexes as a range.
   * @param {number|object} colRange Column index or an object with `from` and `to` indexes as a range.
   * @param {boolean} [overwriteCache=false] If `true` the calculation will be processed regardless of whether the width exists in the cache.
   */
  calculateRowsHeight(
    rowRange = { from: 0, to: this.hot.countRows() - 1 },
    colRange = { from: 0, to: this.hot.countCols() - 1 },
    overwriteCache = false
  ) {
    const rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;
    const columnsRange = typeof colRange === 'number' ? { from: colRange, to: colRange } : colRange;

    if (this.hot.getColHeader(0) !== null) {
      const samples = this.samplesGenerator.generateRowSamples(-1, columnsRange);

      this.ghostTable.addColumnHeadersRow(samples.get(-1));
    }

    rangeEach(rowsRange.from, rowsRange.to, (visualRow) => {
      let physicalRow = this.hot.toPhysicalRow(visualRow);

      if (physicalRow === null) {
        physicalRow = visualRow;
      }

      // For rows we must calculate row height even when user had set height value manually.
      // We can shrink column but cannot shrink rows!
      if (overwriteCache || this.rowHeightsMap.getValueAtIndex(physicalRow) === null) {
        const samples = this.samplesGenerator.generateRowSamples(visualRow, columnsRange);

        samples.forEach((sample, row) => this.ghostTable.addRow(row, sample));
      }
    });

    if (this.ghostTable.rows.length) {
      this.hot.batchExecution(() => {
        this.ghostTable.getHeights((row, height) => {
          if (row < 0) {
            this.headerHeight = height;
          } else {
            this.rowHeightsMap.setValueAtIndex(this.hot.toPhysicalRow(row), height);
          }
        });
      }, true);

      this.measuredRows = rowsRange.to + 1;
      this.ghostTable.clean();
    }
  }

  /**
   * Calculate all rows heights. The calculated row will be cached in the {@link AutoRowSize#heights} property.
   * To retrieve height for specified row use {@link AutoRowSize#getRowHeight} method.
   *
   * @param {object|number} colRange Row index or an object with `from` and `to` properties which define row range.
   * @param {boolean} [overwriteCache] If `true` the calculation will be processed regardless of whether the width exists in the cache.
   */
  calculateAllRowsHeight(colRange = { from: 0, to: this.hot.countCols() - 1 }, overwriteCache = false) {
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

      this.calculateRowsHeight({
        from: current,
        to: Math.min(current + AutoRowSize.CALCULATION_STEP, length)
      }, colRange, overwriteCache);

      current = current + AutoRowSize.CALCULATION_STEP + 1;

      if (current < length) {
        timer = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(timer);
        this.inProgress = false;

        // @TODO Should call once per render cycle, currently fired separately in different plugins
        this.hot.view.adjustElementsSize();

        // tmp
        if (this.hot.view._wt.wtOverlays.inlineStartOverlay.needFullRender) {
          this.hot.view._wt.wtOverlays.inlineStartOverlay.clone.draw();
        }
      }
    };

    const syncLimit = this.getSyncCalculationLimit();

    // sync
    if (syncLimit >= 0) {
      this.calculateRowsHeight({ from: 0, to: syncLimit }, colRange, overwriteCache);
      current = syncLimit + 1;
    }
    // async
    if (current < length) {
      loop();
    } else {
      this.inProgress = false;
      this.hot.view.adjustElementsSize();
    }
  }

  /**
   * Calculates specific rows height (overwrite cache values).
   *
   * @param {number[]} visualRows List of visual rows to calculate.
   */
  #calculateSpecificRowsHeight(visualRows) {
    const columnsRange = {
      from: 0,
      to: this.hot.countCols() - 1,
    };

    visualRows.forEach((visualRow) => {
      // For rows we must calculate row height even when user had set height value manually.
      // We can shrink column but cannot shrink rows!
      const samples = this.samplesGenerator.generateRowSamples(visualRow, columnsRange);

      samples.forEach((sample, row) => this.ghostTable.addRow(row, sample));
    });

    if (this.ghostTable.rows.length) {
      this.hot.batchExecution(() => {
        this.ghostTable.getHeights((visualRow, height) => {
          const physicalRow = this.hot.toPhysicalRow(visualRow);

          this.rowHeightsMap.setValueAtIndex(physicalRow, height);
        });
      }, true);

      this.ghostTable.clean();
    }
  }

  /**
   * Recalculates all rows height (overwrite cache values).
   */
  recalculateAllRowsHeight() {
    if (this.hot.view.isVisible()) {
      this.calculateAllRowsHeight({ from: 0, to: this.hot.countCols() - 1 }, true);
    }
  }

  /**
   * Gets value which tells how many rows should be calculated synchronously (rest of the rows will be calculated
   * asynchronously). The limit is calculated based on `syncLimit` set to autoRowSize option (see {@link Options#autoRowSize}).
   *
   * @returns {number}
   */
  getSyncCalculationLimit() {
    const settings = this.hot.getSettings()[PLUGIN_KEY];
    /* eslint-disable no-bitwise */
    let limit = AutoRowSize.SYNC_CALCULATION_LIMIT;
    const rowsLimit = this.hot.countRows() - 1;

    if (isObject(settings)) {
      limit = settings.syncLimit;

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
   * Get a row's height, as measured in the DOM.
   *
   * The height returned includes 1 px of the row's bottom border.
   *
   * Mind that this method is different from the
   * [`getRowHeight()`](@/api/core.md#getrowheight) method
   * of Handsontable's [Core](@/api/core.md).
   *
   * @param {number} row A visual row index.
   * @param {number} [defaultHeight] If no height is found, `defaultHeight` is returned instead.
   * @returns {number} The height of the specified row, in pixels.
   */
  getRowHeight(row, defaultHeight) {
    const cachedHeight = row < 0 ? this.headerHeight : this.rowHeightsMap.getValueAtIndex(this.hot.toPhysicalRow(row));
    let height = defaultHeight;

    if (cachedHeight !== null && cachedHeight > (defaultHeight || 0)) {
      height = cachedHeight;
    }

    return height;
  }

  /**
   * Get the calculated column header height.
   *
   * @returns {number|undefined}
   */
  getColumnHeaderHeight() {
    return this.headerHeight;
  }

  /**
   * Get the first visible row.
   *
   * @returns {number} Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.
   */
  getFirstVisibleRow() {
    return this.hot.getFirstRenderedVisibleRow() ?? -1;
  }

  /**
   * Gets the last visible row.
   *
   * @returns {number} Returns row index or -1 if table is not rendered.
   */
  getLastVisibleRow() {
    return this.hot.getLastRenderedVisibleRow() ?? -1;
  }

  /**
   * Clears cache of calculated row heights. If you want to clear only selected rows pass an array with their indexes.
   * Otherwise whole cache will be cleared.
   *
   * @param {number[]} [physicalRows] List of physical row indexes to clear.
   */
  clearCache(physicalRows) {
    this.headerHeight = null;

    if (Array.isArray(physicalRows)) {
      this.hot.batchExecution(() => {
        physicalRows.forEach((physicalIndex) => {
          this.rowHeightsMap.setValueAtIndex(physicalIndex, null);
        });
      }, true);

    } else {
      this.rowHeightsMap.clear();
    }
  }

  /**
   * Clears cache by range.
   *
   * @param {object|number} range Row index or an object with `from` and `to` properties which define row range.
   */
  clearCacheByRange(range) {
    const { from, to } = typeof range === 'number' ? { from: range, to: range } : range;

    this.hot.batchExecution(() => {
      rangeEach(Math.min(from, to), Math.max(from, to), (row) => {
        this.rowHeightsMap.setValueAtIndex(row, null);
      });
    }, true);
  }

  /**
   * Checks if all heights were calculated. If not then return `true` (need recalculate).
   *
   * @returns {boolean}
   */
  isNeedRecalculate() {
    return !!this.rowHeightsMap.getValues()
      .slice(0, this.measuredRows).filter(item => (item === null)).length;
  }

  /**
   * On before view render listener.
   */
  #onBeforeRender() {
    this.calculateVisibleRowsHeight();

    if (!this.inProgress) {
      this.#calculateSpecificRowsHeight(this.#visualRowsToRefresh);
      this.#visualRowsToRefresh = [];
    }
  }

  /**
   * On before row resize listener.
   *
   * @param {number} size The size of the current row index.
   * @param {number} row Current row index.
   * @param {boolean} isDblClick Indicates if the resize was triggered by doubleclick.
   * @returns {number}
   */
  #onBeforeRowResize(size, row, isDblClick) {
    let newSize = size;

    if (isDblClick) {
      this.calculateRowsHeight(row, undefined, true);

      newSize = this.getRowHeight(row);
    }

    return newSize;
  }

  /**
   * On after load data listener.
   *
   * @param {Array} sourceData Source data.
   * @param {boolean} isFirstLoad `true` if this is the first load.
   */
  #onAfterLoadData(sourceData, isFirstLoad) {
    if (!isFirstLoad) {
      this.recalculateAllRowsHeight();
    }
  }

  /**
   * On before change listener.
   *
   * @param {Array} changes 2D array containing information about each of the edited cells.
   */
  #onBeforeChange(changes) {
    const changedRows = changes.reduce((acc, [row]) => {
      if (acc.indexOf(row) === -1) {
        acc.push(row);
      }

      return acc;
    }, []);

    this.#visualRowsToRefresh.push(...changedRows);
  }

  /**
   * On after Handsontable init plugin with all necessary values.
   */
  #onInit() {
    this.recalculateAllRowsHeight();
  }

  /**
   * After formulas values updated listener.
   *
   * @param {Array} changes An array of modified data.
   */
  #onAfterFormulasValuesUpdate(changes) {
    const changedRows = changes.reduce((acc, change) => {
      const physicalRow = change.address?.row;

      if (Number.isInteger(physicalRow)) {
        const visualRow = this.hot.toVisualRow(physicalRow);

        if (acc.indexOf(visualRow) === -1) {
          acc.push(visualRow);
        }
      }

      return acc;
    }, []);

    this.#visualRowsToRefresh.push(...changedRows);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.ghostTable.clean();
    super.destroy();
  }
}
