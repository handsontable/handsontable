import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { cancelIdleTask, requestIdleTask } from '../../helpers/feature';
import GhostTable from '../../utils/ghostTable';
import { isObject, hasOwnProperty } from '../../helpers/object';
import { valueAccordingPercent, rangeEach } from '../../helpers/number';
import SamplesGenerator from '../../utils/samplesGenerator';
import { isPercentValue } from '../../helpers/string';
import { formatCellValue } from '../../renderers/renderCell';
import type { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { addClass, removeClass } from '../../helpers/dom/element';
import { FONT_REMEASURE_ROWS_ORDER_INDEX } from '../../core/fontLoad';
import { isAutoRowSizeOn } from '../../core/rowHeightSetting';
import { LICENSE } from './feature.generated';
import { toStoredRowHeight } from './helpers/measuredRowHeight';

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
 * ```
 *
 * To speed up the calculations, the plugin samples a subset of rows rather than measuring every row. By default, it
 * skips rows whose value it has already sampled, on the assumption that identical values render at the same height.
 *
 * Sampling accepts additional options:
 * - *samplingRatio* - Defines how many samples for the same length will be used to calculate. Default is `3`.
 *
 * ```js
 *   autoRowSize: {
 *     samplingRatio: 10,
 *   }
 * ```
 *
 * Set the `allowSampleDuplicates` option to `true` to sample duplicate values as well:
 *
 * ```js
 * autoRowSize: {allowSampleDuplicates: true},
 * ```
 *
 * Both sampling options take effect when you change them with {@link Core#updateSettings}, and the
 * row heights are recalculated so the new sampling is applied to rows that were already measured.
 * `samplingRatio` must be a whole number above zero; any other value falls back to the default.
 *
 * Enable this option when rows with the same value can still render at different heights - for example, with multiline
 * text, or with custom renderers that vary a row's height based on its position or other data. Without it, the plugin
 * may sample only one of those rows and apply its height to the rest, leading to incorrect row heights.
 *
 * The tradeoff is performance: allowing duplicates increases the number of rows measured, which lengthens the
 * calculation and can block the UI for longer on large data sets.
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
   * Returns the license token of the plugin, its display name, where it is checked, and the tokens it
   * requires.
   */
  static get LICENSE() {
    return LICENSE;
  }

  /**
   * Returns `true` so the plugin updates on every `updateSettings` call, regardless of config object contents.
   */
  static get SETTING_KEYS(): string[] | boolean {
    return true;
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   *
   * There is deliberately no `useHeaders` entry here, even though {@link AutoColumnSize} declares one.
   * That setting decides whether a header is rendered next to the samples being measured, and this
   * plugin never asks that question: a row's height is measured with its row header always attached
   * (see `GhostTable#createRow`, which keys off `hasRowHeaders()`), and the column header's own
   * height is measured separately by `addColumnHeadersRow`. Declaring the setting anyway would offer
   * a switch that changes nothing.
   */
  static get DEFAULT_SETTINGS(): { samplingRatio: number | null; allowSampleDuplicates: boolean } {
    return {
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
    let sourceRow = row;
    let sourceColumn = column;
    let block: { row: number, col: number, colspan: number } | null = null;

    if (row >= 0 && column >= 0) {
      // The transient read resolves the full dynamic meta (hooks + `cells`, so `hidden` from
      // merged cells works) without storing anything - this sampler sweeps every row, and the
      // eager `getCellMeta` would permanently materialize one meta per visited cell.
      cellMeta = this.hot.getCellMetaTransient(row, column);

      if (cellMeta.hidden) {
        // A covered cell holds no value of its own (null values), so it is not sampled - unless a merged
        // block whose first row or column is hidden is drawn on it. That block has no other cell to be
        // measured on, so its text is sampled here, at the width of the block.
        block = this.#getBlockDrawnOn(row, column);

        if (block === null) {
          return false;
        }

        sourceRow = block.row;
        sourceColumn = block.col;
        cellMeta = this.hot.getCellMetaTransient(sourceRow, sourceColumn);
      }
    }

    let cellValue;

    if (row >= 0) {
      cellValue = this.hot.getDataAtCell(sourceRow, sourceColumn);

      if (cellMeta) {
        // Format through the same precedence as the render path (cell-level `valueFormatter`, then
        // the renderer's own static), so the measured string matches what the renderer produces.
        cellValue = formatCellValue(cellValue, cellMeta, this.hot.getCellRenderer(cellMeta));
      }
    } else if (row === -1) {
      cellValue = this.hot.getColHeader(column);
    }

    if (block === null) {
      return { value: cellValue };
    }

    // Its own bucket, so the block's text is sampled whatever else the row holds: the usual buckets keep
    // a few strings of each length and skip a value that was already sampled.
    return { value: cellValue, block, bundleSeed: `mergedBlock:${sourceRow}:${sourceColumn}` };
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
  rowHeightsMap: IndexToValueMap;
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
   * `true` when a full row-height recalculation is already scheduled for the current
   * column-resize gesture. Resizing several selected columns fires `beforeColumnResize` once
   * per column in one synchronous loop — the flag coalesces those calls into a single
   * recalculation that runs after every new width has been applied.
   *
   * @type {boolean}
   */
  #columnResizeRecalcScheduled = false;
  /**
   * `true` when a full `clearCache()` wiped every measured height and the replacement pass has not
   * run yet.
   *
   * Only a render measures rows, and it measures just the visible band, so an emptied cache leaves
   * every row below the fold unmeasured for good. Such a row falls back to the default height,
   * which its own cell then refuses to honor once a wide wrapping column scrolls into view - a
   * cell never renders shorter than its text - while the row header, having nothing to push it
   * taller, does honor it. The two tables drift apart from there.
   *
   * The flag makes the next render restore the measurements the way `#onInit` does. Deferring
   * rather than measuring inside `clearCache()` keeps repeated calls down to one recalculation and
   * leaves `clearCache()` as cheap as it has always been.
   *
   * "The next render" means a full one: `beforeRender` is raised by `TableView#render()`, not by
   * the engine's scroll draw, so a caller that clears the cache and then only scrolls gets nothing.
   * Every documented use of `clearCache()` pairs it with a redraw.
   *
   * A font re-measure (`#onAfterFontsLoad`) that finds no columns owes its work the same way.
   *
   * @type {boolean}
   */
  #fullRecalculationScheduled = false;
  /**
   * `true` when a font re-measure measured the rows while AutoColumnSize was still re-measuring the columns
   * in idle tasks. The columns it had not reached kept their fallback-font widths, so the text wrapped more
   * in them, and the rows outside the rendered band kept the extra height. The first render of a visible
   * grid after that sweep ends schedules a full recalculation.
   *
   * @type {boolean}
   */
  #rowsOwedToColumnSweep = false;
  /**
   * Handle of the idle task driving the in-flight full sweep, or `0` when none is running.
   *
   * Held on the instance rather than in `calculateAllRowsHeight()`'s closure so a new sweep can
   * abandon the one before it - see the cancellation there.
   *
   * @type {number}
   */
  #idleSweepTimer = 0;

  /**
   * `true` when something that moves the cell a merged block is drawn on may have changed since the last
   * render: rows or columns hidden, shown, trimmed or moved, or a merge added or removed. The next render
   * compares the cells again (`#remeasureMovedBlocks()`).
   *
   * @type {boolean}
   */
  #mergedBlocksChanged = false;
  /**
   * The covered cells that merged blocks were drawn on at the last comparison, with the width of the block
   * from each. The key holds the physical row and column and that width, and the value the physical row.
   * A block whose top-left cell is hidden is measured on the cell it is drawn on, so a height cached for
   * a row stays valid only while the row is, or is not, such a cell. Empty without such a block.
   *
   * @type {Map<string, number>}
   */
  #blockCarriers = new Map<string, number>();
  /**
   * The physical row a block is drawn on, by the physical top-left cell of that block, as of the last
   * comparison. A change of that cell's text changes what the block's row is measured to, so
   * `#onBeforeChange` finds the row here. Empty without a block drawn on a covered cell.
   *
   * @type {Map<string, number>}
   */
  #blockOrigins = new Map<string, number>();
  /**
   * The rows whose cached height was dropped while they were hidden, and not measured then: a hidden row
   * takes the default height, so a measurement would be wasted. They are measured once they are shown.
   *
   * @type {Set<number>}
   */
  #hiddenRowsToRemeasure = new Set<number>();

  /**
   * Initializes the plugin, registers the row heights map, and sets up the row resize hook.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);
    // The map holds numbers only, so re-writing an unchanged height is a no-op that must not
    // invalidate the row-height position cache.
    this.rowHeightsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(
      ROW_WIDTHS_MAP_NAME, 'physicalIndexToValue', null, { skipUnchangedWrites: true },
    );

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
    return isAutoRowSizeOn(this.hot.getSettings()[PLUGIN_KEY]);
  }

  /**
   * Whether the sampling settings have been applied once, so a later `enablePlugin()` can tell a real
   * change from the first read.
   */
  #samplingApplied = false;
  /**
   * Set by an `enablePlugin()` that applied changed sampling settings to a plugin that measured before.
   * `BasePlugin` hands the new settings to `enablePlugin()`, so the `updatePlugin()` of the same
   * `updateSettings()` call no longer sees the change, and the sizes measured under the previous settings
   * stay cached (the map survives a disable). `updatePlugin()` consumes it.
   */
  #samplingChangedOnEnable = false;

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.#samplingChangedOnEnable = this.#applySamplingSettings() && this.#samplingApplied;
    this.#samplingApplied = true;

    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('afterFontsLoad', this.#onAfterFontsLoad, FONT_REMEASURE_ROWS_ORDER_INDEX);
    this.addHook('beforeChangeRender', this.#onBeforeChange);
    this.addHook('beforeColumnResize', this.#onBeforeColumnResize);
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

    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onIndexMapperCacheUpdated);
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#onIndexMapperCacheUpdated);
    this.addHook('afterMergeCells', this.#onMergedBlocksChanged);
    this.addHook('afterUnmergeCells', this.#onMergedBlocksChanged);
    this.addHook('afterUndo', this.#onMergesRestored);
    this.addHook('afterRedo', this.#onMergesRestored);
    this.addHook('afterUpdateSettings', this.#onAfterUpdateSettings);
    // Blocks may be drawn on covered cells already, which no earlier comparison has recorded.
    this.#mergedBlocksChanged = true;

    addClass(this.hot.rootElement, AUTO_ROW_SIZE_CLASS_NAME);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state after the table settings change.
   *
   * The sampling settings have to be re-read here, not only in `enablePlugin`: that method returns
   * early on an already-enabled plugin, and `BasePlugin` only re-runs the enable/disable pair when
   * the plugin's enabled state itself changed. Without this, `samplingRatio` and
   * `allowSampleDuplicates` were silently ignored whenever they arrived through `updateSettings`.
   *
   * The measured heights are dropped only when a sampling setting actually changed. The framework
   * wrappers re-send unchanged settings on every update (React on every commit), so clearing the
   * cache unconditionally would re-measure every row on each of them.
   *
   * @param {object} [newSettings] The settings passed to `updateSettings`.
   */
  updatePlugin(newSettings?: Record<string, unknown>): void {
    if (this.#applySamplingSettings() || this.#samplingChangedOnEnable) {
      this.clearCache();
    }

    this.#samplingChangedOnEnable = false;

    super.updatePlugin();
  }

  /**
   * Reads the sampling-related settings and applies them to the samples generator.
   *
   * @returns {boolean} `true` when a setting changed, which means the measured heights are stale.
   */
  #applySamplingSettings(): boolean {
    return this.samplesGenerator.applySamplingOptions({
      samplingRatio: this.getSetting('samplingRatio'),
      allowDuplicates: this.getSetting<boolean>('allowSampleDuplicates'),
    });
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    if (this.#disposeMapObserver) {
      this.#disposeMapObserver();
      this.#disposeMapObserver = null;
    }

    this.#unbindIndexMapperListeners();
    this.headerHeight = null;
    this.#rowsOwedToColumnSweep = false;
    this.#mergedBlocksChanged = false;
    this.#blockCarriers.clear();
    this.#blockOrigins.clear();
    this.#hiddenRowsToRemeasure.clear();

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

    // The cached header height is reused unless the caller explicitly overwrites the cache
    // (full renders triggered by data or settings changes do). Without this guard, every
    // render — including selection-driven ones — would re-sample the header row across all
    // columns and force a ghost-table reflow even when every height is already cached.
    if ((overwriteCache || this.headerHeight === null) && this.hot.getColHeader(0) !== null) {
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
            this.headerHeight = Math.round(height);
          } else {
            this.rowHeightsMap.setValueAtIndex(this.hot.toPhysicalRow(row), this.#toStoredHeight(height));
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

    // A sweep already walking the grid is abandoned rather than left to run beside this one. Every
    // sweep starts at row 0 and covers every row, so the new one measures everything the old one
    // still had left. Two in flight would double the work and, worse, race on `inProgress`:
    // whichever finished first would clear it while the other was still writing heights, and
    // `#onBeforeRender` reads that flag to decide whether the refresh queue is safe to drain.
    cancelIdleTask(this.#idleSweepTimer);
    this.#idleSweepTimer = 0;

    this.inProgress = true;

    const loop = () => {
      // When hot was destroyed after calculating finished cancel frame
      if (!this.hot) {
        cancelIdleTask(this.#idleSweepTimer);
        this.#idleSweepTimer = 0;
        this.inProgress = false;

        return;
      }

      try {
        this.calculateRowsHeight({
          from: current,
          to: Math.min(current + AutoRowSize.CALCULATION_STEP, length)
        }, colRange, overwriteCache);
      } catch (error) {
        // This runs inside an idle task, so the throw escapes whatever called
        // `calculateAllRowsHeight()` - no caller's try/catch can see it. Leave the plugin
        // recoverable before it goes.
        this.#abandonSweep();

        throw error;
      }

      current = current + AutoRowSize.CALCULATION_STEP + 1;

      if (current < length) {
        this.#idleSweepTimer = requestIdleTask(loop);
      } else {
        cancelIdleTask(this.#idleSweepTimer);
        this.#idleSweepTimer = 0;
        this.inProgress = false;

        // Rows queued while this sweep was running were held back, because the two share one ghost
        // table. The sweep ends without a render of its own, so nothing else would pick them up
        // until the next full render - which never comes on a grid the user only scrolls.
        this.#drainRowRefreshQueue();
      }
    };

    const syncLimit = this.getSyncCalculationLimit();

    // sync
    if (syncLimit >= 0) {
      try {
        this.calculateRowsHeight({ from: 0, to: syncLimit }, colRange, overwriteCache);
      } catch (error) {
        this.#abandonSweep();

        throw error;
      }

      current = syncLimit + 1;
    }
    // async
    if (current < length) {
      loop();
    } else {
      this.inProgress = false;

      // The whole grid fitted inside the sync limit, so `loop()` never ran and its completion
      // branch - the other place the queue is drained - was never reached.
      this.#drainRowRefreshQueue();
    }
  }

  /**
   * Puts the plugin back into a state the next render can recover from, after a measurement threw
   * part way through a sweep.
   *
   * Without it `inProgress` stays `true` for the instance's life, which does more than leave the
   * heights half measured: `#drainRowRefreshQueue()` refuses to run while a sweep is in flight, so
   * the refresh queue is silently disabled too. The full recalculation is re-owed, so the next
   * render starts over.
   */
  #abandonSweep(): void {
    cancelIdleTask(this.#idleSweepTimer);
    this.#idleSweepTimer = 0;
    this.inProgress = false;
    this.#fullRecalculationScheduled = true;

    // The ghost table has to be emptied too, or the retry above dies on arrival. `GhostTable#addRow`
    // pushes its row object BEFORE it runs the renderers and only fills in `.table` once they have
    // all returned, so a renderer that throws leaves a half-built entry behind - and `getHeights()`
    // reads `.table` on every row it holds. Only the success path calls `clean()`, so without this
    // the next sweep throws on that leftover, and so does the one after it.
    this.ghostTable.clean();
  }

  /**
   * Asks MergeCells which merged block is drawn on a covered cell. A block whose first row or column is
   * hidden is drawn on the covered cell at its first row and column that are shown, which no other cell
   * stands in for, so the sampler measures the block there.
   *
   * @param {number} row Visual row index of the cell.
   * @param {number} column Visual column index of the cell.
   * @returns {object|null} The block's top-left cell and its width in columns from `column` on, or `null`.
   */
  #getBlockDrawnOn(row: number, column: number): { row: number, col: number, colspan: number } | null {
    const mergeCells = this.hot.getPlugin('mergeCells');

    return mergeCells?.enabled ? mergeCells.getBlockDrawnOn(row, column) : null;
  }

  /**
   * Marks the merged blocks for a new comparison when the index mappers changed what is hidden, trimmed or
   * where the rows and columns sit: any of that can move the cell a block is drawn on.
   *
   * @param {object} changes The flags of the index mapper's cache update: what is hidden, what is trimmed, and
   * the order of the indexes.
   */
  #onIndexMapperCacheUpdated = (
    { hiddenIndexesChanged, trimmedIndexesChanged, indexesSequenceChanged }:
    { hiddenIndexesChanged: boolean, trimmedIndexesChanged: boolean, indexesSequenceChanged: boolean }
  ) => {
    if (hiddenIndexesChanged || trimmedIndexesChanged || indexesSequenceChanged) {
      this.#mergedBlocksChanged = true;
    }
  };

  /**
   * Marks the merged blocks for a new comparison after a merge was added or removed.
   */
  #onMergedBlocksChanged = () => {
    this.#mergedBlocksChanged = true;
  };

  /**
   * Compares the merged blocks right away after an undo or a redo. They restore merges without a hook of their
   * own, and the render of the step has run by then, so the heights of rows below the fold are corrected here
   * instead of at a render that may not come.
   */
  #onMergesRestored = () => {
    this.#mergedBlocksChanged = true;
    this.#remeasureMovedBlocks(true);
    this.#drainRowRefreshQueue();
  };

  /**
   * Marks the merged blocks for a new comparison when a settings update brought `mergeCells`: replacing the
   * merges raises no merge hook. The update renders after this hook.
   *
   * @param {object} newSettings The settings passed to `updateSettings`.
   */
  #onAfterUpdateSettings = (newSettings: Record<string, unknown>) => {
    if (isObject(newSettings) && hasOwnProperty(newSettings, 'mergeCells')) {
      this.#mergedBlocksChanged = true;
    }
  };

  /**
   * Removes the listeners of the two index mappers. The plugin may be destroyed before it was initialized,
   * and has no instance then.
   */
  #unbindIndexMapperListeners(): void {
    this.hot?.rowIndexMapper.removeLocalHook('cacheUpdated', this.#onIndexMapperCacheUpdated);
    this.hot?.columnIndexMapper.removeLocalHook('cacheUpdated', this.#onIndexMapperCacheUpdated);
  }

  /**
   * Drops the cached heights of the rows that a merged block started or stopped being drawn on. Heights are
   * keyed by the physical row, while the row a block's text is measured on follows what is hidden, trimmed
   * and sorted, so a height measured before the block moved is for the wrong row. Runs once a change that
   * can move a block was reported, and compares the covered cells the blocks are drawn on with those of the
   * last comparison: a grid whose blocks did not move (a settings update that hides nothing new) drops
   * nothing.
   *
   * @param {boolean} [queueRowsInView=false] Whether the rows in view are queued for a measurement as well.
   * A render measures them anyway, so only a caller that is not about to render needs it.
   */
  #remeasureMovedBlocks(queueRowsInView: boolean = false): void {
    if (!this.#mergedBlocksChanged) {
      return;
    }

    this.#mergedBlocksChanged = false;

    const mergeCells = this.hot.getPlugin('mergeCells');
    const carriers = new Map<string, number>();
    const origins = new Map<string, number>();

    if (mergeCells?.enabled) {
      mergeCells.getCellsBlocksAreDrawnOn().forEach(({ row, col, colspan, originRow, originCol }) => {
        const physicalRow = this.hot.toPhysicalRow(row);
        const physicalColumn = this.hot.toPhysicalColumn(col);
        const physicalOriginRow = this.hot.toPhysicalRow(originRow);
        const physicalOriginColumn = this.hot.toPhysicalColumn(originCol);

        if (physicalRow !== null && physicalColumn !== null) {
          carriers.set(`${physicalRow}:${physicalColumn}:${colspan}`, physicalRow);

          if (physicalOriginRow !== null && physicalOriginColumn !== null) {
            origins.set(`${physicalOriginRow}:${physicalOriginColumn}`, physicalRow);
          }
        }
      });
    }

    const movedRows = new Set<number>();

    carriers.forEach((physicalRow, key) => {
      if (!this.#blockCarriers.has(key)) {
        movedRows.add(physicalRow);
      }
    });
    this.#blockCarriers.forEach((physicalRow, key) => {
      if (!carriers.has(key)) {
        movedRows.add(physicalRow);
      }
    });
    this.#hiddenRowsToRemeasure.forEach((physicalRow) => {
      if (!this.hot.rowIndexMapper.isHidden(physicalRow)) {
        this.#hiddenRowsToRemeasure.delete(physicalRow);
        movedRows.add(physicalRow);
      }
    });

    this.#blockCarriers = carriers;
    this.#blockOrigins = origins;
    this.#clearRowHeights(Array.from(movedRows), queueRowsInView);
  }

  /**
   * Drops the cached heights of rows, and queues the ones that need a measurement of their own. A hidden row
   * is not measured until it is shown. A row in view is measured by the render that follows, which measures
   * every row without a height, so queueing it would measure it twice.
   *
   * @param {number[]} physicalRows The physical rows.
   * @param {boolean} queueRowsInView Whether the rows in view are queued as well.
   */
  #clearRowHeights(physicalRows: number[], queueRowsInView: boolean): void {
    if (physicalRows.length === 0) {
      return;
    }

    const firstVisibleRow = this.getFirstVisibleRow();
    const lastVisibleRow = this.getLastVisibleRow();
    const rowsToQueue: number[] = [];

    this.hot.batchExecution(() => {
      physicalRows.forEach((physicalRow) => {
        this.rowHeightsMap.setValueAtIndex(physicalRow, null);
      });
    }, true);

    physicalRows.forEach((physicalRow) => {
      if (this.hot.rowIndexMapper.isHidden(physicalRow)) {
        this.#hiddenRowsToRemeasure.add(physicalRow);

        return;
      }

      const visualRow = this.hot.toVisualRow(physicalRow);
      const isInView = visualRow !== null && visualRow >= firstVisibleRow && visualRow <= lastVisibleRow;

      if (visualRow !== null && (queueRowsInView || !isInView)) {
        rowsToQueue.push(physicalRow);
      }
    });

    this.#queueClearedRowsForRefresh(rowsToQueue);
  }

  /**
   * The height to store for a sampled row, from the height the ghost table measured for it.
   *
   * Compared with the default height WITHOUT the first-row border compensation: the ghost table
   * measures every row without that border, so the compensated default would count a row up to a
   * pixel taller than the real default as a default-height row and round it down.
   *
   * The margin also takes in what the border inflation adds at the zoom of now: the default height
   * keeps the value read when the grid was built, so a grid zoomed out afterwards would otherwise read
   * every default row as a taller one and round it up.
   *
   * @param {number} measuredHeight The measured height, snapped to the layout grid.
   * @returns {number}
   */
  #toStoredHeight(measuredHeight: number): number {
    const { stylesHandler } = this.hot;

    return toStoredRowHeight(
      measuredHeight,
      stylesHandler.getDefaultRowHeight() ?? 0,
      stylesHandler.getMaxDefaultRowOvergrowth(),
    );
  }

  /**
   * Measures the rows waiting in the refresh queue, if this moment can measure them at all.
   *
   * Two moments cannot, and both KEEP the queue rather than dropping it, so the rows are measured
   * at the first moment that can:
   *
   * - while a full sweep is running, because the sweep and this pass share one ghost table;
   * - while the grid has no columns, because the measurement would then write a near-empty height
   *   which, no longer being `null`, is never re-measured when the columns come back. That is the
   *   same trap the scheduled full recalculation is guarded against.
   *
   * Called from the render, and again when a sweep finishes - a sweep ends without a render of its
   * own, so without that second call a queue held back by the first condition would wait for the
   * next full render, which on a grid the user only scrolls never comes.
   */
  #drainRowRefreshQueue(): void {
    if (this.inProgress || this.hot.countCols() === 0 || this.#visualRowsToRefresh.length === 0) {
      return;
    }

    // Cleared after the call, not before: a measurement that throws leaves the rows queued for the
    // next attempt rather than dropping them.
    this.#calculateSpecificRowsHeight(this.#visualRowsToRefresh);
    this.#visualRowsToRefresh = [];
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

          this.rowHeightsMap.setValueAtIndex(physicalRow, this.#toStoredHeight(height));
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

      if (
        this.hot.stylesHandler.firstRenderedRowDrawsTopBorder() &&
        row === this.hot.view.getFirstRenderedVisibleRow()
      ) {
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
   * Clearing the whole cache schedules a full re-measurement, which runs on the next render. Note
   * that a scroll is not a render in this sense - pair the call with {@link Core#render} the way the
   * examples do, or the heights are not rebuilt.
   *
   * Passing an array clears those rows only, and queues exactly those rows for re-measurement on
   * the next render.
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

      this.#queueClearedRowsForRefresh(physicalRows);

    } else {
      this.rowHeightsMap.clear();
      // Nothing is measured any more, so the next render owes a full recalculation - see
      // `#fullRecalculationScheduled`.
      //
      // `measuredRows` is deliberately left alone. It is what the public `isNeedRecalculate()`
      // slices, and zeroing it makes that method answer "nothing to recalculate" at the exact
      // moment every height was dropped. AutoColumnSize leaves its counterpart alone for the same
      // reason.
      this.#fullRecalculationScheduled = true;
    }
  }

  /**
   * Clears cache by range. The cleared rows are queued for re-measurement on the next render.
   *
   * @param {object|number} range Row index or an object with `from` and `to` properties which define row range.
   */
  clearCacheByRange(range: number | { from: number, to: number }): void {
    const { from, to } = typeof range === 'number' ? { from: range, to: range } : range;
    const clearedRows: number[] = [];

    this.hot.batchExecution(() => {
      rangeEach(Math.min(from, to), Math.max(from, to), (row) => {
        this.rowHeightsMap.setValueAtIndex(row, null);
        clearedRows.push(row);
      });
    }, true);

    this.#queueClearedRowsForRefresh(clearedRows);
  }

  /**
   * Queues rows whose cached height was just dropped, so the next render measures them again.
   *
   * Without this they are only measured if and when they are drawn, and a render measures only the
   * band it draws - so a cleared row below the fold keeps the default height, and once a wide
   * wrapping column is scrolled into view its cell renders taller than the row header, which is the
   * misalignment `#fullRecalculationScheduled` exists to prevent. `#calculateSpecificRowsHeight()`
   * reads a row from the data rather than from the screen, so being off-screen is no obstacle.
   *
   * The queue is the same one data changes use, and it is drained in one synchronous pass, so
   * clearing a very large range costs a correspondingly large measurement on the next render. That
   * matches what the caller asked for, and it is the shape `#onBeforeChange` has always had; the
   * alternative - leaving the rows silently wrong - is the defect.
   *
   * @param {number[]} physicalRows Physical row indexes whose heights were cleared.
   */
  #queueClearedRowsForRefresh(physicalRows: number[]): void {
    physicalRows.forEach((physicalRow) => {
      const visualRow = this.hot.toVisualRow(physicalRow);

      // A row outside the dataset, or one a trimming map hides, has no visual index to measure.
      // Duplicates are skipped, the way the other producers of this queue do it: while the queue is
      // held back (a column-less grid, or a sweep in flight) overlapping calls would otherwise pile
      // the same row up and measure it once per copy.
      if (visualRow !== null && !this.#visualRowsToRefresh.includes(visualRow)) {
        this.#visualRowsToRefresh.push(visualRow);
      }
    });
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
    this.#remeasureMovedBlocks();
    this.calculateVisibleRowsHeight();
    this.#drainRowRefreshQueue();

    // A column re-measure owed to this render counts as running, whichever of the two listeners runs
    // first, and the last chunk of the sweep renders once it ends.
    if (this.#rowsOwedToColumnSweep && this.hot.view.isVisible() && !this.#isColumnSweepRunning()) {
      this.#rowsOwedToColumnSweep = false;
      this.#fullRecalculationScheduled = true;
    }

    // A wiped cache is restored in full, so the rows below the fold are measured too and not just
    // the visible band - see `#fullRecalculationScheduled`. It runs AFTER the visible band above,
    // never instead of it: `calculateAllRowsHeight()` only measures up to `syncLimit` rows
    // synchronously and leaves the rest to an idle sweep, so on a grid scrolled past that limit the
    // band on screen would otherwise draw unmeasured, which is the very defect this repairs.
    //
    // The flag is held rather than consumed whenever this render cannot measure: while the grid is
    // hidden `recalculateAllRowsHeight()` is a no-op, and with no columns the measurement writes a
    // near-empty height for every row that nothing would ever correct (the same reason
    // `calculateVisibleRowsHeight()` bails out on a column-less grid). The row count is checked for
    // the same shape of reason, though nothing is at stake: a sweep over no rows measures nothing,
    // so holding the flag just keeps the work owed until there is something to measure.
    if (this.#fullRecalculationScheduled &&
        this.hot.countCols() > 0 &&
        this.hot.countRows() > 0 &&
        this.hot.view.isVisible()) {
      // Consumed before the call, not after: the sweep resizes the overlays, and a re-entrant
      // render reaching this branch with the flag still set would recurse. It is re-owed if the
      // sweep throws - the ghost table runs the real renderers, so a renderer that throws would
      // otherwise leave every unmeasured row at the default height for the instance's life.
      this.#fullRecalculationScheduled = false;

      try {
        this.recalculateAllRowsHeight();
      } catch (error) {
        this.#fullRecalculationScheduled = true;

        throw error;
      }
    }
  };

  /**
   * Schedules a single full row-height recalculation per column-resize gesture. The hook fires
   * once per selected column, so the recalculation is deferred until the gesture's synchronous
   * loop (and the render that applies the new widths) has finished — the heights are then
   * measured once, against the final column widths.
   */
  #onBeforeColumnResize = () => {
    if (this.#columnResizeRecalcScheduled) {
      return;
    }

    this.#columnResizeRecalcScheduled = true;

    this.hot._registerTimeout(() => {
      this.#columnResizeRecalcScheduled = false;
      this.recalculateAllRowsHeight();
    }, 0);
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
   * Re-measures every row after the document loaded a web font. The heights are overwritten in place:
   * `clearCache()` would draw every row past the synchronous limit at the default height until the idle
   * sweep reaches it, which moves a grid scrolled far down to other rows. Core fires the hook only on a
   * visible grid. With no columns (a wrapper between two renders) the work is owed to a later render
   * instead, as `#onBeforeRender` does: measured from no cells, every row would get a near-empty height
   * that nothing corrects once the columns are back. When AutoColumnSize is still widening columns in idle
   * tasks, the rows are measured again once it ends (`#rowsOwedToColumnSweep`).
   */
  #onAfterFontsLoad = () => {
    if (this.hot.countCols() === 0) {
      this.#fullRecalculationScheduled = true;

      return;
    }

    this.recalculateAllRowsHeight();
    this.#rowsOwedToColumnSweep = this.#isColumnSweepRunning();
  };

  /**
   * Checks whether AutoColumnSize is still measuring columns in idle tasks, or owes a re-measure of every
   * column to the next render.
   *
   * @returns {boolean}
   */
  #isColumnSweepRunning(): boolean {
    const autoColumnSize = this.hot.getPlugin('autoColumnSize');

    return autoColumnSize?.enabled === true && autoColumnSize.isReMeasurePending();
  }

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
    const changedRows = new Set<number>();

    changes.forEach(([row, prop]: unknown[]) => {
      changedRows.add(Number(row));

      // A block drawn on a covered cell takes its text from its top-left cell, so a change there is a change
      // of the row the block is measured on.
      this.#getRowsOfBlocksStartingAt(Number(row), prop).forEach(blockRow => changedRows.add(blockRow));
    });

    changedRows.forEach((rowIndex) => {
      this.#visualRowsToRefresh.push(rowIndex);
    });
  };

  /**
   * The visual rows that merged blocks are drawn on, for the blocks whose top-left cell is the given cell and
   * that are drawn on another cell.
   *
   * @param {number} row The visual row of the cell.
   * @param {*} prop The property or the visual column of the cell, as a change carries it. It is a function for
   * a column read through a data accessor.
   * @returns {number[]}
   */
  #getRowsOfBlocksStartingAt(row: number, prop: unknown): number[] {
    const physicalRow = this.hot.toPhysicalRow(row);

    if (this.#blockOrigins.size === 0 || physicalRow === null) {
      return [];
    }

    const column = typeof prop === 'string' || typeof prop === 'number' ? this.hot.propToCol(prop) : null;
    const physicalColumn = typeof column === 'number' ? this.hot.toPhysicalColumn(column) : null;
    const carrierRows: number[] = [];

    if (physicalColumn === null) {
      // A data accessor function does not name a column here, so every block that starts in the row counts.
      this.#blockOrigins.forEach((carrierRow, key) => {
        if (key.startsWith(`${physicalRow}:`)) {
          carrierRows.push(carrierRow);
        }
      });

    } else {
      const carrierRow = this.#blockOrigins.get(`${physicalRow}:${physicalColumn}`);

      if (carrierRow !== undefined) {
        carrierRows.push(carrierRow);
      }
    }

    return carrierRows.flatMap((carrierRow) => {
      const visualRow = this.hot.toVisualRow(carrierRow);

      return visualRow === null ? [] : [visualRow];
    });
  }

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
    this.#unbindIndexMapperListeners();
    this.ghostTable.clean();
    super.destroy();
  }
}
