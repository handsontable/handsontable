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
import type CellRange from '../../3rdparty/walkontable/src/cell/range';
import { MergedCellsWidths, isMultiColumnMerge } from './mergedCellsWidths';
import { FONT_REMEASURE_ORDER_INDEX } from '../../core/fontLoad';

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
 * The sampling options and `useHeaders` all take effect when you change them with
 * {@link Core#updateSettings}, and the column widths are recalculated so the new sampling is
 * applied to columns that were already measured. `samplingRatio` must be a whole number above
 * zero; any other value falls back to the default.
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

    // A merged cell that spans one column is that column's own content. One that spans several
    // columns would make its first column as wide as the whole text, so it is left out here and
    // `MergedCellsWidths` widens the column it is drawn from by what the spanned columns lack instead.
    if (!cellMeta.spanned || !isMultiColumnMerge(cellMeta.colspan)) {
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
   * The idle task that runs the next chunk of the sweep `calculateAllColumnsWidth()` started, or
   * `null` when no sweep is waiting for one.
   *
   * @type {number|null}
   */
  #sweepTask: number | null = null;
  /**
   * The visual columns a sweep that re-measures every column from its cached samples (a web font load) has
   * not measured yet, or `null` when no such sweep runs. The sweep's own draws leave these columns to it
   * (see `#sweepDrawPending`).
   *
   * @type {Set<number>|null}
   */
  #sweepPendingColumns: Set<number> | null = null;
  /**
   * `true` while a draw of the re-measure sweep is due: the render that follows the start of the sweep (the
   * one after the `afterFontsLoad` hook, or the render that starts an owed sweep) and the sweep's draws from
   * idle tasks. Such a render measures again only the on-screen columns the sweep already measured, from
   * their cached samples, and leaves the pending ones to it: its own re-walk would sample every column
   * without cached samples over the whole row range, which held the page for 0.7 s on a 100k × 20 grid.
   * Any other forced render (an application's `render()` after a write, a theme switch) measures every
   * on-screen column as it would with no sweep, so a change made during the sweep reaches the screen at
   * once, even while the page is too busy for the sweep's idle tasks to run.
   *
   * @type {boolean}
   */
  #sweepDrawPending = false;
  /**
   * The visual columns whose values or meta changed while a sweep sampled them. The sweep drops what it
   * sampled of such a column and samples it again from the first row.
   *
   * @type {Set<number>}
   */
  #sweepStaleColumns = new Set<number>();
  /**
   * `true` when a re-measure sweep was ended by a change that made its samples or widths stale (a cell
   * meta change, new settings, a changed row or column set) or by the grid being hidden, so the next render
   * of a visible grid starts it over. Held, not consumed, while the grid cannot be measured.
   *
   * @type {boolean}
   */
  #reMeasureOwed: boolean = false;
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
   * The widths that merged cells spanning several columns need from the column they are drawn in.
   * They are kept apart from `columnWidthsMap`, which holds what a column's own cells need, so the
   * width-determiner probe keeps comparing against that, and a demand can shrink again when a
   * spanned column grows or the merge goes away.
   *
   * @type {MergedCellsWidths}
   */
  #mergedCellsWidths = new MergedCellsWidths({
    getMergedAreas: () => {
      const mergeCells = this.hot.getPlugin('mergeCells');

      return mergeCells?.enabled ? mergeCells.getVisibleMergedAreas() : [];
    },
    isRowHidden: row => this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(row)),
    isColumnHidden: column => this.hot.columnIndexMapper.isHidden(this.hot.toPhysicalColumn(column)),
    toPhysicalRow: row => this.hot.toPhysicalRow(row),
    toPhysicalColumn: column => this.hot.toPhysicalColumn(column),
    toVisualColumn: column => this.hot.toVisualColumn(column),
    // The width before the stretch, which StretchColumns computes from these widths afterwards. Read with
    // the stretch, a fit that follows a stretched render left the merge short of its text.
    getColumnWidth: column => this.hot.getColWidth(column, 'StretchColumns'),
    formatCellText: (row, column) => this.#formatProbeValue(row, column, this.hot.getDataAtCell(row, column)),
    measureTexts: groups => this.#measureMergedCellsTexts(groups),
  });
  /**
   * The visual columns sampled over the whole row range since the last render began. A full rescan
   * queued for one of them in the same render would sample the same rows again.
   *
   * @type {Set<number>}
   */
  #scannedColumns: Set<number> = new Set();
  /**
   * When a merge or unmerge queued a full rescan of a visual column, the value `#refreshQueueSequence`
   * had then. The asynchronous sweep drops such an entry once it has scanned the column from a start
   * at or after that value, since the scan already saw the settled merge.
   *
   * @type {Map<number, number>}
   */
  #mergeRescanQueuedAt: Map<number, number> = new Map();
  /**
   * A counter raised by every merge or unmerge that queues a rescan.
   *
   * @type {number}
   */
  #refreshQueueSequence = 0;
  /**
   * `true` while an idle chunk of the asynchronous sweep runs. Its width writes then leave the merged
   * cells fit pending, and the sweep fits once when it ends instead of after every chunk.
   *
   * @type {boolean}
   */
  #deferMergedCellsFit = false;
  /**
   * The visual columns the current ghost table re-renders from their cached samples. A width change
   * for one of them can only come from a style change, which the merges' kept widths need to follow.
   *
   * @type {Set<number>}
   */
  #replayedColumns: Set<number> = new Set();
  /**
   * The `useHeaders` option value as this plugin last applied it.
   *
   * Kept separately from the ghost table's own copy of the setting, which `#measureCellsWidth()`
   * flips and restores while probing, so the settings-change detection never reads a value that
   * belongs to a measurement in flight.
   *
   * @type {*}
   */
  #appliedUseHeaders: unknown = undefined;
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
    this.addHook('afterFontsLoad', this.#onAfterFontsLoad, FONT_REMEASURE_ORDER_INDEX);
    this.addHook('beforeLoadData', this.#onBeforeDataReplace);
    this.addHook('beforeChangeRender', this.#onBeforeChange);
    this.addHook('afterSetCellMeta', this.#onAfterSetCellMeta);
    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell);
    this.addHook('afterFormulasValuesUpdate', this.#onAfterFormulasValuesUpdate);
    this.addHook('beforeMergeCells', this.#onBeforeMergeChange);
    this.addHook('beforeUnmergeCells', this.#onBeforeMergeChange);
    this.addHook('afterMergeCells', this.#onAfterMergeCells);
    this.addHook('afterUnmergeCells', this.#onAfterUnmergeCells);
    this.addHook('afterUpdateData', this.#onAfterUpdateData);
    this.addHook('beforeUndo', this.#onBeforeUndoRedo);
    this.addHook('beforeRedo', this.#onBeforeUndoRedo);
    this.addHook('beforeRender', this.#onBeforeRender);
    this.addHook('modifyColWidth', (width: number, col: number) => this.getColumnWidth(col, width), -10);
    this.addHook('init', this.#onInit);

    this.hot.rowIndexMapper.addLocalHook('cacheUpdated', this.#onRowIndexMapperCacheUpdate);
    this.hot.columnIndexMapper.addLocalHook('cacheUpdated', this.#onColumnIndexMapperCacheUpdate);
    this.hot.columnIndexMapper.addLocalHook('change', this.#onColumnIndexMapChange);
    // Nothing reached the merged cell widths while the plugin was off, and the measured widths that
    // survive a disable would not change on the next render, so no other input would fit them.
    this.#mergedCellsWidths.markStale();

    this.#disposeMapObserver = this.hot.columnIndexMapper
      .observeMapChange(this.columnWidthsMap, () => {
        this.hot.view?.invalidateColumnWidthCache();
      });

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when {@link Core#updateSettings} is invoked.
   *
   * @param {object} [newSettings] The settings passed to `updateSettings`.
   */
  updatePlugin(newSettings?: Record<string, unknown>): void {
    // `SETTING_KEYS` is `true`, so an update that never mentions this plugin still arrives here -
    // and `BasePlugin#onUpdateSettings` has already fed `updatePluginSettings()` the missing key as
    // `undefined`, wiping the stored settings. Restore them from the merged settings before reading
    // them, or an unrelated `updateSettings({ readOnly: true })` would read the defaults, reset the
    // user's `samplingRatio`, and re-measure every column. The Vue wrapper makes this the common
    // case, not the rare one: it omits every key whose value is unchanged.
    if (newSettings !== undefined && newSettings[PLUGIN_KEY] === undefined) {
      this.updatePluginSettings(this.hot.getSettings()[PLUGIN_KEY]);
    }

    this.findColumnsWhereHeaderWasChanged().forEach((visualColumn) => {
      this.#columnWidthsToRefresh.set(visualColumn, null);
    });

    // The sampling settings have to be re-read here, not only in `enablePlugin`: that method
    // returns early on an already-enabled plugin, and `BasePlugin` only re-runs the enable/disable
    // pair when the plugin's enabled state itself changed. Without this, `samplingRatio`,
    // `allowSampleDuplicates` and `useHeaders` were silently ignored whenever they arrived through
    // `updateSettings`.
    //
    // The widths are re-measured only when one of them actually changed - re-measuring on every
    // update would undo the work the `skipUnchangedWrites` map exists to avoid.
    //
    // `recalculateAllColumnsWidth()` rather than `clearCache()`: a bare clear empties every
    // measured width, but the only render-time measurement is `calculateVisibleColumnsWidth()`, so
    // every column outside the viewport would keep the default width until it is scrolled into
    // view. This mirrors `#onAfterLoadData`, the other "everything is stale" path. On a grid that
    // is not visible it is a no-op, which leaves the previous widths in place - the same
    // limitation that path already has, and a smaller wrong than a grid of default widths.
    if (this.#applySamplingSettings() || this.#samplingChangedOnEnable) {
      this.recalculateAllColumnsWidth();
    }

    this.#samplingChangedOnEnable = false;

    // Settings can restyle a merge's text (a `className` through `cells`, a renderer), which no other
    // input reports. Plain columns re-measure through the samples cache dropped below; the merges read
    // their texts again on the next render.
    this.#markMergedCellsChanged();

    // Settings may remap the data that feeds the samples (e.g. a new `columns` definition), so
    // the cached samples cannot be trusted — the next re-measure falls back to a full scan.
    this.#columnSamplesCache.clear();
    this.#invalidateReMeasureSweep();
    super.updatePlugin();
  }

  /**
   * Reads the sampling-related settings and applies them to the samples generator and the ghost
   * table.
   *
   * @returns {boolean} `true` when a setting changed, which means the measured widths are stale.
   */
  #applySamplingSettings(): boolean {
    const useHeaders = this.getSetting('useHeaders');
    // Compared against the last value this method applied, not against
    // `ghostTable.getSetting('useHeaders')`: the ghost table's copy is render-time scratch state
    // that `#measureCellsWidth()` deliberately flips and restores, and reading it here would tie
    // the change detection to that restore being perfect.
    const hasHeadersChanged = this.#appliedUseHeaders !== useHeaders;

    this.#appliedUseHeaders = useHeaders;
    this.ghostTable.setSetting('useHeaders', useHeaders);

    const hasSamplingChanged = this.samplesGenerator.applySamplingOptions({
      samplingRatio: this.getSetting('samplingRatio'),
      allowDuplicates: this.getSetting<boolean>('allowSampleDuplicates'),
    });

    return hasHeadersChanged || hasSamplingChanged;
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
    this.hot.columnIndexMapper.removeLocalHook('change', this.#onColumnIndexMapChange);
    this.#cancelSweep();
    this.#mergedCellsWidths.clear();

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

    const pendingColumns = this.#sweepPendingColumns;

    const overwriteCache = this.hot.forceFullRender;

    if (pendingColumns === null || !overwriteCache || !this.#sweepDrawPending) {
      this.calculateColumnsWidth({ from: firstVisibleColumn, to: lastVisibleColumn }, undefined, overwriteCache);

      return;
    }

    // The sweep's own draw: the sweep measures the columns it has not reached yet (see `#sweepDrawPending`).
    rangeEach(firstVisibleColumn, lastVisibleColumn, (visualColumn) => {
      this.calculateColumnsWidth(visualColumn, undefined, !pendingColumns.has(visualColumn));
    });
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
          !this.hot._getColWidthFromSettings(visualColumn))) {
        const cachedSamples = overwriteCache ? this.#columnSamplesCache.get(physicalColumn) : undefined;

        // A re-measure (cache overwrite) with an intact samples cache re-renders the previously
        // sampled values — picking up CSS or renderer changes — without re-walking the row range.
        // Data changes refresh or drop the cached samples, so a full scan runs only when needed.
        if (cachedSamples !== undefined) {
          this.#replayedColumns.add(visualColumn);
          this.#addGhostTableColumn(visualColumn, cachedSamples);
        } else {
          this.#fillGhostTableWithSamples(visualColumn, rowsRange);
        }
      }
    });

    if (this.ghostTable.columns.length) {
      this.#updateColumnWidthsMapBasedOnGhostTable();
      this.measuredColumns = columnsRange.to + 1;
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
    this.#sweepColumns({
      rowsRange: typeof rowRange === 'number' ? { from: rowRange, to: rowRange } : rowRange,
      overwriteCache,
      syncColumns: this.getSyncCalculationLimit() + 1,
      reuseSamples: false,
      viewportFirst: false,
    });
  }

  /**
   * Sweeps every column and measures the ones that need it. The first `syncColumns` columns are measured
   * exactly, over the whole row range, before this method returns. The rest go in chunks bounded by
   * {@link AutoColumnSize.CALCULATION_STEP} and {@link AutoColumnSize.CALCULATION_CELLS_BUDGET}: the first
   * chunk runs now, the others in idle tasks.
   *
   * With `viewportFirst`, the rendered columns come first in the sweep, so the first chunk measures what is on
   * screen. With `reuseSamples`, a column that has cached samples is measured from them instead of being
   * sampled again. That fits a re-measure after a change to how the values render, not to which values are
   * sampled (a web font). The sweeps that follow a data change leave it off: their cached samples describe
   * the previous data.
   *
   * @param {object} options The sweep options.
   * @param {object} options.rowsRange The visual row range to sample, with `from` and `to` indexes.
   * @param {boolean} options.overwriteCache If `true`, every column is measured, whether or not it has a width.
   * @param {number} options.syncColumns How many columns, in sweep order, are measured exactly before this method returns.
   * @param {boolean} options.reuseSamples If `true`, a column with cached samples is measured from them.
   * @param {boolean} options.viewportFirst If `true`, the rendered columns are swept first.
   */
  #sweepColumns({ rowsRange, overwriteCache, syncColumns, reuseSamples, viewportFirst }: {
    rowsRange: { from: number, to: number },
    overwriteCache: boolean,
    syncColumns: number,
    reuseSamples: boolean,
    viewportFirst: boolean,
  }) {
    const columnQueue = this.#columnSweepOrder(viewportFirst);
    let queueIndex = 0;
    let currentRowCursor = rowsRange.from;
    let columnSamples: ColumnSamples | null = null;
    let columnStartSequence = 0;

    this.#cancelSweep();
    this.inProgress = true;
    this.#sweepPendingColumns = reuseSamples ? new Set(columnQueue) : null;
    this.#sweepStaleColumns.clear();

    // A sweep that skips the columns that have a width cannot pay an owed re-measure.
    if (overwriteCache) {
      this.#reMeasureOwed = false;
    }

    const shouldMeasureColumn = (visualColumn: number) => {
      return overwriteCache || (this.columnWidthsMap.getValueAtIndex(this.#toPhysicalColumn(visualColumn)) === null &&
          !this.hot._getColWidthFromSettings(visualColumn));
    };

    /**
     * Sweeps up to `columnsBudget` columns, sampling at most `cellsBudget` cells. A column whose
     * remaining row range exceeds the cells budget is left mid-sweep (its samples accumulate in
     * `columnSamples`) and is continued by the next call. Returns `true` when every column has
     * been processed.
     *
     * The row and column bounds are clamped to the grid on every call: an `updateData()` between two
     * idle tasks (a wrapper re-render) can shrink the data, and sampling a column the grid no longer
     * has left the ghost table with a column it never built.
     *
     * @param {number} columnsBudget The maximum number of columns to process in this chunk.
     * @param {number} cellsBudget The maximum number of cells to sample in this chunk.
     * @returns {boolean}
     */
    // Moves the sweep past the column it is on, which the sweep has measured, replayed, or skipped.
    const nextColumn = () => {
      this.#sweepPendingColumns?.delete(columnQueue[queueIndex]);
      queueIndex += 1;
    };
    const processChunk = (columnsBudget: number, cellsBudget: number) => {
      let remainingColumns = columnsBudget;
      let remainingCells = cellsBudget;
      const lastLiveColumn = this.hot.countCols() - 1;
      const lastLiveRow = Math.min(rowsRange.to, this.hot.countRows() - 1);

      while (remainingColumns > 0 && queueIndex < columnQueue.length) {
        const currentColumn = columnQueue[queueIndex];

        if (currentColumn > lastLiveColumn) {
          // The grid lost this column, together with the samples of one left mid-sweep. Skipping it costs
          // nothing, so it takes nothing from the budget.
          columnSamples = null;
          nextColumn();
          continue;
        }

        if (columnSamples !== null && this.#sweepStaleColumns.has(currentColumn)) {
          // A source write or a meta change reached the cells sampled so far.
          columnSamples = null;
        }

        this.#sweepStaleColumns.delete(currentColumn);

        if (columnSamples === null) {
          if (!shouldMeasureColumn(currentColumn)) {
            nextColumn();
            remainingColumns -= 1;
            continue;
          }

          // A column with a queued edit is sampled again: its cached samples predate the edit, and the
          // queue waits for the sweep to end before it can refresh them.
          const cachedSamples = reuseSamples && !this.#columnWidthsToRefresh.has(currentColumn) ?
            this.#columnSamplesCache.get(this.#toPhysicalColumn(currentColumn)) : undefined;

          if (cachedSamples !== undefined) {
            this.#replayedColumns.add(currentColumn);
            this.#addGhostTableColumn(currentColumn, cachedSamples);
            nextColumn();
            remainingColumns -= 1;
            continue;
          }

          columnSamples = new Map();
          columnStartSequence = this.#refreshQueueSequence;
          currentRowCursor = rowsRange.from;
        }

        if (currentRowCursor <= lastLiveRow) {
          if (remainingCells <= 0) {
            return false;
          }

          const sliceTo = Math.min(lastLiveRow, currentRowCursor + remainingCells - 1);

          this.samplesGenerator
            .generateSample('col', { from: currentRowCursor, to: sliceTo }, currentColumn, columnSamples);

          remainingCells -= sliceTo - currentRowCursor + 1;
          currentRowCursor = sliceTo + 1;
        }

        if (currentRowCursor > lastLiveRow) {
          this.#addGhostTableColumn(currentColumn, columnSamples);
          this.#columnSamplesCache.set(this.#toPhysicalColumn(currentColumn), columnSamples);
          this.#dropRescanCoveredBySweep(currentColumn, columnStartSequence);
          columnSamples = null;
          nextColumn();
          remainingColumns -= 1;
        }
      }

      return queueIndex >= columnQueue.length;
    };
    /**
     * Writes the measured widths and, for a re-measure, tells whether any of them changed the width of a
     * column on screen. Measuring an on-screen column whose width stays (the hook fires for every font the
     * page loads, an icon font too) is not a reason to draw.
     *
     * @returns {boolean}
     */
    const flushGhostTable = () => {
      if (!this.ghostTable.columns.length) {
        return false;
      }

      const changedColumns = this.#updateColumnWidthsMapBasedOnGhostTable();
      let changedOnScreen = false;

      if (reuseSamples && changedColumns.length > 0) {
        const onScreenColumns = this.#onScreenColumns();

        changedOnScreen = changedColumns.some(visualColumn => onScreenColumns.has(visualColumn));
      }

      // `measuredColumns` counts a prefix of the visual columns, which a sweep in another order does not extend.
      if (!viewportFirst) {
        this.measuredColumns = queueIndex;
      }

      return changedOnScreen;
    };

    /**
     * Runs one chunk of the sweep.
     *
     * @param {boolean} fromIdleTask `true` when an idle task runs the chunk, `false` for the chunk run by the
     * caller of the sweep.
     */
    const loop = (fromIdleTask: boolean) => {
      this.#sweepTask = null;

      // When hot was destroyed after calculating finished cancel frame
      if (!this.hot) {
        this.#finishSweep();

        return;
      }

      // The ghost table measures inside the root element, so a grid hidden since the sweep started reads a
      // width of 0 for every column, which draws them at the minimum width once the grid is shown again.
      // A re-measure is owed to the first render of the visible grid; a sweep that fills in missing widths
      // leaves them missing, and a draw measures the on-screen ones as it would any width it lacks.
      if (!this.hot.view.isVisible()) {
        this.#cancelSweep();
        // `||=`: a sweep that fills in missing widths keeps a re-measure owed from before.
        this.#reMeasureOwed ||= reuseSamples;

        return;
      }

      let isDone = false;
      let changedOnScreen = false;

      this.#deferMergedCellsFit = true;

      try {
        isDone = processChunk(
          AutoColumnSize.CALCULATION_STEP + 1,
          AutoColumnSize.CALCULATION_CELLS_BUDGET,
        );
        changedOnScreen = flushGhostTable();
      } finally {
        this.#deferMergedCellsFit = false;
      }

      if (isDone) {
        this.#finishSweep();
        this.#fitMergedCells();
      } else {
        this.#sweepTask = requestIdleTask(() => loop(true));
      }

      // A width written from an idle task reaches the screen only through a draw: the width map's observer
      // drops the engine's cache and nothing else. A re-measure draws when an idle chunk changed the width
      // of a column on screen, and once more when it ends, for the columns scrolled into view while it ran
      // and for the edits queued meanwhile (`#refreshQueuedColumnsWidth()` waits for the sweep to end).
      // The chunk run by the caller gets no draw of its own: the caller draws after it (the font re-measure
      // runs inside the `afterFontsLoad` hook, which a render follows), and a draw from inside the hook
      // would run before the other plugins and the user's listeners re-measured.
      if (reuseSamples && fromIdleTask && (changedOnScreen || isDone)) {
        this.#sweepDrawPending = true;
        this.hot.render();
      }
    };

    // sync — the `syncColumns` columns are calculated exactly (whole row range) before the first
    // paint, preserving the `syncLimit` contract.
    if (syncColumns > 0) {
      processChunk(syncColumns, Infinity);
      flushGhostTable();
    }
    // async
    if (queueIndex < columnQueue.length) {
      loop(false);
    } else {
      this.#finishSweep();
    }
  }

  /**
   * Lists the visual columns in the order a sweep measures them: ascending, or with the columns on screen
   * first so that the first chunk measures what the user sees.
   *
   * @param {boolean} viewportFirst If `true`, the columns on screen come first.
   * @returns {number[]}
   */
  #columnSweepOrder(viewportFirst: boolean): number[] {
    const columns = Array.from({ length: this.hot.countCols() }, (_, column) => column);

    if (!viewportFirst) {
      return columns;
    }

    const onScreenColumns = this.#onScreenColumns();

    return [...onScreenColumns, ...columns.filter(column => !onScreenColumns.has(column))];
  }

  /**
   * Collects the visual columns on screen: the frozen ones at both edges and the rendered range of the
   * scrollable part. The rendered range alone misses the frozen columns once the grid is scrolled
   * sideways, since the master table then starts past them.
   *
   * @returns {Set<number>}
   */
  #onScreenColumns(): Set<number> {
    const countCols = this.hot.countCols();
    const onScreenColumns = new Set<number>();

    const fixedColumnsStart = Math.min(this.hot.view.countFixedColumnsStart(), countCols);
    const firstFixedColumnEnd = Math.max(countCols - this.hot.view.countFixedColumnsEnd(), 0);

    rangeEach(0, fixedColumnsStart - 1, column => onScreenColumns.add(column));

    const firstVisibleColumn = this.getFirstVisibleColumn();
    const lastVisibleColumn = this.getLastVisibleColumn();

    if (firstVisibleColumn !== -1 && lastVisibleColumn !== -1) {
      rangeEach(firstVisibleColumn, Math.min(lastVisibleColumn, countCols - 1), column => onScreenColumns.add(column));
    }

    rangeEach(firstFixedColumnEnd, countCols - 1, column => onScreenColumns.add(column));

    return onScreenColumns;
  }

  /**
   * Translates a visual column index to its physical index, and keeps the visual index for a column the
   * index mapper does not know.
   *
   * @param {number} visualColumn Visual column index.
   * @returns {number}
   */
  #toPhysicalColumn(visualColumn: number): number {
    return this.hot.toPhysicalColumn(visualColumn) ?? visualColumn;
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
    this.#mergeRescanQueuedAt.clear();

    const totalRows = this.hot.countRows();
    const fullRescanColumns: number[] = [];
    const probes: ColumnWidthProbe[] = [];

    queue.forEach((cells, visualColumn) => {
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn === null || this.hot._getColWidthFromSettings(visualColumn)) {
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
        // A merge queues its columns for a rescan, and a full render may have sampled them
        // already with the settled meta, earlier in the same `beforeRender`.
        if (!this.#scannedColumns.has(visualColumn)) {
          this.#fillGhostTableWithSamples(visualColumn, rowsRange);
        }
      });
    }

    if (this.ghostTable.columns.length) {
      this.#updateColumnWidthsMapBasedOnGhostTable();
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
      this.#mergedCellsWidths.markWidthsChanged();
      this.#fitMergedCells();
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

      this.#scannedColumns.add(column);
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
   * Updates the column widths map with calculated widths from the ghost table, empties the ghost
   * table, and then fits the merged cells again when a width changed. The fit measures through the
   * ghost table too, so it has to run after the clean.
   *
   * @returns {number[]} The visual columns whose width changed.
   */
  #updateColumnWidthsMapBasedOnGhostTable(): number[] {
    let stylesChanged = false;
    const changedColumns: number[] = [];

    this.hot.batchExecution(() => {
      this.ghostTable.getWidths((visualColumn: number, width: number) => {
        const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

        if (this.columnWidthsMap.getValueAtIndex(physicalColumn) !== width) {
          changedColumns.push(visualColumn);
          this.#mergedCellsWidths.markWidthsChanged();
          stylesChanged ||= this.#replayedColumns.has(visualColumn);
        }

        this.columnWidthsMap.setValueAtIndex(physicalColumn, width);
      });
    }, true);
    this.ghostTable.clean();
    this.#replayedColumns.clear();

    // The same samples rendered to another width: the styles changed, so the merges' widths, kept from
    // the same texts, are measured again too.
    if (stylesChanged) {
      this.#mergedCellsWidths.markStylesChanged();
    }

    if (!this.#deferMergedCellsFit) {
      this.#fitMergedCells();
    }

    return changedColumns;
  }

  /**
   * Fits the widths that merged cells spanning several columns need, when anything they depend on
   * changed since the last fit. A column that a merge appeared in or left without a merge hook (an
   * undo of an unmerge restores the merge through MergeCells' state, silently) is queued for a full
   * rescan, since its samples were taken under the previous merges.
   */
  #fitMergedCells() {
    const { changed, mergesChangedIn } = this.#mergedCellsWidths.fit();

    mergesChangedIn.forEach((visualColumn) => {
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn !== null) {
        this.#columnSamplesCache.delete(physicalColumn);
      }

      this.#columnWidthsToRefresh.set(visualColumn, null);
    });

    if (changed) {
      this.hot.view?.invalidateColumnWidthCache();
    }
  }

  /**
   * Drops the full rescan a merge queued for a column the asynchronous sweep has just scanned, when
   * the scan started after the merge. Merges declared in the settings arrive while the sweep runs, so
   * without this every merged column past `syncLimit` was scanned twice.
   *
   * @param {number} visualColumn The visual column the sweep finished.
   * @param {number} startSequence The value of `#refreshQueueSequence` when the scan started.
   */
  #dropRescanCoveredBySweep(visualColumn: number, startSequence: number) {
    const queuedAt = this.#mergeRescanQueuedAt.get(visualColumn);

    if (queuedAt !== undefined && queuedAt <= startSequence && this.#columnWidthsToRefresh.get(visualColumn) === null) {
      this.#columnWidthsToRefresh.delete(visualColumn);
      this.#mergeRescanQueuedAt.delete(visualColumn);
    }
  }

  /**
   * Measures the widest of the given formatted texts per column, the way the samples are measured.
   * It feeds `MergedCellsWidths` with the text of merged cells.
   *
   * @param {object[]} groups The visual `column` and the `texts` (`row` and `value`) to measure.
   * @returns {Map<number, number>} The widths keyed by visual column index.
   */
  #measureMergedCellsTexts(groups: Array<{ column: number, texts: Array<{ row: number, value: unknown }> }>) {
    return this.#measureCellsWidth(groups.map(({ column, texts }) => ({
      visualColumn: column,
      samples: this.samplesGenerator.generateSampleFromValues('col', texts.map(({ row, value }) => ({
        index: row,
        value,
      }))),
    })));
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
      this.#mergeRescanQueuedAt.clear();
      // An overwrite sweep follows a theme or style change too, which changes the merges' text width.
      this.#mergedCellsWidths.markStale();
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
   * The width fits the column's own cells and, with the {@link MergeCells} plugin enabled, the merged
   * cells drawn from the column: a merged cell that spans several columns makes this column wide
   * enough for its content together with the other columns it spans.
   *
   * @param {number} column Visual column index.
   * @param {number} [defaultWidth] Default column width. It will be picked up if no calculated width found.
   * @param {boolean} [keepMinimum=true] If `true` then returned value won't be smaller then 50 (default column width).
   * @returns {number}
   */
  getColumnWidth(column: number, defaultWidth?: number, keepMinimum: boolean = true): number | undefined {
    let width = defaultWidth;

    if (width === undefined) {
      const physicalColumn = this.hot.toPhysicalColumn(column);
      const mergedCellWidth = this.#mergedCellsWidths.getWidth(physicalColumn);

      width = this.columnWidthsMap.getValueAtIndex<number>(physicalColumn);

      if (mergedCellWidth !== undefined) {
        width = Math.max(width ?? 0, mergedCellWidth);
      }

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
          this.#mergedCellsWidths.clearColumn(physicalIndex);
        });
      }, true);

    } else {
      this.columnWidthsMap.clear();
      this.#columnSamplesCache.clear();
      this.#mergedCellsWidths.clear();
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
   * width refresh queue populated by data, header, or row-set changes. Starts an owed re-measure sweep
   * first, so this render draws the on-screen columns from it.
   */
  #onBeforeRender = () => {
    this.#scannedColumns.clear();

    if (this.#reMeasureOwed && this.hot.view.isVisible() && this.hot.countRows() > 0 && this.hot.countCols() > 0) {
      this.#startReMeasureSweep();
    }

    this.calculateVisibleColumnsWidth();
    this.#sweepDrawPending = false;

    if (!this.inProgress) {
      this.#refreshQueuedColumnsWidth();
    }

    // A merge's text that changed without a width change (an edit of its first cell) is fitted here.
    this.#fitMergedCells();

    // The fit can queue the columns of a merge that changed with no hook; they are rescanned in the
    // same render, which fits again with the settled samples.
    if (!this.inProgress && this.#columnWidthsToRefresh.size > 0) {
      this.#refreshQueuedColumnsWidth();
    }
  };

  /**
   * Re-measures every column after the document loaded a web font. The sweep takes the columns on screen
   * first and measures one chunk now, so the render that follows the hook draws them in the new font; the
   * rest wait for idle tasks, and the sweep draws the grid again as they reach the screen. Measuring every
   * column at once held the page for 0.7–0.9 s on the first load after init on a 100k × 20 grid, because the
   * init sweep drops its samples. The font changes how the
   * sampled values render, not which values are sampled, so a column with cached samples is measured from
   * them: `recalculateAllColumnsWidth()` would drop that cache, and the next render would sample every
   * column again. Core fires the hook only on a visible grid.
   */
  #onAfterFontsLoad = () => {
    // With no rows the widths stay (see `calculateVisibleColumnsWidth()`): they can come from rows the grid
    // had before, which a measure of the headers alone would shrink. The re-measure is owed to the first
    // render with rows.
    if (!this.hot.countRows()) {
      this.#reMeasureOwed = true;

      return;
    }

    // The font changes the merges' text widths too. A column sampled afresh (the first load after init, whose
    // samples the init sweep dropped) does not report a style change, so the merges would keep the widths
    // measured in the fallback font.
    this.#mergedCellsWidths.markStylesChanged();
    this.#startReMeasureSweep();
  };

  /**
   * Starts the sweep that re-measures every column from its cached samples, on-screen columns first, with
   * the first chunk run now (see `#onAfterFontsLoad`).
   */
  #startReMeasureSweep() {
    this.#sweepColumns({
      rowsRange: { from: 0, to: this.hot.countRows() - 1 },
      overwriteCache: true,
      syncColumns: 0,
      reuseSamples: true,
      viewportFirst: true,
    });
    this.#sweepDrawPending = this.#sweepPendingColumns !== null;
  }

  /**
   * Queues the rescans a merge needs. A merge made by the user clears the cells it covers, and its
   * first cell stops contributing a sample, so every column it spans is rescanned. A merge applied
   * from the settings (`auto`: at init, on `updateSettings`, on a sheet switch) keeps the covered
   * values, which the grid never drew in those columns, so only its first column is rescanned: the
   * sweep measured that column's text before the merge existed. The visible columns are re-walked on
   * the next full render either way.
   */
  #onAfterMergeCells = (cellRange: CellRange, _mergeParent: unknown, auto: boolean) => {
    this.#queueMergeRescan(cellRange, auto);
  };

  /**
   * Marks the drawn merges as changed before a merge or unmerge writes anything: MergeCells renders
   * inside the call (clearing the covered cells), before its `after*` hook, and that render's fit must
   * read the merges rather than reuse the groups of the previous fit.
   */
  #onBeforeMergeChange = () => {
    this.#mergedCellsWidths.markLayoutChanged();
  };

  /**
   * Queues a full rescan of every column an unmerged area covers: its cells contribute samples again.
   */
  #onAfterUnmergeCells = (cellRange: CellRange) => {
    this.#queueMergeRescan(cellRange, false);
  };

  /**
   * Queues a full rescan of the columns of a merged area, or of its first column only, and asks for a
   * fit of the merges drawn from them. The cached samples of every spanned column are dropped, so the
   * next full render re-walks the visible ones with the settled meta.
   *
   * @param {CellRange} cellRange The merged or unmerged area.
   * @param {boolean} firstColumnOnly `true` to rescan only the area's first column.
   */
  #queueMergeRescan(cellRange: CellRange, firstColumnOnly: boolean) {
    const from = cellRange.getTopStartCorner().col;
    const to = cellRange.getBottomEndCorner().col;

    if (from === null || to === null) {
      return;
    }

    rangeEach(from, to, (visualColumn) => {
      const physicalColumn = this.hot.toPhysicalColumn(visualColumn);

      if (physicalColumn !== null) {
        this.#columnSamplesCache.delete(physicalColumn);
      }

      if (!firstColumnOnly || visualColumn === from) {
        this.#columnWidthsToRefresh.set(visualColumn, null);
        this.#refreshQueueSequence += 1;
        this.#mergeRescanQueuedAt.set(visualColumn, this.#refreshQueueSequence);
        this.#mergedCellsWidths.markMergesChanged(visualColumn);
      }
    });
    this.#invalidateReMeasureSweep();
  }

  /**
   * Ends a re-measure sweep whose samples or widths a change made stale, and owes a new one to the next
   * render. A changed row or column set leaves the sweep's queue of visual columns describing other
   * columns, and new settings or a cell meta change can restyle every column the sweep measured. The sweep
   * that starts over measures the on-screen columns before that render draws them, from cached samples where
   * they survived. A source write does not end it (see `#onAfterSetSourceDataAtCell`).
   */
  #invalidateReMeasureSweep() {
    if (this.#sweepPendingColumns === null) {
      return;
    }

    this.#cancelSweep();
    this.#reMeasureOwed = true;
  }

  /**
   * Makes a re-measure sweep sample a column again when its values or meta changed while the sweep was
   * sampling it: the rows it sampled before the change would otherwise feed the column's width.
   *
   * @param {number} visualColumn The visual column index.
   */
  #markSweepColumnStale(visualColumn: number) {
    if (this.#sweepPendingColumns?.has(visualColumn)) {
      this.#sweepStaleColumns.add(visualColumn);
    }
  }

  /**
   * Stops a sweep still measuring the data that is being replaced (`loadData()`, a sheet
   * switch). Its row range and its last column describe that data, so its next chunk sampled cells the new
   * data does not have, and left the ghost table broken for every later render.
   */
  #onBeforeDataReplace = () => {
    this.#cancelSweep();
  };

  /**
   * Cancels the idle task of a sweep in progress. Called when a new sweep starts, when the data is replaced,
   * and when the plugin is turned off or destroyed.
   */
  #cancelSweep() {
    if (this.#sweepTask !== null) {
      cancelIdleTask(this.#sweepTask);
      this.#sweepTask = null;
    }

    this.#finishSweep();
  }

  /**
   * Marks the sweep as over. The next forced render measures every on-screen column again, from the samples
   * a re-measure sweep cached.
   */
  #finishSweep() {
    this.inProgress = false;
    this.#sweepPendingColumns = null;
    this.#sweepDrawPending = false;
    this.#sweepStaleColumns.clear();
  }

  /**
   * Triggers a full column width recalculation after new data is loaded, skipping the initial
   * load since `#onInit` already handles it. The Formulas plugin registers its own
   * `afterLoadData` listener ahead of this one, so the sweep reads the values the engine derives
   * from the new data, and the refinement queue the engine update fills is discarded by the
   * sweep instead of triggering a second full rescan.
   */
  #onAfterLoadData = (_sourceData: unknown[], isFirstLoad: boolean) => {
    // Queued cells describe the previous dataset — their rows and previous values are
    // meaningless once the data is replaced. Cleared unconditionally (even when the view is
    // not visible and no sweep runs), so a pending entry that survived a suspended render
    // can never feed the width-determiner probe with stale coordinates.
    this.#columnWidthsToRefresh.clear();
    // An owed re-measure would sweep the new data from samples of the previous one.
    this.#reMeasureOwed = false;
    this.#mergeRescanQueuedAt.clear();
    this.#mergedCellsWidths.markRenumbered();

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

      if (this.#invalidateMergedCellText(row, visualColumn)) {
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
  #onAfterSetSourceDataAtCell = (changes: CellChange[]) => {
    this.#columnSamplesCache.clear();

    // A re-measure sweep goes on: the forced render after the write measures the on-screen columns, and the
    // sweep samples the others itself. Ending it on every write restarted it from its first column on the
    // next draw, so the on-screen columns past its first chunk stayed unmeasured for as long as writes kept
    // coming (a stream every 200 ms).
    if (this.#sweepPendingColumns !== null) {
      changes.forEach(([, columnProperty]) => {
        const visualColumn = typeof columnProperty === 'function' ? null : this.hot.propToCol(columnProperty);

        if (Number.isInteger(visualColumn)) {
          this.#markSweepColumnStale(Number(visualColumn));
        }
      });
    }

    // UndoRedo writes its values back through this path, so an undone edit of a merge's first cell
    // arrives here and not through `beforeChangeRender`.
    if (this.#mergedCellsWidths.mayHaveMultiColumnMerges()) {
      changes.forEach(([physicalRow, columnProperty]) => {
        const visualRow = this.hot.toVisualRow(physicalRow);
        const visualColumn = typeof columnProperty === 'function' ? null : this.hot.propToCol(columnProperty);

        if (visualRow !== null && Number.isInteger(visualColumn)) {
          this.#invalidateMergedCellText(visualRow, Number(visualColumn));
        }
      });
    }
  };

  /**
   * Asks for a fit when the cell is the first cell of a merge that spans several columns. That cell
   * contributes no sample, so neither the probe nor a rescan can see its text.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {boolean} `true` when the cell is such a first cell.
   */
  #invalidateMergedCellText(row: number, column: number) {
    if (!this.#mergedCellsWidths.mayHaveMultiColumnMerges()) {
      return false;
    }

    const cellMeta = this.hot.getCellMetaTransient(row, column);

    if (cellMeta.spanned && isMultiColumnMerge(cellMeta.colspan)) {
      this.#mergedCellsWidths.invalidateCell(row, column);

      return true;
    }

    return false;
  }

  /**
   * Drops the cached samples of a column whose cell meta changed. Meta keys like
   * `valueFormatter`, `renderer`, `className`, or `type` affect the rendered width, and the
   * cached sample strings (formatted when they were sampled) would replay the previous meta
   * on the next re-measure — the next full render re-walks the column instead.
   */
  #onAfterSetCellMeta = (row: number, column: number) => {
    const physicalColumn = this.hot.toPhysicalColumn(column);

    if (physicalColumn !== null) {
      this.#columnSamplesCache.delete(physicalColumn);
      this.#invalidateReMeasureSweep();
    }

    this.#invalidateMergedCellText(row, column);
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
      this.#invalidateReMeasureSweep();

      // A removed, trimmed, or hidden row can take a merge out of the drawn grid or bring one back,
      // and MergeCells fires no merge hook for either. A changed sequence can renumber the physical
      // rows the kept texts are keyed by, so it forgets them; hiding and trimming only change which
      // merges are drawn, and the fit re-measures the groups that changed from the kept texts.
      this.#markMergedCellsChanged(indexesSequenceChanged ? 'numbering' : 'refit');
    }
  };

  /**
   * Drops the cached samples when the column sequence changes (columns inserted, removed, or
   * moved) — the cache is keyed by physical column index, and a structural change would leave
   * the samples associated with the wrong columns.
   */
  #onColumnIndexMapperCacheUpdate = (indexesChangesState: {
    indexesSequenceChanged: boolean, trimmedIndexesChanged: boolean, hiddenIndexesChanged: boolean
  }) => {
    const { indexesSequenceChanged, trimmedIndexesChanged, hiddenIndexesChanged } = indexesChangesState;

    if (indexesSequenceChanged) {
      this.#columnSamplesCache.clear();
      this.#invalidateReMeasureSweep();
    }

    // The demands are keyed by physical column, read the widths of the other spanned columns, and land
    // on the first visible column of the span, so a moved, inserted, removed, hidden, or trimmed column
    // invalidates them. They are fitted again on the next render, after MergeCells has moved its merges.
    if (indexesSequenceChanged || trimmedIndexesChanged || hiddenIndexesChanged) {
      this.#markMergedCellsChanged(indexesSequenceChanged ? 'numbering' : 'refit');
    }
  };

  /**
   * Asks for a fit of the merged cells while MergeCells is enabled. It does not ask whether merges
   * exist, because a change that brings rows or columns back can bring back merges the last fit did
   * not see.
   *
   * @param {'refit' | 'texts' | 'numbering'} [scope='texts'] What may have changed: only which merges
   * are drawn (`refit`), the texts as well (`texts`), or the physical numbering too (`numbering`).
   */
  #markMergedCellsChanged(scope: 'refit' | 'texts' | 'numbering' = 'texts') {
    if (!this.hot.getPlugin('mergeCells')?.enabled) {
      return;
    }

    if (scope === 'numbering') {
      this.#mergedCellsWidths.markRenumbered();
    } else if (scope === 'texts') {
      this.#mergedCellsWidths.markStale();
    } else {
      this.#mergedCellsWidths.markLayoutChanged();
    }
  }

  /**
   * Asks for a fit when a width map of the column axis changed (a manual size through a drag, the API,
   * or the settings, the stretched widths, or this plugin's own widths), since a merge's demand reads
   * the widths of the columns it spans. The fit itself reuses the measured texts.
   */
  #onColumnIndexMapChange = () => {
    if (this.#mergedCellsWidths.mayHaveMultiColumnMerges()) {
      this.#mergedCellsWidths.markWidthsChanged();
    }
  };

  /**
   * Fits every merged cell again after `updateData()` replaced the data, which keeps the merges
   * but may change their text.
   */
  #onAfterUpdateData = () => {
    this.#markMergedCellsChanged('numbering');
  };

  /**
   * Takes a snapshot of the merges right before an undo or a redo, which can restore merges through
   * MergeCells' state with no merge hook. The undo renders before its `after*` hook fires, so the
   * snapshot is taken before it, and the fit of that render reports and rescans what changed.
   */
  #onBeforeUndoRedo = () => {
    if (this.hot.getPlugin('mergeCells')?.enabled) {
      this.#mergedCellsWidths.snapshotMerges();
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

      const visualRow = Number.isInteger(physicalRow) ? this.hot.toVisualRow(physicalRow) : null;

      if (visualRow !== null && this.#invalidateMergedCellText(visualRow, visualColumn)) {
        return;
      }

      const entry = this.#columnWidthsToRefresh.get(visualColumn);

      // The column is already queued for a full rescan.
      if (entry === null) {
        return;
      }

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
    this.hot?.columnIndexMapper.removeLocalHook('change', this.#onColumnIndexMapChange);
    this.#cancelSweep();
    this.ghostTable.clean();
    super.destroy();
  }
}
