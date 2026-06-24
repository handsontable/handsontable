import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { cancelAnimationFrame, requestAnimationFrame } from '../../helpers/feature';
import GhostTable from '../../utils/ghostTable';
import { isObject } from '../../helpers/object';
import { valueAccordingPercent, rangeEach } from '../../helpers/number';
import SamplesGenerator from '../../utils/samplesGenerator';
import { isPercentValue } from '../../helpers/string';
import { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { addClass, removeClass } from '../../helpers/dom/element';

export const PLUGIN_KEY = 'autoRowSize';
export const PLUGIN_PRIORITY = 40;
const ROW_WIDTHS_MAP_NAME = 'autoRowSize';
const FIRST_COLUMN_NOT_RENDERED_CLASS_NAME = 'htFirstDatasetColumnNotRendered';
const AUTO_ROW_SIZE_CLASS_NAME = 'htAutoRowSize';

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
 * ::: tip
 * Note: Updating some of the table's settings can cause the row heights to change (e.g. `wordWrap`, `textEllipsis`, renderers etc.).
 * In those cases, to ensure that the row heights are properly recalculated, you need to call the {@link AutoRowSize#recalculateAllRowsHeight} method after calling {@link Core#updateSettings}.
 * :::
 *
 * ::: tip
 * If you use custom renderers, multiline text, or custom styles that produce non-standard row heights, and you call
 * {@link Core#scrollViewportTo}, you must enable `AutoRowSize`. Without it, `scrollViewportTo()` calculates scroll
 * positions based on the default row height and may scroll to an incorrect position.
 * :::
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
 *
 * ::: only-for angular
 * ```ts
 * import { AfterViewInit, Component, ViewChild } from "@angular/core";
 * import {
 *   GridSettings,
 *   HotTableModule,
 *   HotTableComponent,
 * } from "@handsontable/angular-wrapper";
 *
 * `@Component`({
 *   selector: "app-example",
 *   standalone: true,
 *   imports: [HotTableModule],
 *   template: ` <div>
 *     <hot-table [settings]="gridSettings" />
 *   </div>`,
 * })
 * export class ExampleComponent implements AfterViewInit {
 *   `@ViewChild`(HotTableComponent, { static: false })
 *   readonly hotTable!: HotTableComponent;
 *
 *   readonly gridSettings = <GridSettings>{
 *     data: this.getData(),
 *     autoRowSize: true,
 *   };
 *
 *   ngAfterViewInit(): void {
 *     // Access to plugin instance:
 *     const hot = this.hotTable.hotInstance;
 *     const plugin = hot.getPlugin("autoRowSize");
 *
 *     plugin.getRowHeight(4);
 *
 *     if (plugin.isEnabled()) {
 *       // code...
 *     }
 *   }
 *
 *   private getData(): Array<*> {
 *     // get some data
 *   }
 * }
 * ```
 * :::
 */
export class AutoRowSize extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns `true` so the plugin updates on every `updateSettings` call, regardless of config object contents.
   */
  static get SETTING_KEYS(): string[] | boolean {
    return true;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS(): { useHeaders: boolean; samplingRatio: number | null; allowSampleDuplicates: boolean } {
    return {
      useHeaders: true,
      samplingRatio: null,
      allowSampleDuplicates: false,
    };
  }

  /**
   * Returns the number of rows processed in a single calculation step during asynchronous sizing.
   */
  static get CALCULATION_STEP() {
    return 50;
  }

  /**
   * Returns the maximum number of rows whose heights are calculated synchronously before switching to async mode.
   */
  static get SYNC_CALCULATION_LIMIT() {
    return 500;
  }

  /**
   * Columns header's height cache.
   *
   * @private
   * @type {number}
   */
  headerHeight: number | null = null;
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
  samplesGenerator = new SamplesGenerator((row: number, column: number) => {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (this.hot.columnIndexMapper.isHidden(physicalColumn)) {
      return false;
    }

    let cellMeta;

    if (row >= 0 && column >= 0) {
      cellMeta = this.hot.getCellMeta(row, column);

      if (cellMeta.hidden) {
        // do not generate samples for cells that are covered by merged cell (null values)
        return false;
      }
    }

    let cellValue;

    if (row >= 0) {
      cellValue = this.hot.getDataAtCell(row, column);

      if (typeof cellMeta?.valueFormatter === 'function') {
        cellValue = (cellMeta.valueFormatter as (v: unknown, meta: unknown) => unknown)(cellValue, cellMeta);
      }
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
  inProgress: boolean = false;
  /**
   * Number of already measured rows (we already know their sizes).
   *
   * @type {number}
   */
  measuredRows: number = 0;
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
  #visualRowsToRefresh: number[] = [];
  /**
   * Disposer function for the row heights map observer. Called on disable to clean up.
   *
   * @type {Function|null}
   */
  #disposeMapObserver: (() => void) | null = null;
  /**
   * `true` value indicates that the #onInit() function has been already called.
   *
   * @type {boolean}
   */
  #isInitialized = false;

  /**
   * Initializes the plugin, registers the row heights map, and sets up the row resize hook.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);
    this.hot.rowIndexMapper.registerMap(ROW_WIDTHS_MAP_NAME, this.rowHeightsMap);

    // Leave the listener active to allow auto-sizing the rows when the plugin is disabled.
    // This is necessary for height recalculation for resize handler doubleclick (ManualRowResize).
    this.addHook('beforeRowResize', this.#onBeforeRowResize);
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link AutoRowSize#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    const settings = this.hot.getSettings()[PLUGIN_KEY];

    return settings === true || isObject(settings);
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.samplesGenerator.setAllowDuplicates(this.getSetting<boolean>('allowSampleDuplicates'));

    const samplingRatio = this.getSetting<number | null>('samplingRatio');

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.samplesGenerator.setSampleCount(samplingRatio);
    }

    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('beforeChangeRender', this.#onBeforeChange);
    this.addHook('beforeColumnResize', () => this.recalculateAllRowsHeight());
    this.addHook('afterFormulasValuesUpdate', this.#onAfterFormulasValuesUpdate);
    this.addHook('beforeViewRender', this.#onBeforeViewRender);
    this.addHook('beforeRender', this.#onBeforeRender);
    this.addHook('modifyRowHeight', (height: number, row: number) => this.getRowHeight(row, height));
    this.addHook('init', this.#onInit);
    this.addHook('modifyColumnHeaderHeight', () => this.getColumnHeaderHeight());

    this.#disposeMapObserver = this.hot.rowIndexMapper
      .observeMapChange(this.rowHeightsMap, () => {
        this.hot.view?.invalidateRowHeightCache();
      });

    addClass(this.hot.rootElement, AUTO_ROW_SIZE_CLASS_NAME);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    if (this.#disposeMapObserver) {
      this.#disposeMapObserver();
      this.#disposeMapObserver = null;
    }

    this.headerHeight = null;

    removeClass(this.hot.rootElement, AUTO_ROW_SIZE_CLASS_NAME);

    super.disablePlugin();

    // Remove the "first dataset column not rendered" class name when the plugin is disabled.
    this.#toggleFirstDatasetColumnRenderedClassName(false);

    // Leave the listener active to allow auto-sizing the rows when the plugin is disabled.
    // This is necessary for height recalculation for resize handler doubleclick (ManualRowResize).
    this.addHook('beforeRowResize', this.#onBeforeRowResize);
  }

  /**
   * Calculates heights for visible rows in the viewport only.
   */
  calculateVisibleRowsHeight(): void {
    // Keep last row heights unchanged for situation when all columns was deleted or trimmed
    if (!this.hot.countCols()) {
      return;
    }

    const firstVisibleRow = this.getFirstVisibleRow();
    const lastVisibleRow = this.getLastVisibleRow();

    if (firstVisibleRow === -1 || lastVisibleRow === -1) {
      return;
    }

    const overwriteCache = this.hot.forceFullRender;

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
    rowRange: number | { from: number, to: number } = { from: 0, to: this.hot.countRows() - 1 },
    colRange: number | { from: number, to: number } = { from: 0, to: this.hot.countCols() - 1 },
    overwriteCache: boolean = false
  ): void {
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
        this.ghostTable.getHeights((row: number, height: number) => {
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
  calculateAllRowsHeight(
    colRange: number | { from: number, to: number } = { from: 0, to: this.hot.countCols() - 1 },
    overwriteCache: boolean = false
  ): void {
    let current = 0;
    const length = this.hot.countRows() - 1;
    let timer = 0;

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
  #calculateSpecificRowsHeight(visualRows: number[]) {
    const columnsRange = {
      from: 0,
      to: this.hot.countCols() - 1,
    };

    visualRows.forEach((visualRow: number) => {
      // For rows we must calculate row height even when user had set height value manually.
      // We can shrink column but cannot shrink rows!
      const samples = this.samplesGenerator.generateRowSamples(visualRow, columnsRange);

      samples.forEach((sample, row) => this.ghostTable.addRow(row, sample));
    });

    if (this.ghostTable.rows.length) {
      this.hot.batchExecution(() => {
        this.ghostTable.getHeights((visualRow: number, height: number) => {
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
  recalculateAllRowsHeight(): void {
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
  getSyncCalculationLimit(): number {
    const settings = this.hot.getSettings()[PLUGIN_KEY];
    /* eslint-disable no-bitwise */
    let limit = AutoRowSize.SYNC_CALCULATION_LIMIT;
    const rowsLimit = this.hot.countRows() - 1;

    if (isObject(settings)) {
      limit = this.getSetting<number>('syncLimit');

      if (isPercentValue(limit as unknown as string)) {
        limit = valueAccordingPercent(rowsLimit, limit as unknown as string);
      } else {
        // Force to integer (NaN — e.g. when syncLimit is undefined — falls back to 0)
        const numericLimit = Number(limit);

        limit = Number.isFinite(numericLimit) ? Math.trunc(numericLimit) : 0;
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
  getRowHeight(row: number, defaultHeight: number = this.hot.stylesHandler.getDefaultRowHeight(row) ?? 0): number {
    if (row < 0) {
      return this.headerHeight ?? defaultHeight;
    }

    const physicalRow = this.hot.toPhysicalRow(row);

    if (this.hot.rowIndexMapper.isHidden(physicalRow)) {
      return defaultHeight;
    }

    const cachedHeight = this.rowHeightsMap.getValueAtIndex<number>(physicalRow);
    let height = defaultHeight;

    if (cachedHeight !== undefined && cachedHeight !== null && cachedHeight > defaultHeight) {
      height = cachedHeight;

      if (row === this.hot.view.getFirstRenderedVisibleRow()) {
        // add 1px border-top-width compensation for the first rendered row
        height += 1;
      }
    }

    return height;
  }

  /**
   * Get the calculated column header height.
   *
   * @returns {number|undefined}
   */
  getColumnHeaderHeight(): number | null | undefined {
    return this.headerHeight;
  }

  /**
   * Get the first visible row.
   *
   * When the {@link MergeCells} plugin is enabled with its default `virtualized: false` setting, a merged
   * cell that crosses the viewport edge extends the rendered row range. In that case this method can
   * return a row index outside the strictly visible viewport. To read the actual visible viewport, use
   * {@link Core#getFirstFullyVisibleRow} or {@link Core#getFirstPartiallyVisibleRow}.
   *
   * @returns {number} Returns row index, -1 if table is not rendered or if there are no rows to base the the calculations on.
   */
  getFirstVisibleRow(): number {
    return this.hot.getFirstRenderedVisibleRow() ?? -1;
  }

  /**
   * Gets the last visible row.
   *
   * When the {@link MergeCells} plugin is enabled with its default `virtualized: false` setting, a merged
   * cell that crosses the viewport edge extends the rendered row range. In that case this method can
   * return a row index outside the strictly visible viewport. To read the actual visible viewport, use
   * {@link Core#getLastFullyVisibleRow} or {@link Core#getLastPartiallyVisibleRow}.
   *
   * @returns {number} Returns row index or -1 if table is not rendered.
   */
  getLastVisibleRow(): number {
    return this.hot.getLastRenderedVisibleRow() ?? -1;
  }

  /**
   * Clears cache of calculated row heights. If you want to clear only selected rows pass an array with their indexes.
   * Otherwise whole cache will be cleared.
   *
   * @param {number[]} [physicalRows] List of physical row indexes to clear.
   */
  clearCache(physicalRows?: number[]): void {
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
  clearCacheByRange(range: number | { from: number, to: number }): void {
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
  isNeedRecalculate(): boolean {
    return !!this.rowHeightsMap.getValues()
      .slice(0, this.measuredRows).filter(item => (item === null)).length;
  }

  /**
   * Toggles the "first dataset column not rendered" class name.
   * Used to apply special styling when the first column is visible (used only in the classic (legacy) theme, with the AutoRowSize plugin enabled).
   *
   * @param {boolean} [forceState] Force the class to be added or removed (`true` to add, `false` to remove).
   */
  #toggleFirstDatasetColumnRenderedClassName(forceState?: boolean) {
    const firstRenderedColumnVisualIndex = this.hot.getFirstRenderedVisibleColumn();
    const firstRenderedColumnPhysicalIndex =
      this.hot.columnIndexMapper.getPhysicalFromVisualIndex(firstRenderedColumnVisualIndex);

    if (
      forceState === false ||
      firstRenderedColumnPhysicalIndex === this.hot.columnIndexMapper.getPhysicalFromRenderableIndex(0)
    ) {
      removeClass(this.hot.rootElement, FIRST_COLUMN_NOT_RENDERED_CLASS_NAME);

    } else {
      addClass(this.hot.rootElement, FIRST_COLUMN_NOT_RENDERED_CLASS_NAME);
    }
  }

  /**
   * Toggles the `htFirstDatasetColumnNotRendered` CSS class based on whether the first
   * physical column is currently in the renderable viewport.
   */
  #onBeforeViewRender = () => {
    this.#toggleFirstDatasetColumnRenderedClassName();
  };

  /**
   * Recalculates heights for currently visible rows and processes any rows queued by data
   * changes before the next render.
   */
  #onBeforeRender = () => {
    this.calculateVisibleRowsHeight();

    if (!this.inProgress) {
      this.#calculateSpecificRowsHeight(this.#visualRowsToRefresh);
      this.#visualRowsToRefresh = [];
    }
  };

  /**
   * Recalculates the row height from content on a double-click and returns it as the new
   * size; returns the user-dragged size otherwise.
   */
  #onBeforeRowResize = (size: number, row: number, isDblClick: boolean) => {
    let newSize = size;

    if (isDblClick) {
      this.calculateRowsHeight(row, undefined, true);

      newSize = this.getRowHeight(row);
    }

    return newSize;
  };

  /**
   * Triggers a full row height recalculation after new data is loaded, skipping the initial
   * load since `#onInit` already handles it.
   */
  #onAfterLoadData = (_sourceData: unknown[], isFirstLoad: boolean) => {
    if (!isFirstLoad) {
      this.recalculateAllRowsHeight();
    }
  };

  /**
   * Queues the visual row indexes affected by the incoming changes so their heights are
   * recalculated on the next render.
   */
  #onBeforeChange = (changes: unknown[][]) => {
    const changedRows = changes.reduce<number[]>((acc, [row]: unknown[]) => {
      const rowIndex = Number(row);

      if (acc.indexOf(rowIndex) === -1) {
        acc.push(rowIndex);
      }

      return acc;
    }, [] as number[]);

    this.#visualRowsToRefresh.push(...changedRows);
  };

  /**
   * Triggers the first full row height recalculation after Handsontable has finished initializing.
   */
  #onInit = () => {
    this.recalculateAllRowsHeight();
    this.#isInitialized = true;
  };

  /**
   * Queues visual row indexes whose formula results changed so their heights are recalculated
   * before the next render. Skips changes belonging to a different sheet.
   */
  #onAfterFormulasValuesUpdate = (changes: unknown[]) => {
    if (!this.#isInitialized) {
      return;
    }

    const formulasPlugin = this.hot.getPlugin('formulas');
    const sheetId = (formulasPlugin as unknown as Record<string, unknown> | undefined)?.sheetId;

    const changedRows = changes.reduce<number[]>((acc, change: unknown) => {
      const changeRecord = change as Record<string, unknown>;

      if (sheetId !== null && sheetId !== undefined &&
          (changeRecord.address as Record<string, unknown>)?.sheet !== sheetId) {
        return acc;
      }

      const physicalRow = Number((changeRecord.address as Record<string, unknown>)?.row);

      if (Number.isInteger(physicalRow)) {
        const visualRow = this.hot.toVisualRow(physicalRow);

        if (visualRow !== null && acc.indexOf(visualRow) === -1) {
          acc.push(visualRow);
        }
      }

      return acc;
    }, [] as number[]);

    this.#visualRowsToRefresh.push(...changedRows);
  };

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.ghostTable.clean();
    super.destroy();
  }
}
