import { BasePlugin } from '../base';
import Storage from './storage';
import { Hooks } from '../../core/hooks';
import { deprecatedWarn } from '../../helpers/console';

Hooks.getSingleton().register('persistentStateSave');
Hooks.getSingleton().register('persistentStateLoad');
Hooks.getSingleton().register('persistentStateReset');

export const PLUGIN_KEY = 'persistentState';
export const PLUGIN_PRIORITY = 0;

const deprecationWarningInstances = new WeakSet();

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin PersistentState
 * @class PersistentState
 *
 * @description
 *
 * ::: warning
 * The PersistentState plugin is deprecated and will be removed in version 17.0. Please update your settings to ensure compatibility with future versions.
 * :::
 *
 * Save the state of column sorting, column positions and column sizes in local storage to preserve table state
 * between page reloads.
 *
 * In order to enable data storage mechanism, {@link Options#persistentState} option must be set to `true`.
 *
 * When persistentState is enabled it exposes 3 hooks:
 * - {@link Hooks#persistentStateSave} - Saves value under given key in browser local storage.
 * - {@link Hooks#persistentStateLoad} - Loads value, saved under given key, from browser local storage. The loaded
 * value will be saved in `saveTo.value`.
 * - {@link Hooks#persistentStateReset} - Clears the value saved under key. If no key is given, all values associated
 * with table will be cleared.
 *
 * __Note:__ The main reason behind using `persistentState` hooks rather than regular LocalStorage API is that it
 * ensures separation of data stored by multiple Handsontable instances. In other words, if you have two (or more)
 * instances of Handsontable on one page, data saved by one instance won't be accessible by the second instance.
 * Those two instances can store data under the same key and no data would be overwritten.
 *
 * __Important:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.
 *
 */
export class PersistentState extends BasePlugin {
  /**
   * Returns the plugin key used to identify and access this plugin within Handsontable.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority value that determines the plugin's initialization order relative to other plugins.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Instance of {@link Storage}.
   *
   * @private
   * @type {Storage}
   */
  declare storage: Record<string, Function> | undefined;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link PersistentState#enablePlugin} method is called.
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

    if (!deprecationWarningInstances.has(this.hot)) {
      deprecationWarningInstances.add(this.hot);

      deprecatedWarn('The PersistentState plugin is deprecated and will be removed in version 17.0. ' +
        'Please update your settings to ensure compatibility with future versions.');
    }

    if (!this.storage) {
      const hotWithContainer = this.hot as unknown as { rootContainer: HTMLElement };
      const rootId = hotWithContainer.rootContainer?.id || this.hot.rootElement.id;

      this.storage = new Storage(rootId, this.hot.rootWindow) as unknown as Record<string, Function>;
    }

    this.addHook('persistentStateSave', (key: string, value: unknown) => this.saveValue(key, value));
    this.addHook('persistentStateLoad', (key: string, saveTo: { value: unknown }) => this.loadValue(key, saveTo));
    this.addHook('persistentStateReset', () => this.resetValue());

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.storage = undefined;

    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`persistentState`](@/api/options.md#persistentstate)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Loads the value from local storage.
   *
   * @param {string} key Storage key.
   * @param {object} saveTo Saved value from local storage.
   */
  loadValue(key: string, saveTo: { value: unknown }): void {
    saveTo.value = this.storage!.loadValue(key);
  }

  /**
   * Saves the data to local storage.
   *
   * @param {string} key Storage key.
   * @param {Mixed} value Value to save.
   */
  saveValue(key: string, value: unknown): void {
    this.storage!.saveValue(key, value);
  }

  /**
   * Resets the data or all data from local storage.
   *
   * @param {string} key [optional] Storage key.
   */
  resetValue(key?: string): void {
    if (typeof key === 'undefined') {
      this.storage!.resetAll();

    } else {
      this.storage!.reset(key);
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
