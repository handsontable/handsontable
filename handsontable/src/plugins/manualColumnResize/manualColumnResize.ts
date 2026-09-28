import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { deprecatedWarnOnce } from '../../helpers/console';
import type { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { COLUMN_RESIZE_AXIS } from '../../utils/manualResize/axis';
import { ResizeGesture } from '../../utils/manualResize/resizeGesture';
import {
  COLUMN_SIZE_OPTIONS,
  redeclaresManualSizes,
} from '../../utils/manualResize/utils';

export const PLUGIN_KEY = 'manualColumnResize';
export const PLUGIN_PRIORITY = 130;

/**
 * @plugin ManualColumnResize
 * @class ManualColumnResize
 *
 * @description
 * This plugin allows to change columns width.
 *
 * The plugin creates additional components to make resizing possibly using user interface:
 * - handle - the draggable element that sets the desired width of the column.
 * - guide - the helper guide that shows the desired width as a vertical guide.
 */
export class ManualColumnResize extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the setting keys that trigger a plugin update after an `updateSettings()` call. The
   * `colWidths` option is listed alongside the plugin's own key, so that re-declaring the column
   * widths discards the widths kept from earlier manual resizing.
   *
   * @returns {string[]}
   */
  static get SETTING_KEYS(): string[] {
    return [PLUGIN_KEY, ...COLUMN_SIZE_OPTIONS];
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * The resize handle, the guide, and the drag and double-click state behind them. Shared with
   * `ManualRowResize` - see `../../utils/manualResize/AGENTS.md`.
   */
  #gesture: ResizeGesture;
  /**
   * PhysicalIndexToValueMap to keep and track widths for physical column indexes.
   *
   * @type {PhysicalIndexToValueMap}
   */
  #columnWidthsMap!: IndexToValueMap;
  /**
   * Disposer function for the column widths map observer. Called on disable to clean up.
   *
   * @type {Function|null}
   */
  #disposeMapObserver: (() => void) | null = null;
  /**
   * Private pool to save configuration from updateSettings.
   *
   * @type {object}
   */
  #config!: unknown[];

  /**
   * Initializes the plugin and creates the resize gesture.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);

    this.#gesture = new ResizeGesture(this.hot, COLUMN_RESIZE_AXIS, {
      isActive: () => this.enabled,
      setManualSize: (column, width) => this.setManualSize(column, width),
    });
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualColumnResize#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#columnWidthsMap = this.hot.columnIndexMapper.createAndRegisterIndexMap(
      this.pluginName!, 'physicalIndexToValue', null, { skipUnchangedWrites: true },
    );
    this.#columnWidthsMap.addLocalHook('init', () => this.#onMapInit());

    // `createAndRegisterIndexMap` initializes the map synchronously when the dataset is already
    // loaded (a plugin re-enable), before the hook above could attach - replay the init handler.
    if (this.hot.columnIndexMapper.getNumberOfIndexes() > 0) {
      this.#onMapInit();
    }

    this.#disposeMapObserver = this.hot.columnIndexMapper
      .observeMapChange(this.#columnWidthsMap, () => {
        this.hot.view?.invalidateColumnWidthCache();
      });

    this.addHook('modifyColWidth', this.#onModifyColWidth, 1);
    this.addHook('beforeStretchingColumnWidth', this.#onBeforeStretchingColumnWidth, 1);
    this.addHook('beforeColumnResize', this.#onBeforeColumnResize);

    this.#gesture.bindEvents(this.eventManager);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`manualColumnResize`](@/api/options.md#manualcolumnresize)
   *  - [`colWidths`](@/api/options.md#colwidths)
   *
   * Passing `colWidths` re-declares the column widths, so the widths kept from earlier manual
   * resizing are discarded. A grid whose `manualColumnResize` option is an array keeps that array
   * instead, whether the array arrives in this call or was set when the grid was built.
   *
   * @param {object} [newSettings] The config object passed to `updateSettings()`.
   */
  updatePlugin(newSettings?: Record<string, unknown>) {
    // Re-initialize only when the plugin's own option was declared. `#onMapInit` replays the
    // declared `manualColumnResize` array, so re-initializing on a `colWidths`-only update would
    // revert a column the user had since dragged to the array's width - neither the dragged width
    // nor the one being requested.
    if (newSettings === undefined || newSettings[PLUGIN_KEY] !== undefined) {
      this.disablePlugin();
      this.enablePlugin();

    } else {
      // `BasePlugin#onUpdateSettings` feeds `updatePluginSettings()` with `newSettings[PLUGIN_KEY]`,
      // which a `colWidths`-only update does not carry. Restore the option from the merged settings
      // so `getSetting()` keeps reporting it.
      this.updatePluginSettings(this.hot.getSettings()[PLUGIN_KEY]);
    }

    // Runs after the re-initialization, so that the widths replayed on the map's `init` hook are
    // discarded too.
    if (redeclaresManualSizes(newSettings, COLUMN_SIZE_OPTIONS, this.hot.getSettings()[PLUGIN_KEY])) {
      this.clearManualSizes();
    }

    super.updatePlugin(newSettings);
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    // Leaves a drag in flight alone on purpose - see `ResizeGesture#detach()`.
    this.#gesture.detach();

    if (this.#disposeMapObserver) {
      this.#disposeMapObserver();
      this.#disposeMapObserver = null;
    }

    this.#config = this.#columnWidthsMap.getValues();
    this.hot.columnIndexMapper.unregisterMap(this.pluginName!);
    super.disablePlugin();
  }

  /**
   * Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.
   *
   * @deprecated Since 18.0.0. The `PersistentState` plugin was removed in 17.0.0, so this method
   * does nothing. It will be removed in 19.0.0. Persist column widths yourself with
   * the `afterColumnResize` hook and the `manualColumnResize` option.
   */
  saveManualColumnWidths(): void {
    deprecatedWarnOnce('ManualColumnResize.saveManualColumnWidths',
      '`saveManualColumnWidths()` is deprecated and will be removed in Handsontable 19.0.0. ' +
      'The PersistentState plugin has been removed.');
  }

  /**
   * Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.
   *
   * @deprecated Since 18.0.0. The `PersistentState` plugin was removed in 17.0.0, so this method
   * returns an empty array. It will be removed in 19.0.0. Restore column widths yourself
   * by passing an array to the `manualColumnResize` option.
   * @returns {Array}
   */
  loadManualColumnWidths(): Array<number | null> {
    deprecatedWarnOnce('ManualColumnResize.loadManualColumnWidths',
      '`loadManualColumnWidths()` is deprecated and will be removed in Handsontable 19.0.0. ' +
      'The PersistentState plugin has been removed.');

    return [];
  }

  /**
   * Sets the new width for the specified visual column index.
   *
   * This method updates the plugin's internal width map. Call `render()` after `setManualSize()` to repaint the grid.
   * Values lower than `20px` are saved as `20px`.
   *
   * @example
   * ```js
   * const resizePlugin = hot.getPlugin('manualColumnResize');
   *
   * resizePlugin.setManualSize(0, 120);
   * hot.render();
   * ```
   *
   * @param {number} column Visual column index.
   * @param {number} width Column width (no less than 20px).
   * @returns {number} Returns new width.
   */
  setManualSize(column: number, width: number): number {
    const newWidth = Math.max(width, 20);
    const physicalColumn = this.hot.toPhysicalColumn(column);

    this.#columnWidthsMap.setValueAtIndex(physicalColumn, newWidth);

    return newWidth;
  }

  /**
   * Returns the width set manually for the specified column, or `null` when the column was never
   * resized by hand and takes its width from elsewhere.
   *
   * @param {number} column Visual column index.
   * @returns {number|null}
   */
  getManualSize(column: number): number | null {
    // The map only exists while the plugin is enabled, and a disabled plugin stores no widths.
    if (!this.enabled) {
      return null;
    }

    const physicalColumn = this.hot.toPhysicalColumn(column);
    const value = physicalColumn === null ? null : this.#columnWidthsMap.getValueAtIndex(physicalColumn);

    return typeof value === 'number' ? value : null;
  }

  /**
   * Returns every width set manually, as `[physicalColumn, width]` pairs. Physical indexes,
   * because the map stores them that way: a manually resized column that trimming has taken out
   * of the visual space still carries its width here, while `getManualSize` cannot reach it.
   *
   * @returns {Array<Array<number>>} The stored `[physicalColumn, width]` pairs.
   */
  getManualSizes(): Array<[number, number]> {
    const sizes: Array<[number, number]> = [];

    if (!this.enabled) {
      return sizes;
    }

    this.#columnWidthsMap.getValues().forEach((value, physicalColumn) => {
      if (typeof value === 'number') {
        sizes.push([physicalColumn, value]);
      }
    });

    return sizes;
  }

  /**
   * Writes a set of manual widths at once, addressed by physical column index — the
   * counterpart of {@link ManualColumnResize#getManualSizes}, so a stored set round-trips onto
   * the same records regardless of trimming or column order. Values lower than `20px` are
   * saved as `20px`, and an index outside the current column count is skipped. Call `render()`
   * afterwards to repaint the grid.
   *
   * @param {Array<Array<number>>} sizes The `[physicalColumn, width]` pairs to write.
   */
  setManualSizes(sizes: Array<[number, number]>): void {
    if (!this.enabled) {
      return;
    }

    const columnCount = this.hot.columnIndexMapper.getNumberOfIndexes();

    this.hot.batchExecution(() => {
      sizes.forEach(([physicalColumn, width]) => {
        if (physicalColumn >= 0 && physicalColumn < columnCount) {
          this.#columnWidthsMap.setValueAtIndex(physicalColumn, Math.max(width, 20));
        }
      });
    }, true);
  }

  /**
   * Clears the width stored for the specified column, so the column falls back to the width coming
   * from the [`colWidths`](@/api/options.md#colwidths) option, or to the built-in default width.
   * Call `render()` afterwards to repaint the grid.
   *
   * @example
   * ```js
   * const resizePlugin = hot.getPlugin('manualColumnResize');
   *
   * resizePlugin.clearManualSize(0);
   * hot.render();
   * ```
   *
   * @param {number} column Visual column index.
   */
  clearManualSize(column: number): void {
    // The map only exists while the plugin is enabled, and a disabled plugin stores no widths.
    if (!this.enabled) {
      return;
    }

    const physicalColumn = this.hot.toPhysicalColumn(column);

    // An out-of-range visual index resolves to `null`, which would write an entry under the string
    // "null" and invalidate the width cache for nothing.
    if (physicalColumn !== null) {
      this.#columnWidthsMap.setValueAtIndex(physicalColumn, null);
    }
  }

  /**
   * Clears the widths stored for every column, so the columns fall back to the widths coming from
   * the [`colWidths`](@/api/options.md#colwidths) option, or to the built-in default width. Call
   * `render()` afterwards to repaint the grid.
   *
   * @example
   * ```js
   * const resizePlugin = hot.getPlugin('manualColumnResize');
   *
   * resizePlugin.clearManualSizes();
   * hot.render();
   * ```
   */
  clearManualSizes(): void {
    this.#config = [];

    // The map only exists while the plugin is enabled, and a disabled plugin stores no widths.
    if (this.enabled) {
      this.#columnWidthsMap.clear();
    }
  }

  /**
   * Auto-size column after doubleclick - callback. Kept on the plugin because the frozen
   * `autoRowSize.spec.js` calls it directly to close a double-click window between simulated clicks.
   *
   * @private
   * @fires Hooks#beforeColumnResize
   * @fires Hooks#afterColumnResize
   */
  afterMouseDownTimeout() {
    this.#gesture.afterMouseDownTimeout();
  }

  /**
   * Callback to call on map's `init` local hook.
   *
   * @private
   */
  #onMapInit() {
    const initialSetting = this.hot.getSettings()[PLUGIN_KEY];

    if (Array.isArray(initialSetting)) {
      this.hot.batchExecution(() => {
        initialSetting.forEach((width, physicalIndex) => {
          this.#columnWidthsMap.setValueAtIndex(physicalIndex, width);
        });
      }, true);

      this.#config = initialSetting;

    } else if (initialSetting === true && Array.isArray(this.#config)) {
      this.hot.batchExecution(() => {
        this.#config.forEach((width: unknown, physicalIndex: number) => {
          this.#columnWidthsMap.setValueAtIndex(physicalIndex, width);
        });
      }, true);
    }
  }

  /**
   * Modifies the provided column width, based on the plugin settings.
   *
   * @param {number} width Column width.
   * @param {number} column Visual column index.
   * @returns {number}
   */
  #onModifyColWidth = (width: number, column: number) => {
    let newWidth = width;

    if (this.enabled) {
      const physicalColumn = this.hot.toPhysicalColumn(column);
      const columnWidth = this.#columnWidthsMap.getValueAtIndex<number>(physicalColumn);

      if (this.hot.getSettings()[PLUGIN_KEY] && columnWidth) {
        newWidth = columnWidth;
      }
    }

    return newWidth;
  };

  /**
   * Modifies the provided column stretched width. This hook decides if specified column should be stretched or not.
   *
   * @param {number} stretchedWidth Stretched width.
   * @param {number} column Visual column index.
   * @returns {number}
   */
  #onBeforeStretchingColumnWidth = (stretchedWidth: number, column: number) => {
    const width = this.#columnWidthsMap.getValueAtIndex(this.hot.toPhysicalColumn(column));

    if (typeof width === 'number') {
      return width;
    }

    return stretchedWidth;
  };

  /**
   * `beforeColumnResize` hook callback.
   */
  #onBeforeColumnResize = () => {
    // clear the header height cache information
    this.hot.view._wt.wtViewport.resetHasOversizedColumnHeadersMarked();
  };

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#gesture.detach();
    super.destroy();
  }
}
