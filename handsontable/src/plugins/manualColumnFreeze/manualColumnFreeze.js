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

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin ManualColumnFreeze
 * @class ManualColumnFreeze
 *
 * @description
 * This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu or using API.
 * You can turn it on by setting a {@link Options#manualColumnFreeze} property to `true`.
 *
 * @example
 * ```js
 * // Enables the plugin
 * manualColumnFreeze: true,
 * ```
 */
export class ManualColumnFreeze extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

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
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.addHook('afterContextMenuDefaultOptions', options => this.#addContextMenuEntry(options));
    this.addHook('beforeColumnMove', (columns, finalIndex) => this.#onBeforeColumnMove(columns, finalIndex));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.#afterFirstUse = false;

    super.disablePlugin();
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
  freezeColumn(column) {
    const settings = this.hot.getSettings();
    // columns are already fixed (frozen)
    const freezePerformed = settings.fixedColumnsStart < this.hot.countCols()
      && column > settings.fixedColumnsStart - 1;

    if (!this.#afterFirstUse) {
      this.#afterFirstUse = true;
    }

    const beforeColumnFreezeHook = this.hot.runHooks('beforeColumnFreeze', column, freezePerformed);

    if (beforeColumnFreezeHook === false) {
      return;
    }

    if (freezePerformed) {
      this.hot.columnIndexMapper.moveIndexes(column, settings.fixedColumnsStart);

      // Since 12.0.0, the "fixedColumnsLeft" is replaced with the "fixedColumnsStart" option.
      // However, keeping the old name still in effect. When both option names are used together,
      // the error is thrown. To prevent that, the plugin needs to modify the original option key
      // to bypass the validation.
      settings._fixedColumnsStart += 1;
    }

    this.hot.runHooks('afterColumnFreeze', column, freezePerformed);
  }

  /**
   * Unfreezes the given column (remove it from fixed columns and bring to it's previous position).
   *
   * @param {number} column Visual column index.
   */
  unfreezeColumn(column) {
    const settings = this.hot.getSettings();
    // columns are not fixed (not frozen)
    const unfreezePerformed = settings.fixedColumnsStart > 0 && (column <= settings.fixedColumnsStart - 1);

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
      settings._fixedColumnsStart -= 1;

      this.hot.columnIndexMapper.moveIndexes(column, settings.fixedColumnsStart);
    }

    this.hot.runHooks('afterColumnUnfreeze', column, unfreezePerformed);
  }

  /**
   * Adds the manualColumnFreeze context menu entries.
   *
   * @private
   * @param {object} options Context menu options.
   */
  #addContextMenuEntry(options) {
    options.items.push(
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
  #onBeforeColumnMove(columns, finalIndex) {
    if (this.#afterFirstUse) {
      const freezeLine = this.hot.getSettings().fixedColumnsStart;

      // Moving any column before the "freeze line" isn't possible.
      if (finalIndex < freezeLine) {
        return false;
      }

      // Moving frozen column isn't possible.
      if (columns.some(column => column < freezeLine)) {
        return false;
      }
    }
  }
}
