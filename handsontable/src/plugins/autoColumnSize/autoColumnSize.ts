import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { cancelIdleTask, requestIdleTask } from '../../helpers/feature';
import GhostTable from '../../utils/ghostTable';
import { Hooks } from '../../core/hooks';
import { isObject } from '../../helpers/object';
import { valueAccordingPercent, rangeEach } from '../../helpers/number';
import SamplesGenerator from '../../utils/samplesGenerator';
import { isPercentValue } from '../../helpers/string';
import { formatCellValue } from '../../renderers/renderCell';
import { DEFAULT_COLUMN_WIDTH } from '../../3rdparty/walkontable/src';
import type { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import type { CellChange } from '../../settings';

Hooks.getSingleton().register('modifyAutoColumnSizeSeed');

export const PLUGIN_KEY = 'autoColumnSize';
export const PLUGIN_PRIORITY = 10;
const COLUMN_SIZE_MAP_NAME = 'autoColumnSize';

/**
 * A single changed cell tracked by the width refresh queue. The previous value feeds the
 * width-determiner probe which decides whether a full column rescan can be skipped.
 */
interface ChangedCell {
  row: number;
  oldValue: unknown;
  hasOldValue: boolean;
}

/**
 * A width refresh queue entry prepared for the width-determiner probe.
 */
interface ColumnWidthProbe {
  visualColumn: number;
  cells: ChangedCell[];
  cachedWidth: number;
}

type ColumnSamples = ReturnType<SamplesGenerator['generateSample']>;

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
 * ::: tip
 * If you use custom renderers or custom styles that produce non-standard column widths, and you call
 * {@link Core#scrollViewportTo}, make sure `AutoColumnSize` is enabled. Without it, `scrollViewportTo()` calculates
 * scroll positions based on incorrect column widths and may scroll to an incorrect position.
 * :::
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
 *
 * ::: only-for angular
 *
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
 *     autoColumnSize: true,
 *   };
 *
 *   ngAfterViewInit(): void {
 *     // Access to plugin instance:
 *     const hot = this.hotTable.hotInstance;
 *     const plugin = hot.getPlugin("autoColumnSize");
 *
 *     plugin.getColumnWidth(4);
 *
 *     if (plugin.isEnabled()) {
 *       // code...
 *     }
 *   }
 *
 *   private getData(): Array<*> {
 *     //get some data
 *   }
 * }
 * ```
 *
 * :::
 */
export class AutoColumnSize extends BasePlugin {
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
   * Returns the number of columns processed in a single calculation step during asynchronous sizing.
   */
  static get CALCULATION_STEP() {
    return 50;
  }

  /**
   * Returns the maximum number of columns whose widths are calculated synchronously before switching to async mode.
   */
  static get SYNC_CALCULATION_LIMIT() {
    return 50;
  }

  /**
   * Returns the maximum number of cells sampled in a single asynchronous calculation step. Together
   * with {@link AutoColumnSize.CALCULATION_STEP} it bounds the work done per animation frame: a
   * column whose row range exceeds the budget is swept across multiple frames, and its width is
   * written once, when the sweep completes.
   */
  static get CALCULATION_CELLS_BUDGET() {
    return 100000;
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
  samplesGenerator = new SamplesGenerator((row: number, column: number) => {
    const physicalRow = this.hot.toPhysicalRow(row);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (this.hot.rowIndexMapper.isHidden(physicalRow) || this.hot.columnIndexMapper.isHidden(physicalColumn)) {
      return false;
    }

    // The transient read resolves the full dynamic meta (hooks + `cells`, so `hidden`/`spanned`
    // from merged cells work) without storing anything - this sampler sweeps the whole row range
    // per column, and the eager `getCellMeta` would permanently materialize one meta per visited
    // cell (O(rows x columns) retention on init).
    const cellMeta = this.hot.getCellMetaTransient(row, column);
    let cellValue: unknown = '';
    let seedValue: unknown = '';

    if (cellMeta.hidden) {
      // do not generate samples for cells that are covered by merged cell (null values)
      return false;
    }

    if (!cellMeta.spanned) {
      // Format through the same precedence as the render path (cell-level `valueFormatter`, then
      // the renderer's own static), so the measured string matches what the renderer produces.
      cellValue = formatCellValue(
        this.hot.getDataAtCell(row, column), cellMeta, this.hot.getCellRenderer(cellMeta)
      );
      seedValue = cellValue;
    }

    let bundleSeed = '';

    if (this.hot.hasHook('modifyAutoColumnSizeSeed')) {
      bundleSeed = String(
        this.hot.runHooks('modifyAutoColumnSizeSeed', bundleSeed, cellMeta, seedValue) ?? bundleSeed
      );
    }

    return { value: cellValue, bundleSeed };
  });
  /**
   * `true` if the size calculation is in progress.
   *
   * @type {boolean}
   */
  inProgress: boolean = false;
  /**
   * Number of already measured columns (we already know their sizes).
   *
   * @type {number}
   */
  measuredColumns: number = 0;
  /**
   * PhysicalIndexToValueMap to keep and track widths for physical column indexes.
   *
   * @private
   * @type {PhysicalIndexToValueMap}
   */
  columnWidthsMap: IndexToValueMap;
  /**
   * `true` value indicates that the #onInit() function has been already called.
   *
   * @type {boolean}
   */
  #isInitialized = false;
  /**
   * Cached column header names. It is used to diff current column headers with previous state and detect which
   * columns width should be updated.
   *
   * @type {Array}
   */
  #cachedColumnHeaders: unknown[] = [];
  /**
   * Pending width refresh requests keyed by visual column index, consumed before the next render.
   * A `null` value means the column needs a full row-range rescan. An array value holds the
   * changed cells (visual row index and the previous cell value) used by the width-determiner
   * probe, which measures only the changed cells and skips the full rescan when the edit could
   * not have changed the column's width.
   *
   * @type {Map<number, Array<object>|null>}
   */
  #columnWidthsToRefresh: Map<number, ChangedCell[] | null> = new Map();
  /**
   * Caches the sampled values (a handful of bucketed strings per column) collected by the last
   * full row-range scan, keyed by physical column index. Forced renders re-measure the visible
   * columns by re-rendering these samples through the ghost table — picking up CSS or renderer
   * changes — instead of re-walking the whole row range. The cache is dropped whenever the row
   * set or the source data changes in a way the width refresh queue cannot describe, which
   * makes the next re-measure fall back to a full scan.
   *
   * @type {Map<number, Map>}
   */
  #columnSamplesCache: Map<number, ColumnSamples> = new Map();
  /**
   * Disposer function for the column widths map observer. Called on disable to clean up.
   *
   * @type {Function|null}
   */
  #disposeMapObserver: (() => void) | null = null;

  /**
   * Initializes the plugin, registers the column widths map, and sets up the column resize hook.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);
    // The map holds numbers only, so re-writing an unchanged width is a no-op that must not
    // invalidate the column-width position cache (every render re-measures the visible columns).
    this.columnWidthsMap = this.hot.columnIndexMapper.createAndRegisterIndexMap(
      COLUMN_SIZE_MAP_NAME, 'physicalIndexToValue', null, { skipUnchangedWrites: true },
    );

    // Leave the listener active to allow auto-sizing the columns when the plugin is disabled.
    // This is necessary for width recalculation for resize handler doubleclick (ManualColumnResize).
    this.addHook('beforeColumnResize', this.#onBeforeColumnResize);
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link #enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.hot.getSettings()[PLUGIN_KEY] !== false && !this.hot.getSettings().colWidths;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.ghostTable.setSetting('useHeaders', this.getSetting('useHeaders'));
    this.samplesGenerator.setAllowDuplicates(this.getSetting<boolean>('allowSampleDuplicates'));

    const samplingRatio = this.getSetting<number | null>('samplingRatio');

    if (samplingRatio && !isNaN(samplingRatio)) {
      this.samplesGenerator.setSampleCount(parseInt(String(samplingRatio), 10));
    }

    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('beforeChangeRender', this.#onBeforeChange);
    this.addHook('afterSetCellMeta', this.#onAfterSetCellMeta);
    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell);
    this.addHook('afterFormulasValuesUpdate', this.#onAfterFormulasValuesUpdate);
    this.addHook('beforeRender', this.#onBeforeRender);
    this.addHook('modifyColWidth', (width: number, col: number) => this.getColumnWidth(col, width), -10);
    this.addHook('init', this.#onInit);

    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onRowIndexMapperCacheUpdate);
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#onColumnIndexMapperCacheUpdate);

    this.#disposeMapObserver = this.hot.columnIndexMapper
      .observeMapChange(this.columnWidthsMap, () => {
        this.hot.view?.invalidateColumnWidthCache();
      });

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin(): void {
    this.findColumnsWhereHeaderWasChanged().forEach((visualColumn) => {
      this.#columnWidthsToRefresh.set(visualColumn, null);
    });
    // Settings may remap the data that feeds the samples (e.g. a new `columns` definition), so
    // the cached samples cannot be trusted — the next re-measure falls back to a full scan.
    this.#columnSamplesCache.clear();
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    if (this.#disposeMapObserver) {
      this.#disposeMapObserver();
      this.#disposeMapObserver = null;
    }

    this.hot.rowIndexMapper.removeLocalHook('cacheUpdated', this.#onRowIndexMapperCacheUpdate);
    this.hot.columnIndexMapper.removeLocalHook('cacheUpdated', this.#onColumnIndexMapperCacheUpdate);

    super.disablePlugin();

    // Leave the listener active to allow auto-sizing the columns when the plugin is disabled.
    // This is necessary for width recalculation for resize handler doubleclick (ManualColumnResize).
    this.addHook('beforeColumnResize', this.#onBeforeColumnResize);
  }

  /**
   * Calculates widths for visible columns in the viewport only.
   */
  calculateVisibleColumnsWidth(): void {
    // Keep last column widths unchanged for situation when all rows was deleted or trimmed (pro #6)
    if (!this.hot.countRows()) {
      return;
    }

    const firstVisibleColumn = this.getFirstVisibleColumn();
    const lastVisibleColumn = this.getLastVisibleColumn();

    if (firstVisibleColumn === -1 || lastVisibleColumn === -1) {
      return;
    }

    const overwriteCache = this.hot.forceFullRender;

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
    colRange: number | { from: number, to: number } = { from: 0, to: this.hot.countCols() - 1 },
    rowRange: number | { from: number, to: number } = { from: 0, to: this.hot.countRows() - 1 },
    overwriteCache: boolean = false
  ): void {
    const columnsRange = typeof colRange === 'number' ? { from: colRange, to: colRange } : colRange;
    const rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;

    rangeEach(columnsRange.from, columnsRange.to, (visualColumn) => {
      let physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn === null) {
        physicalColumn = visualColumn;
      }

      if (overwriteCache || (this.columnWidthsMap.getValueAtIndex(physicalColumn) === null &&
          !this.hot._getColWidthFromSettings(physicalColumn))) {
        const cachedSamples = overwriteCache ? this.#columnSamplesCache.get(physicalColumn) : undefined;

        // A re-measure (cache overwrite) with an intact samples cache re-renders the previously
        // sampled values — picking up CSS or renderer changes — without re-walking the row range.
        // Data changes refresh or drop the cached samples, so a full scan runs only when needed.
        if (cachedSamples !== undefined) {
          this.#addGhostTableColumn(visualColumn, cachedSamples);
        } else {
          this.#fillGhostTableWithSamples(visualColumn, rowsRange);
        }
      }
    });

    if (this.ghostTable.columns.length) {
      this.#updateColumnWidthsMapBasedOnGhostTable();
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
  calculateAllColumnsWidth(
    rowRange: number | { from: number, to: number } = { from: 0, to: this.hot.countRows() - 1 },
    overwriteCache: boolean = false
  ): void {
    const rowsRange = typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange;
    const lastColumn = this.hot.countCols() - 1;
    let currentColumn = 0;
    let currentRowCursor = rowsRange.from;
    let columnSamples: ReturnType<SamplesGenerator['generateSample']> | null = null;
    let timer = 0;

    this.inProgress = true;

    const shouldMeasureColumn = (visualColumn: number) => {
      let physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn === null) {
        physicalColumn = visualColumn;
      }

      return overwriteCache || (this.columnWidthsMap.getValueAtIndex(physicalColumn) === null &&
          !this.hot._getColWidthFromSettings(physicalColumn));
    };

    /**
     * Sweeps up to `columnsBudget` columns, sampling at most `cellsBudget` cells. A column whose
     * remaining row range exceeds the cells budget is left mid-sweep (its samples accumulate in
     * `columnSamples`) and is continued by the next call. Returns `true` when every column has
     * been processed.
     *
     * @param {number} columnsBudget The maximum number of columns to process in this chunk.
     * @param {number} cellsBudget The maximum number of cells to sample in this chunk.
     * @returns {boolean}
     */
    const processChunk = (columnsBudget: number, cellsBudget: number) => {
      let remainingColumns = columnsBudget;
      let remainingCells = cellsBudget;

      while (remainingColumns > 0 && currentColumn <= lastColumn) {
        if (columnSamples === null) {
          if (!shouldMeasureColumn(currentColumn)) {
            currentColumn += 1;
            remainingColumns -= 1;
            continue;
          }

          columnSamples = new Map();
          currentRowCursor = rowsRange.from;
        }

        if (currentRowCursor <= rowsRange.to) {
          if (remainingCells <= 0) {
            return false;
          }

          const sliceTo = Math.min(rowsRange.to, currentRowCursor + remainingCells - 1);

          this.samplesGenerator
            .generateSample('col', { from: currentRowCursor, to: sliceTo }, currentColumn, columnSamples);

          remainingCells -= sliceTo - currentRowCursor + 1;
          currentRowCursor = sliceTo + 1;
        }

        if (currentRowCursor > rowsRange.to) {
          const physicalColumn = this.hot.toPhysicalColumn(currentColumn);

          this.#addGhostTableColumn(currentColumn, columnSamples);
          this.#columnSamplesCache.set(physicalColumn === null ? currentColumn : physicalColumn, columnSamples);
          columnSamples = null;
          currentColumn += 1;
          remainingColumns -= 1;
        }
      }

      return currentColumn > lastColumn;
    };
    const flushGhostTable = () => {
      if (this.ghostTable.columns.length) {
        this.#updateColumnWidthsMapBasedOnGhostTable();
        this.measuredColumns = currentColumn;
        this.ghostTable.clean();
      }
    };

    const loop = () => {
      // When hot was destroyed after calculating finished cancel frame
      if (!this.hot) {
        cancelIdleTask(timer);
        this.inProgress = false;

        return;
      }

      const isDone = processChunk(
        AutoColumnSize.CALCULATION_STEP + 1,
        AutoColumnSize.CALCULATION_CELLS_BUDGET,
      );

      flushGhostTable();

      if (!isDone) {
        timer = requestIdleTask(loop);

      } else {
        cancelIdleTask(timer);
        this.inProgress = false;

        // @TODO Should call once per render cycle, currently fired separately in different plugins
        this.hot.view.adjustElementsSize();
      }
    };

    const syncLimit = this.getSyncCalculationLimit();

    // sync — the `syncLimit` columns are calculated exactly (whole row range) before the first
    // paint, preserving the `syncLimit` contract.
    if (syncLimit >= 0) {
      processChunk(syncLimit + 1, Infinity);
      flushGhostTable();
    }
    // async
    if (currentColumn <= lastColumn) {
      loop();
    } else {
      this.inProgress = false;
    }
  }

  /**
   * Consumes the width refresh queue. Columns queued with change details go through the
   * width-determiner probe first; columns queued for a full refresh (and columns whose probe
   * was inconclusive) are rescanned over the whole row range, like before.
   */
  #refreshQueuedColumnsWidth() {
    if (this.#columnWidthsToRefresh.size === 0) {
      return;
    }

    const queue = this.#columnWidthsToRefresh;

    this.#columnWidthsToRefresh = new Map();

    const totalRows = this.hot.countRows();
    const fullRescanColumns: number[] = [];
    const probes: ColumnWidthProbe[] = [];

    queue.forEach((cells, visualColumn) => {
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn === null || this.hot._getColWidthFromSettings(physicalColumn)) {
        return;
      }

      const cachedWidth = this.columnWidthsMap.getValueAtIndex<number>(physicalColumn);

      // A full rescan is needed when it was requested explicitly, when there is no cached width
      // to compare the probe against, or when so many cells changed that probing them costs
      // about as much as the rescan itself.
      if (cells === null || cachedWidth === null || cachedWidth === undefined ||
          cells.length * 2 >= totalRows) {
        fullRescanColumns.push(visualColumn);
      } else {
        probes.push({ visualColumn, cells, cachedWidth });
      }
    });

    this.#probeChangedCellsWidth(probes, fullRescanColumns);

    if (fullRescanColumns.length > 0) {
      const rowsRange = { from: 0, to: totalRows - 1 };

      fullRescanColumns.forEach((visualColumn) => {
        this.#fillGhostTableWithSamples(visualColumn, rowsRange);
      });
    }

    if (this.ghostTable.columns.length) {
      this.#updateColumnWidthsMapBasedOnGhostTable();
      this.ghostTable.clean();
    }
  }

  /**
   * Measures only the changed cells of the queued columns and decides, per column, whether the
   * cached width is still valid, can be grown in place, or whether the column needs a full
   * row-range rescan (appended to `fullRescanColumns`).
   *
   * The probe measures pure cell widths (ghost table headers disabled) and reasons as follows:
   * - when a new value renders wider than the cached width, that value is the new widest cell
   *   and the width is grown in place, without a rescan;
   * - otherwise, when every previous value renders narrower than the cached width, the changed
   *   cells were not the width determiners and the cached width stays valid;
   * - otherwise a previous value could have determined the cached width, so the column is
   *   rescanned to find the new widest cell (this is what allows the column to shrink).
   *
   * @param {object[]} probes The queued columns with their changed cells and cached widths.
   * @param {number[]} fullRescanColumns The list that columns needing a full rescan are appended to.
   */
  #probeChangedCellsWidth(probes: ColumnWidthProbe[], fullRescanColumns: number[]) {
    if (probes.length === 0) {
      return;
    }

    const growths = new Map<number, number>();
    const oldValueProbes: ColumnWidthProbe[] = [];
    const probeItems = probes.map(({ visualColumn, cells }) => ({
      visualColumn,
      samples: this.samplesGenerator
        .generateSample('col', cells.map(cell => cell.row), visualColumn),
    }));
    const samplesByColumn = new Map(probeItems.map(({ visualColumn, samples }) => [visualColumn, samples]));
    const newWidths = this.#measureCellsWidth(probeItems);

    probes.forEach((probe) => {
      const newWidth = newWidths.get(probe.visualColumn);

      if (newWidth !== undefined && newWidth > probe.cachedWidth) {
        growths.set(probe.visualColumn, newWidth);
        this.#updateCachedSamples(probe, samplesByColumn.get(probe.visualColumn));
      } else if (probe.cells.some(cell => !cell.hasOldValue)) {
        fullRescanColumns.push(probe.visualColumn);
      } else {
        oldValueProbes.push(probe);
        this.#updateCachedSamples(probe, samplesByColumn.get(probe.visualColumn));
      }
    });

    if (oldValueProbes.length > 0) {
      const oldWidths = this.#measureCellsWidth(oldValueProbes.map(({ visualColumn, cells }) => ({
        visualColumn,
        samples: this.samplesGenerator.generateSampleFromValues('col', cells.map(cell => ({
          index: cell.row,
          value: this.#formatProbeValue(cell.row, visualColumn, cell.oldValue),
        }))),
      })));

      oldValueProbes.forEach(({ visualColumn, cachedWidth }) => {
        const oldWidth = oldWidths.get(visualColumn);

        if (oldWidth !== undefined && oldWidth >= cachedWidth) {
          fullRescanColumns.push(visualColumn);
        }
      });
    }

    if (growths.size > 0) {
      this.hot.batchExecution(() => {
        growths.forEach((width, visualColumn) => {
          this.columnWidthsMap.setValueAtIndex(this.hot.toPhysicalColumn(visualColumn), width);
        });
      }, true);
    }
  }

  /**
   * Keeps the column's cached samples usable after an in-place decision: strings sampled from
   * the changed rows are evicted (their values are stale now) and the freshly probed samples
   * of the changed cells are merged in, so a later re-measure (e.g. after a CSS change) still
   * sees the current values — including the one that grew the column. Columns without a cache
   * entry are left without one — an incomplete entry would make a later re-measure compute the
   * width from the changed cells alone.
   *
   * @param {object} probe The probed column with its changed cells.
   * @param {Map} [samples] Freshly probed samples of the changed cells to merge in.
   */
  #updateCachedSamples(probe: ColumnWidthProbe, samples: ColumnSamples | undefined) {
    const physicalColumn = this.hot.toPhysicalColumn(probe.visualColumn);
    const cachedSamples = physicalColumn === null ? undefined : this.#columnSamplesCache.get(physicalColumn);

    if (cachedSamples === undefined) {
      return;
    }

    const changedRows = new Set(probe.cells.map(cell => cell.row));

    cachedSamples.forEach((cachedSample, seed) => {
      const strings = cachedSample.strings.filter(({ row }) => row === undefined || !changedRows.has(row));

      if (strings.length === 0) {
        cachedSamples.delete(seed);
      } else {
        cachedSample.strings = strings;
      }
    });

    if (samples === undefined) {
      return;
    }

    const sampleCount = this.samplesGenerator.getSampleCount();
    let bucketOverflowed = false;

    samples.forEach((sample, seed) => {
      const cachedSample = cachedSamples.get(seed);

      if (cachedSample === undefined) {
        cachedSamples.set(seed, sample);

        return;
      }

      cachedSample.strings.push(...sample.strings);

      if (cachedSample.strings.length > sampleCount * 2) {
        bucketOverflowed = true;
      }
    });

    // Trimming an overgrown bucket would have to guess which string is the widest — the
    // width determiner can sit anywhere in it. Instead of risking its eviction (and a column
    // that renders narrower than its content), the whole entry is dropped: the next
    // re-measure falls back to one full scan that rebuilds it.
    if (bucketOverflowed && physicalColumn !== null) {
      this.#columnSamplesCache.delete(physicalColumn);
    }
  }

  /**
   * Measures the rendered width of the given per-column sample maps with the ghost table, with
   * headers disabled — a header rendered next to the samples would put a floor under every
   * measurement and mask the comparison against the cached width.
   *
   * @param {object[]} items An array of `{ visualColumn, samples }` objects to measure.
   * @returns {Map<number, number>} Measured widths keyed by visual column index.
   */
  #measureCellsWidth(items: Array<{ visualColumn: number, samples: ColumnSamples }>) {
    const widths = new Map<number, number>();
    const measurableItems = items.filter(({ samples }) => samples.size > 0);

    if (measurableItems.length === 0) {
      return widths;
    }

    const useHeaders = this.ghostTable.getSetting('useHeaders');

    this.ghostTable.setSetting('useHeaders', false);

    try {
      measurableItems.forEach(({ visualColumn, samples }) => {
        this.#addGhostTableColumn(visualColumn, samples);
      });
      this.ghostTable.getWidths((visualColumn: number, width: number) => {
        widths.set(visualColumn, width);
      });
    } finally {
      // A throwing custom renderer must not leave the ghost table with headers disabled (or
      // with the probe's columns still attached) for every later full-scan measurement.
      this.ghostTable.clean();
      this.ghostTable.setSetting('useHeaders', useHeaders);
    }

    return widths;
  }

  /**
   * Formats a probed value the way the render path would — cell-level `valueFormatter` first,
   * then the renderer's own static — so the measured string matches what the renderer produces.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {*} value The raw value to format.
   * @returns {*}
   */
  #formatProbeValue(row: number, column: number, value: unknown) {
    const cellMeta = this.hot.getCellMetaTransient(row, column);

    return formatCellValue(value, cellMeta, this.hot.getCellRenderer(cellMeta));
  }

  /**
   * Generates content samples for the given column within the row range, adds each sample
   * to the ghost table so its rendered width can be measured, and refreshes the column's
   * samples cache.
   */
  #fillGhostTableWithSamples(visualColumn: number, rowsRange: { from: number, to: number }) {
    const samples = this.samplesGenerator.generateColumnSamples(visualColumn, rowsRange);

    samples.forEach((sample, column) => {
      const physicalColumn = this.hot.toPhysicalColumn(column);

      this.#addGhostTableColumn(column, sample);
      this.#columnSamplesCache.set(physicalColumn === null ? column : physicalColumn, sample);
    });
  }

  /**
   * Adds a column to the ghost table, passing a shallow clone of the samples map — the ghost
   * table's `clean()` empties the last map it received, which must never wipe a map that is
   * kept in the samples cache.
   *
   * @param {number} visualColumn Visual column index.
   * @param {Map} samples The samples map to measure.
   */
  #addGhostTableColumn(visualColumn: number, samples: ColumnSamples) {
    this.ghostTable.addColumn(visualColumn, new Map(samples));
  }

  /**
   * Updates the column widths map with calculated widths from the ghost table.
   *
   */
  #updateColumnWidthsMapBasedOnGhostTable() {
    this.hot.batchExecution(() => {
      this.ghostTable.getWidths((visualColumn: number, width: number) => {
        const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

        this.columnWidthsMap.setValueAtIndex(physicalColumn, width);
      });
    }, true);
  }

  /**
   * Recalculates all columns width (overwrite cache values).
   */
  recalculateAllColumnsWidth(): void {
    if (this.hot.view.isVisible()) {
      // Every queued width refinement is subsumed by the full overwrite sweep — entries
      // queued after this point (e.g. edits made while the asynchronous part is running)
      // accumulate again and are consumed as usual.
      this.#columnWidthsToRefresh.clear();
      this.calculateAllColumnsWidth({ from: 0, to: this.hot.countRows() - 1 }, true);
      // The synchronous part of the sweep runs inside `init`/`afterLoadData` hook cascades,
      // before other plugins re-apply their cell meta (e.g. MergeCells' `spanned`/`hidden`
      // flags), so the samples it collected cannot be trusted for later re-measures. Dropping
      // them makes the next full render re-walk the visible columns with the settled meta,
      // like it always did. Samples stored by the asynchronous part run after the cascade
      // and stay.
      this.#columnSamplesCache.clear();
    }
  }

  /**
   * Gets value which tells how many columns should be calculated synchronously (rest of the columns will be calculated
   * asynchronously). The limit is calculated based on `syncLimit` set to `autoColumnSize` option (see {@link Options#autoColumnSize}).
   *
   * @returns {number}
   */
  getSyncCalculationLimit(): number {
    const settings = this.hot.getSettings()[PLUGIN_KEY];
    /* eslint-disable no-bitwise */
    let limit: number = AutoColumnSize.SYNC_CALCULATION_LIMIT;
    const colsLimit = this.hot.countCols() - 1;

    if (isObject(settings)) {
      const syncLimit = (settings as { syncLimit: number | string }).syncLimit;

      if (typeof syncLimit === 'string' && isPercentValue(syncLimit)) {
        limit = valueAccordingPercent(colsLimit, syncLimit);
      } else {
        // Force to integer (NaN — e.g. when syncLimit is undefined — falls back to 0)
        const numericSyncLimit = Number(syncLimit);

        limit = Number.isFinite(numericSyncLimit) ? Math.trunc(numericSyncLimit) : 0;
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
  getColumnWidth(column: number, defaultWidth?: number, keepMinimum: boolean = true): number | undefined {
    let width = defaultWidth;

    if (width === undefined) {
      width = this.columnWidthsMap.getValueAtIndex<number>(this.hot.toPhysicalColumn(column));

      if (keepMinimum && typeof width === 'number') {
        width = Math.max(width, DEFAULT_COLUMN_WIDTH);
      }
    }

    return width;
  }

  /**
   * Gets the first visible column.
   *
   * When the {@link MergeCells} plugin is enabled with its default `virtualized: false` setting, a merged
   * cell that crosses the viewport edge extends the rendered column range. In that case this method can
   * return a column index outside the strictly visible viewport. To read the actual visible viewport, use
   * {@link Core#getFirstFullyVisibleColumn} or {@link Core#getFirstPartiallyVisibleColumn}.
   *
   * @returns {number} Returns visual column index, -1 if table is not rendered or if there are no columns to base the the calculations on.
   */
  getFirstVisibleColumn(): number {
    return this.hot.getFirstRenderedVisibleColumn() ?? -1;
  }

  /**
   * Gets the last visible column.
   *
   * When the {@link MergeCells} plugin is enabled with its default `virtualized: false` setting, a merged
   * cell that crosses the viewport edge extends the rendered column range. In that case this method can
   * return a column index outside the strictly visible viewport. To read the actual visible viewport, use
   * {@link Core#getLastFullyVisibleColumn} or {@link Core#getLastPartiallyVisibleColumn}.
   *
   * @returns {number} Returns visual column index or -1 if table is not rendered.
   */
  getLastVisibleColumn(): number {
    return this.hot.getLastRenderedVisibleColumn() ?? -1;
  }

  /**
   * Collects all columns which titles has been changed in comparison to the previous state.
   *
   * @private
   * @returns {Array} It returns an array of visual column indexes.
   */
  findColumnsWhereHeaderWasChanged(): number[] {
    const columnHeaders = this.hot.getColHeader();

    const changedColumns = (columnHeaders as unknown[]).reduce<number[]>(
      (acc, columnTitle: unknown, physicalColumn: number) => {
        const cachedColumnsLength = this.#cachedColumnHeaders.length;

        if (cachedColumnsLength - 1 < physicalColumn || this.#cachedColumnHeaders[physicalColumn] !== columnTitle) {
          const visualColumn = this.hot.toVisualColumn(physicalColumn);

          if (visualColumn !== null) {
            acc.push(visualColumn);
          }
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
  clearCache(physicalColumns?: number[]): void {
    if (Array.isArray(physicalColumns)) {
      this.hot.batchExecution(() => {
        physicalColumns.forEach((physicalIndex) => {
          this.columnWidthsMap.setValueAtIndex(physicalIndex, null);
          this.#columnSamplesCache.delete(physicalIndex);
        });
      }, true);

    } else {
      this.columnWidthsMap.clear();
      this.#columnSamplesCache.clear();
    }
  }

  /**
   * Checks if all widths were calculated. If not then return `true` (need recalculate).
   *
   * @returns {boolean}
   */
  isNeedRecalculate(): boolean {
    return !!this.columnWidthsMap.getValues()
      .slice(0, this.measuredColumns).filter(item => (item === null)).length;
  }

  /**
   * Recalculates widths for currently visible columns (cache misses only) and consumes the
   * width refresh queue populated by data, header, or row-set changes.
   */
  #onBeforeRender = () => {
    this.calculateVisibleColumnsWidth();

    if (!this.inProgress) {
      this.#refreshQueuedColumnsWidth();
    }
  };

  /**
   * Triggers a full column width recalculation after new data is loaded, skipping the initial
   * load since `#onInit` already handles it.
   */
  #onAfterLoadData = (_sourceData: unknown[], isFirstLoad: boolean) => {
    // Queued cells describe the previous dataset — their rows and previous values are
    // meaningless once the data is replaced. Cleared unconditionally (even when the view is
    // not visible and no sweep runs), so a pending entry that survived a suspended render
    // can never feed the width-determiner probe with stale coordinates.
    this.#columnWidthsToRefresh.clear();

    if (!isFirstLoad) {
      this.recalculateAllColumnsWidth();
    }
  };

  /**
   * Queues the cells affected by the incoming changes, keyed by their visual column, so the
   * width-determiner probe can decide before the next render whether each column's width
   * actually needs a refresh.
   */
  #onBeforeChange = (changes: CellChange[]) => {
    changes.forEach(([row, columnProperty, oldValue]) => {
      if (typeof columnProperty === 'function') {
        return;
      }

      const visualColumn = this.hot.propToCol(columnProperty);

      if (visualColumn === null || !Number.isInteger(visualColumn)) {
        return;
      }

      const entry = this.#columnWidthsToRefresh.get(visualColumn);

      // The column is already queued for a full rescan.
      if (entry === null) {
        return;
      }

      const cell = { row, oldValue, hasOldValue: true };

      if (entry === undefined) {
        this.#columnWidthsToRefresh.set(visualColumn, [cell]);
      } else {
        entry.push(cell);
      }
    });
  };

  /**
   * Drops the cached samples after a source-data write. Source-level changes bypass
   * `beforeChangeRender`, so there is no per-cell change information to refresh the samples
   * with — the render that follows falls back to full scans for the visible columns.
   */
  #onAfterSetSourceDataAtCell = () => {
    this.#columnSamplesCache.clear();
  };

  /**
   * Drops the cached samples of a column whose cell meta changed. Meta keys like
   * `valueFormatter`, `renderer`, `className`, or `type` affect the rendered width, and the
   * cached sample strings (formatted when they were sampled) would replay the previous meta
   * on the next re-measure — the next full render re-walks the column instead.
   */
  #onAfterSetCellMeta = (_row: number, column: number) => {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (physicalColumn !== null) {
      this.#columnSamplesCache.delete(physicalColumn);
    }
  };

  /**
   * Drops the cached samples when the set of rows that feeds the width calculation changes
   * (rows inserted, removed, moved, trimmed, or hidden). Sampling skips hidden rows and the
   * samples carry row coordinates, so a changed row set invalidates them — the next re-measure
   * falls back to a full scan, which lets a column shrink when its widest cell disappears.
   */
  #onRowIndexMapperCacheUpdate = (indexesChangesState: {
    indexesSequenceChanged: boolean, trimmedIndexesChanged: boolean, hiddenIndexesChanged: boolean
  }) => {
    const { indexesSequenceChanged, trimmedIndexesChanged, hiddenIndexesChanged } = indexesChangesState;

    if (indexesSequenceChanged || trimmedIndexesChanged || hiddenIndexesChanged) {
      this.#columnSamplesCache.clear();
    }
  };

  /**
   * Drops the cached samples when the column sequence changes (columns inserted, removed, or
   * moved) — the cache is keyed by physical column index, and a structural change would leave
   * the samples associated with the wrong columns.
   */
  #onColumnIndexMapperCacheUpdate = (indexesChangesState: { indexesSequenceChanged: boolean }) => {
    if (indexesChangesState.indexesSequenceChanged) {
      this.#columnSamplesCache.clear();
    }
  };

  /**
   * Recalculates the column width from content on a double-click and returns it as the new
   * size; returns the user-dragged size otherwise.
   */
  #onBeforeColumnResize = (size: number, column: number, isDblClick: boolean) => {
    let newSize = size;

    if (isDblClick) {
      this.calculateColumnsWidth(column, undefined, true);

      newSize = this.getColumnWidth(column, undefined, false) ?? newSize;
    }

    return newSize;
  };

  /**
   * Initializes the column header cache and triggers the first full column width recalculation
   * after Handsontable has finished initializing.
   */
  #onInit = () => {
    this.#cachedColumnHeaders = this.hot.getColHeader() as unknown[];
    this.recalculateAllColumnsWidth();
    this.#isInitialized = true;
  };

  /**
   * Queues cells whose formula results changed so their columns' widths are refreshed before
   * the next render. The engine does not carry previous values, so the probe can only grow the
   * width in place — a potential shrink falls back to a full column rescan. Skips changes
   * belonging to a different sheet.
   */
  #onAfterFormulasValuesUpdate = (changes: unknown[]) => {
    if (!this.#isInitialized) {
      return;
    }

    const formulasPlugin = this.hot.getPlugin('formulas');
    const sheetId = (formulasPlugin as unknown as Record<string, unknown> | undefined)?.sheetId;

    changes.forEach((change: unknown) => {
      const changeRecord = change as Record<string, unknown>;
      const address = changeRecord.address as Record<string, unknown> | undefined;

      if (sheetId !== null && sheetId !== undefined && address?.sheet !== sheetId) {
        return;
      }

      const physicalColumn = Number(address?.col);
      const physicalRow = Number(address?.row);

      if (!Number.isInteger(physicalColumn)) {
        return;
      }

      const visualColumn = this.hot.toVisualColumn(physicalColumn);

      if (visualColumn === null) {
        return;
      }

      const entry = this.#columnWidthsToRefresh.get(visualColumn);

      // The column is already queued for a full rescan.
      if (entry === null) {
        return;
      }

      const visualRow = Number.isInteger(physicalRow) ? this.hot.toVisualRow(physicalRow) : null;

      // Without an addressable row the probe cannot measure the changed cell — fall back to
      // a full column rescan.
      if (visualRow === null) {
        this.#columnWidthsToRefresh.set(visualColumn, null);

        return;
      }

      const cell = { row: visualRow, oldValue: undefined, hasOldValue: false };

      if (entry === undefined) {
        this.#columnWidthsToRefresh.set(visualColumn, [cell]);
      } else {
        entry.push(cell);
      }
    });
  };

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.hot?.rowIndexMapper.removeLocalHook('cacheUpdated', this.#onRowIndexMapperCacheUpdate);
    this.hot?.columnIndexMapper.removeLocalHook('cacheUpdated', this.#onColumnIndexMapperCacheUpdate);
    this.ghostTable.clean();
    super.destroy();
  }
}
