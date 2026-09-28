import type { HotInstance } from '../../core/types';
import { BasePlugin } from '../base';
import { deprecatedWarnOnce } from '../../helpers/console';
import type { PhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import { ROW_RESIZE_AXIS } from '../../utils/manualResize/axis';
import { ResizeGesture } from '../../utils/manualResize/resizeGesture';
import {
  ROW_SIZE_OPTIONS,
  redeclaresManualSizes,
} from '../../utils/manualResize/utils';

export const PLUGIN_KEY = 'manualRowResize';
export const PLUGIN_PRIORITY = 30;

/**
 * @plugin ManualRowResize
 * @class ManualRowResize
 *
 * @description
 * This plugin allows to change rows height.
 *
 * The plugin creates additional components to make resizing possibly using user interface:
 * - handle - the draggable element that sets the desired height of the row.
 * - guide - the helper guide that shows the desired height as a horizontal guide.
 */
export class ManualRowResize extends BasePlugin {
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
   * Returns the setting keys that trigger a plugin update after an `updateSettings()` call. The
   * `rowHeights` option is listed alongside the plugin's own key, so that re-declaring the row
   * heights discards the heights kept from earlier manual resizing.
   *
   * @returns {string[]}
   */
  static get SETTING_KEYS(): string[] {
    return [PLUGIN_KEY, ...ROW_SIZE_OPTIONS];
  }

  /**
   * The resize handle, the guide, and the drag and double-click state behind them. Shared with
   * `ManualColumnResize` - see `../../utils/manualResize/AGENTS.md`.
   */
  #gesture: ResizeGesture;
  /**
   * PhysicalIndexToValueMap to keep and track widths for physical row indexes.
   *
   * @type {PhysicalIndexToValueMap}
   */
  #rowHeightsMap!: IndexToValueMap;
  /**
   * Disposer function for the row heights map observer. Called on disable to clean up.
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

    this.#gesture = new ResizeGesture(this.hot, ROW_RESIZE_AXIS, {
      isActive: () => this.enabled,
      setManualSize: (row, height) => this.setManualSize(row, height),
    });
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualRowResize#enablePlugin} method is called.
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

    this.#rowHeightsMap = this.hot.rowIndexMapper.createAndRegisterIndexMap(
      this.pluginName!, 'physicalIndexToValue', null, { skipUnchangedWrites: true },
    );
    this.#rowHeightsMap.addLocalHook('init', () => this.#onMapInit());

    // `createAndRegisterIndexMap` initializes the map synchronously when the dataset is already
    // loaded (a plugin re-enable), before the hook above could attach - replay the init handler.
    if (this.hot.rowIndexMapper.getNumberOfIndexes() > 0) {
      this.#onMapInit();
    }

    this.#disposeMapObserver = this.hot.rowIndexMapper
      .observeMapChange(this.#rowHeightsMap, () => {
        this.hot.view?.invalidateRowHeightCache();
      });

    this.addHook('modifyRowHeight', this.#onModifyRowHeight);

    this.#gesture.bindEvents(this.eventManager);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`manualRowResize`](@/api/options.md#manualrowresize)
   *  - [`rowHeights`](@/api/options.md#rowheights)
   *
   * Passing `rowHeights` re-declares the row heights, so the heights kept from earlier manual
   * resizing are discarded. A grid whose `manualRowResize` option is an array keeps that array
   * instead, whether the array arrives in this call or was set when the grid was built.
   *
   * @param {object} [newSettings] The config object passed to `updateSettings()`.
   */
  updatePlugin(newSettings?: Record<string, unknown>) {
    // Re-initialize only when the plugin's own option was declared. `#onMapInit` replays the
    // declared `manualRowResize` array, so re-initializing on a `rowHeights`-only update would
    // revert a row the user had since dragged to the array's height - neither the dragged height
    // nor the one being requested.
    if (newSettings === undefined || newSettings[PLUGIN_KEY] !== undefined) {
      this.disablePlugin();
      this.enablePlugin();

    } else {
      // `BasePlugin#onUpdateSettings` feeds `updatePluginSettings()` with `newSettings[PLUGIN_KEY]`,
      // which a `rowHeights`-only update does not carry. Restore the option from the merged settings
      // so `getSetting()` keeps reporting it.
      this.updatePluginSettings(this.hot.getSettings()[PLUGIN_KEY]);
    }

    // Runs after the re-initialization, so that the heights replayed on the map's `init` hook are
    // discarded too.
    if (redeclaresManualSizes(newSettings, ROW_SIZE_OPTIONS, this.hot.getSettings()[PLUGIN_KEY])) {
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

    this.#config = this.#rowHeightsMap.getValues();

    this.hot.rowIndexMapper.unregisterMap(this.pluginName!);
    super.disablePlugin();
  }

  /**
   * Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.
   *
   * @deprecated Since 18.0.0. The `PersistentState` plugin was removed in 17.0.0, so this method
   * does nothing. It will be removed in 19.0.0. Persist row heights yourself with
   * the `afterRowResize` hook and the `manualRowResize` option.
   */
  saveManualRowHeights(): void {
    deprecatedWarnOnce('ManualRowResize.saveManualRowHeights',
      '`saveManualRowHeights()` is deprecated and will be removed in Handsontable 19.0.0. ' +
      'The PersistentState plugin has been removed.');
  }

  /**
   * Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.
   *
   * @deprecated Since 18.0.0. The `PersistentState` plugin was removed in 17.0.0, so this method
   * returns an empty array. It will be removed in 19.0.0. Restore row heights yourself
   * by passing an array to the `manualRowResize` option.
   * @returns {Array}
   */
  loadManualRowHeights(): Array<number | null> {
    deprecatedWarnOnce('ManualRowResize.loadManualRowHeights',
      '`loadManualRowHeights()` is deprecated and will be removed in Handsontable 19.0.0. ' +
      'The PersistentState plugin has been removed.');

    return [];
  }

  /**
   * Sets the new height for the specified visual row index.
   *
   * This method updates the plugin's internal height map. Call `render()` after `setManualSize()` to repaint the grid.
   * Values lower than the theme's default row height are saved as the default row height.
   *
   * @example
   * ```js
   * const resizePlugin = hot.getPlugin('manualRowResize');
   *
   * resizePlugin.setManualSize(0, 40);
   * hot.render();
   * ```
   *
   * @param {number} row Visual row index.
   * @param {number} height Row height (no less than the theme's default row height).
   * @returns {number} Returns new height.
   */
  setManualSize(row: number, height: number): number {
    const physicalRow = this.hot.toPhysicalRow(row);
    const newHeight = Math.max(height, this.hot.stylesHandler.getDefaultRowHeight() ?? 0);

    if (physicalRow !== null) {
      this.#rowHeightsMap.setValueAtIndex(physicalRow, newHeight);
    }

    return newHeight;
  }

  /**
   * Returns the height set manually for the specified row, or `null` when the row was never
   * resized by hand and takes its height from elsewhere.
   *
   * @param {number} row Visual row index.
   * @returns {number|null}
   */
  getManualSize(row: number): number | null {
    // The map only exists while the plugin is enabled, and a disabled plugin stores no heights.
    if (!this.enabled) {
      return null;
    }

    const physicalRow = this.hot.toPhysicalRow(row);
    const value = physicalRow === null ? null : this.#rowHeightsMap.getValueAtIndex(physicalRow);

    return typeof value === 'number' ? value : null;
  }

  /**
   * Returns every height set manually, as `[physicalRow, height]` pairs. Physical indexes,
   * because the map stores them that way: a manually resized row that trimming has taken out
   * of the visual space still carries its height here, while `getManualSize` cannot reach it.
   *
   * @returns {Array<Array<number>>} The stored `[physicalRow, height]` pairs.
   */
  getManualSizes(): Array<[number, number]> {
    const sizes: Array<[number, number]> = [];

    if (!this.enabled) {
      return sizes;
    }

    this.#rowHeightsMap.getValues().forEach((value, physicalRow) => {
      if (typeof value === 'number') {
        sizes.push([physicalRow, value]);
      }
    });

    return sizes;
  }

  /**
   * Writes a set of manual heights at once, addressed by physical row index — the counterpart
   * of {@link ManualRowResize#getManualSizes}, so a stored set round-trips onto the same
   * records regardless of trimming or row order. Values lower than the theme's default row
   * height are saved as that height, and an index outside the current row count is skipped.
   * Call `render()` afterwards to repaint the grid.
   *
   * @param {Array<Array<number>>} sizes The `[physicalRow, height]` pairs to write.
   */
  setManualSizes(sizes: Array<[number, number]>): void {
    if (!this.enabled) {
      return;
    }

    const rowCount = this.hot.rowIndexMapper.getNumberOfIndexes();
    const minHeight = this.hot.stylesHandler.getDefaultRowHeight() || 0;

    this.hot.batchExecution(() => {
      sizes.forEach(([physicalRow, height]) => {
        if (physicalRow >= 0 && physicalRow < rowCount) {
          this.#rowHeightsMap.setValueAtIndex(physicalRow, Math.max(height, minHeight));
        }
      });
    }, true);
  }

  /**
   * Clears the height stored for the specified row, so the row falls back to the height coming from
   * the [`rowHeights`](@/api/options.md#rowheights) option or from the theme. Call `render()`
   * afterwards to repaint the grid.
   *
   * @example
   * ```js
   * const resizePlugin = hot.getPlugin('manualRowResize');
   *
   * resizePlugin.clearManualSize(0);
   * hot.render();
   * ```
   *
   * @param {number} row Visual row index.
   */
  clearManualSize(row: number): void {
    // The map only exists while the plugin is enabled, and a disabled plugin stores no heights.
    if (!this.enabled) {
      return;
    }

    const physicalRow = this.hot.toPhysicalRow(row);

    if (physicalRow !== null) {
      this.#rowHeightsMap.setValueAtIndex(physicalRow, null);
    }
  }

  /**
   * Clears the heights stored for every row, so the rows fall back to the heights coming from the
   * [`rowHeights`](@/api/options.md#rowheights) option or from the theme. Call `render()` afterwards
   * to repaint the grid.
   *
   * @example
   * ```js
   * const resizePlugin = hot.getPlugin('manualRowResize');
   *
   * resizePlugin.clearManualSizes();
   * hot.render();
   * ```
   */
  clearManualSizes(): void {
    this.#config = [];

    // The map only exists while the plugin is enabled, and a disabled plugin stores no heights.
    if (this.enabled) {
      this.#rowHeightsMap.clear();
    }
  }

  /**
   * Returns the last desired row height set manually with the resize handle.
   *
   * @returns {number} The last desired row height.
   */
  getLastDesiredRowHeight(): number {
    return this.#gesture.getCurrentSize() ?? 0;
  }

  /**
   * Auto-size row after doubleclick - callback. Kept on the plugin for parity with
   * `ManualColumnResize#afterMouseDownTimeout()`, which a frozen spec calls directly.
   *
   * @private
   * @fires Hooks#beforeRowResize
   * @fires Hooks#afterRowResize
   */
  afterMouseDownTimeout() {
    this.#gesture.afterMouseDownTimeout();
  }

  /**
   * Modifies the provided row height, based on the plugin settings.
   *
   * @param {number} height Row height.
   * @param {number} row Visual row index.
   * @returns {number}
   */
  #onModifyRowHeight = (height: number, row: number) => {
    let newHeight = height;

    if (this.enabled) {
      const physicalRow = this.hot.toPhysicalRow(row);
      const rowHeight = this.#rowHeightsMap.getValueAtIndex<number>(physicalRow);

      if (this.hot.getSettings()[PLUGIN_KEY] && rowHeight) {
        if (this.hot.getPlugin('autoRowSize')?.isEnabled()) {
          newHeight = Math.max(rowHeight, newHeight ?? 0);

        } else {
          newHeight = rowHeight;
        }
      }
    }

    return newHeight;
  };

  /**
   * Callback to call on map's `init` local hook.
   */
  #onMapInit() {
    const initialSetting = this.hot.getSettings()[PLUGIN_KEY];

    this.hot.batchExecution(() => {
      if (Array.isArray(initialSetting)) {
        initialSetting.forEach((height, index) => {
          this.#rowHeightsMap.setValueAtIndex(index, height);
        });

        this.#config = initialSetting;

      } else if (initialSetting === true && Array.isArray(this.#config)) {
        this.#config.forEach((height, index) => {
          this.#rowHeightsMap.setValueAtIndex(index, height);
        });
      }
    }, true);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#gesture.detach();
    super.destroy();
  }
}
