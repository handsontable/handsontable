import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import freezeColumnItem from './contextMenuItem/freezeColumn';
import unfreezeColumnItem from './contextMenuItem/unfreezeColumn';

Hooks.getSingleton().register('beforeColumnFreeze');
Hooks.getSingleton().register('afterColumnFreeze');
Hooks.getSingleton().register('beforeColumnUnfreeze');
Hooks.getSingleton().register('afterColumnUnfreeze');

export const PLUGIN_KEY = 'manualColumnFreeze';
export const PLUGIN_PRIORITY = 110;

/**
 * @plugin ManualColumnFreeze
 * @class ManualColumnFreeze
 *
 * @description
 * This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu,
 * an entry in the Dropdown Menu, or using API.
 * You can turn it on by setting a {@link Options#manualColumnFreeze} property to `true`.
 *
 * @example
 * ```js
 * // Enables the plugin
 * manualColumnFreeze: true,
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
   * Determines when the moving operation is allowed.
   *
   * @type {boolean}
   */
  #afterFirstUse = false;

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
    // The order index runs this after the callbacks registered at the default index, which keeps
    // the entries below the Filters interface — Filters makes up the bulk of the column menu.
    this.addHook('afterDropdownMenuDefaultOptions', this.#onAfterMenuDefaultOptions, 1);
    this.addHook('beforeColumnMove', this.#onBeforeColumnMove);

    super.enablePlugin();

    this.#refreshDropdownMenu();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#afterFirstUse = false;

    super.disablePlugin();

    this.#refreshDropdownMenu();
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
    const settings = this.hot.getSettings();
    // columns are already fixed (frozen)
    const freezePerformed = (settings.fixedColumnsStart ?? 0) < this.hot.countCols()
      && column > (settings.fixedColumnsStart ?? 0) - 1;

    if (!this.#afterFirstUse) {
      this.#afterFirstUse = true;
    }

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
   * Unfreezes the given column (remove it from fixed columns and bring to it's previous position).
   *
   * @param {number} column Visual column index.
   */
  unfreezeColumn(column: number): void {
    const settings = this.hot.getSettings();
    // columns are not fixed (not frozen)
    const fixedStart = settings.fixedColumnsStart ?? 0;
    const unfreezePerformed = fixedStart > 0 && (column <= fixedStart - 1);

    if (!this.#afterFirstUse) {
      this.#afterFirstUse = true;
    }

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

      this.hot.columnIndexMapper.moveIndexes(column, settings.fixedColumnsStart ?? 0);
    }

    this.hot.runHooks('afterColumnUnfreeze', column, unfreezePerformed);
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
   * Rebuilds the dropdown menu so it picks up, or drops, this plugin's entries.
   *
   * The dropdown menu assembles its item list once, when it is enabled — unlike the context menu,
   * which rebuilds on every open. So toggling `manualColumnFreeze` through `updateSettings` would
   * otherwise leave the menu showing whatever it held at build time: entries that still act after
   * the plugin is off, or no entries after it is switched on. Filters carries the same workaround
   * for the same reason.
   *
   * Does nothing during the initial setup, where the menu is not built yet — the dropdown menu
   * plugin assembles it once every plugin is ready.
   *
   * @private
   */
  #refreshDropdownMenu() {
    const dropdownMenuPlugin = this.hot.getPlugin('dropdownMenu');

    if (!dropdownMenuPlugin?.enabled || !dropdownMenuPlugin.menu) {
      return;
    }

    dropdownMenuPlugin.disablePlugin();
    dropdownMenuPlugin.enablePlugin();
  }

  /**
   * Adds the manualColumnFreeze entries to a menu. Shared by the context menu and the dropdown menu.
   *
   * @private
   * @param {object} options Menu options.
   */
  #addMenuEntries(options: Record<string, unknown>) {
    (options.items as unknown[]).push(
      { name: '---------' },
      freezeColumnItem(this),
      unfreezeColumnItem(this)
    );
  }

  /**
   * Prevents moving the columns from/to fixed area.
   *
   * @private
   * @param {Array} columns Array of visual column indexes to be moved.
   * @param {number} finalIndex Visual column index, being a start index for the moved columns. Points to where the elements will be placed after the moving action.
   * @returns {boolean|undefined}
   */
  #onBeforeColumnMove = (columns: unknown[], finalIndex: number) => {
    if (this.#afterFirstUse) {
      const freezeLine = this.hot.getSettings().fixedColumnsStart ?? 0;

      // Moving any column before the "freeze line" isn't possible.
      if (finalIndex < freezeLine) {
        return false;
      }

      // Moving frozen column isn't possible.
      if (columns.some((column: unknown) => (column as number) < freezeLine)) {
        return false;
      }
    }
  };
}
