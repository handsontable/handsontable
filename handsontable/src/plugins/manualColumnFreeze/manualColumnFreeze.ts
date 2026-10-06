import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import freezeColumnItem from './contextMenuItem/freezeColumn';
import unfreezeColumnItem from './contextMenuItem/unfreezeColumn';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import { getEndBandCount, isInEndBand, unfreezeWouldShiftEndBand } from './endBand';

Hooks.getSingleton().register('beforeColumnFreeze');
Hooks.getSingleton().register('afterColumnFreeze');
Hooks.getSingleton().register('beforeColumnUnfreeze');
Hooks.getSingleton().register('afterColumnUnfreeze');

export const PLUGIN_KEY = 'manualColumnFreeze';
export const PLUGIN_PRIORITY = 110;

/**
 * Hook order index that places this plugin's dropdown menu entries after the Filters interface.
 *
 * Callbacks run in registration order, which follows plugin priority, and this plugin (110) is
 * enabled before Filters (250). A positive index defers this one past every callback registered at
 * the default index, so the freeze entries land at the end of the column menu instead of pushing
 * the filter interface down.
 */
const AFTER_FILTERS_ORDER_INDEX = 1;

/**
 * The object form of the {@link Options#manualColumnFreeze} option.
 */
export interface ManualColumnFreezeSettings {
  /**
   * When `true`, an unfrozen column goes back among the scrollable columns in data order, before the first
   * column whose source data index is higher than its own. When `false` (default), it stays at the freeze line.
   */
  restoreColumnPosition?: boolean;
}

/**
 * @plugin ManualColumnFreeze
 * @class ManualColumnFreeze
 *
 * @description
 * This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu,
 * an entry in the Dropdown Menu, or using API.
 * You can turn it on by setting a {@link Options#manualColumnFreeze} property to `true`.
 *
 * Freezing is positional, as with the {@link Options#fixedColumnsStart} option: the first `fixedColumnsStart`
 * columns are frozen, whichever columns they are. Moving a column in front of a frozen column freezes it, and
 * moving a frozen column out of the frozen area unfreezes it, while the number of frozen columns stays the same.
 *
 * @example
 * ```js
 * // Enables the plugin
 * manualColumnFreeze: true,
 *
 * // Enables the plugin, and moves an unfrozen column back to its position in data order
 * manualColumnFreeze: {
 *   restoreColumnPosition: true,
 * },
 * ```
 */
export class ManualColumnFreeze extends BasePlugin {
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
   * Returns the default settings of the plugin, used when `manualColumnFreeze` is set to `true`.
   */
  static get DEFAULT_SETTINGS() {
    return {
      restoreColumnPosition: false,
    };
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ManualColumnFreeze#enablePlugin} method is called.
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

    this.addHook('afterContextMenuDefaultOptions', this.#onAfterMenuDefaultOptions);
    // The dropdown menu builds its items from a separate hook, so the entries have to be added
    // twice. Without this the `freeze_column` / `unfreeze_column` keys resolve to inert
    // placeholder rows there. See issue #5429.
    //
    // `AFTER_FILTERS_ORDER_INDEX` runs this after the callbacks registered at the default index,
    // which keeps the entries below the Filters interface (`filters.ts` registers this hook at the
    // default index and makes up the bulk of the column menu).
    this.addHook('afterDropdownMenuDefaultOptions', this.#onAfterMenuDefaultOptions, AFTER_FILTERS_ORDER_INDEX);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Freezes the specified column (adds it to fixed columns).
   *
   * `freezeColumn()` doesn't re-render the table,
   * so you need to call the `render()` method afterward.
   *
   * @param {number} column Visual column index.
   */
  freezeColumn(column: number): void {
    this.runOperation('freeze_column', () => this.#freezeColumn(column));
  }

  /**
   * The body of `freezeColumn()`, run inside its operation.
   *
   * @param {number} column Visual column index.
   */
  #freezeColumn(column: number): void {
    const settings = this.hot.getSettings();
    // columns are already fixed (frozen), or the column belongs to the `fixedColumnsEnd` band: moving it to
    // the freeze line would pull the column in front of the band into it
    const freezePerformed = (settings.fixedColumnsStart ?? 0) < this.hot.countCols()
      && column > (settings.fixedColumnsStart ?? 0) - 1
      && !isInEndBand(this.hot, column);

    const beforeColumnFreezeHook = this.hot.runHooks('beforeColumnFreeze', column, freezePerformed);

    if (beforeColumnFreezeHook === false) {
      return;
    }

    if (freezePerformed) {
      this.hot.columnIndexMapper.moveIndexes(column, settings.fixedColumnsStart ?? 0);

      // Since 12.0.0, the "fixedColumnsLeft" is replaced with the "fixedColumnsStart" option.
      // However, keeping the old name still in effect. When both option names are used together,
      // the error is thrown. To prevent that, the plugin needs to modify the original option key
      // to bypass the validation.
      (settings as { _fixedColumnsStart: number })._fixedColumnsStart += 1;
    }

    this.hot.runHooks('afterColumnFreeze', column, freezePerformed);
  }

  /**
   * Unfreezes the given column (removes it from fixed columns). The column is placed right after the frozen
   * columns, or, with the `restoreColumnPosition` setting, back among the scrollable columns in data order.
   *
   * @param {number} column Visual column index.
   */
  unfreezeColumn(column: number): void {
    this.runOperation('unfreeze_column', () => this.#unfreezeColumn(column));
  }

  /**
   * The body of `unfreezeColumn()`, run inside its operation.
   *
   * @param {number} column Visual column index.
   */
  #unfreezeColumn(column: number): void {
    const settings = this.hot.getSettings();
    // columns are not fixed (not frozen)
    const fixedStart = settings.fixedColumnsStart ?? 0;
    // Unfreezing is also refused when it would hand a column back to the `fixedColumnsEnd` band (the
    // start/end clamp was cutting the band down), as the unfrozen column would slide into it.
    const unfreezePerformed = fixedStart > 0 && (column <= fixedStart - 1) && !unfreezeWouldShiftEndBand(this.hot);

    const beforeColumnUnfreezeHook = this.hot.runHooks('beforeColumnUnfreeze', column, unfreezePerformed);

    if (beforeColumnUnfreezeHook === false) {
      return;
    }

    if (unfreezePerformed) {
      // Since 12.0.0, the "fixedColumnsLeft" is replaced with the "fixedColumnsStart" option.
      // However, keeping the old name still in effect. When both option names are used together,
      // the error is thrown. To prevent that, the plugin needs to modify the original option key
      // to bypass the validation.
      (settings as { _fixedColumnsStart: number })._fixedColumnsStart -= 1;

      const finalIndex = this.getSetting('restoreColumnPosition') === true ?
        this.#getRestoredIndex(column) : settings.fixedColumnsStart ?? 0;

      this.hot.columnIndexMapper.moveIndexes(column, finalIndex);
    }

    this.hot.runHooks('afterColumnUnfreeze', column, unfreezePerformed);
  }

  /**
   * Finds where an unfrozen column goes back to with the `restoreColumnPosition` setting. It is the visual index
   * of the first scrollable column whose physical index is higher than the column's own, so the column lands
   * before it. When there is none, the column becomes the last scrollable column. The frozen end band
   * (`fixedColumnsEnd`) is never entered.
   *
   * Nothing is remembered between freezing and unfreezing: the data order is the default position, so the
   * result does not depend on what happened to the grid while the column was frozen.
   *
   * @param {number} column Visual index of the column being unfrozen. `fixedColumnsStart` is already lowered.
   * @returns {number} The final visual index for `moveIndexes()`.
   */
  #getRestoredIndex(column: number): number {
    const columnIndexMapper = this.hot.columnIndexMapper;
    const fixedColumnsStart = this.hot.getSettings().fixedColumnsStart ?? 0;
    const endBandStart = this.hot.countCols() - getEndBandCount(this.hot, fixedColumnsStart);
    const physicalColumn = columnIndexMapper.getPhysicalFromVisualIndex(column) ?? -1;
    // The setting is already lowered, but the column has not moved yet, so the other frozen columns still
    // reach up to the old freeze line. The scrollable columns start right after it.
    const firstScrollableColumn = fixedColumnsStart + 1;

    for (let visualColumn = firstScrollableColumn; visualColumn < endBandStart; visualColumn++) {
      const physicalNeighbor = columnIndexMapper.getPhysicalFromVisualIndex(visualColumn) ?? -1;

      if (physicalNeighbor > physicalColumn) {
        // The column is taken out from before the neighbor, which then shifts back by one.
        return visualColumn - 1;
      }
    }

    return endBandStart - 1;
  }

  /**
   * Collects this plugin's entries for a menu that is building its default options. Registered on
   * both the context menu and the dropdown menu hooks.
   *
   * @private
   * @param {object} options Menu options.
   */
  #onAfterMenuDefaultOptions = (options: unknown) => {
    this.#addMenuEntries(options as Record<string, unknown>);
  };

  /**
   * Adds the manualColumnFreeze entries to a menu. Shared by the context menu and the dropdown menu.
   *
   * @private
   * @param {object} options Menu options.
   */
  #addMenuEntries(options: Record<string, unknown>) {
    (options.items as unknown[]).push(
      { name: SEPARATOR },
      freezeColumnItem(this),
      unfreezeColumnItem(this)
    );
  }
}
