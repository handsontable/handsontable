import { BasePlugin } from '../base';
import Storage from './storage';
import Hooks from '../../pluginHooks';

Hooks.getSingleton().register('persistentStateSave');
Hooks.getSingleton().register('persistentStateLoad');
Hooks.getSingleton().register('persistentStateReset');

export const PLUGIN_KEY = 'persistentState';
export const PLUGIN_PRIORITY = 0;

/**
 * @plugin PersistentState
 * @class PersistentState
 *
 * @description
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
 */
export class PersistentState extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link Storage}.
     *
     * @private
     * @type {Storage}
     */
    this.storage = void 0;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link PersistentState#enablePlugin} method is called.
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

    if (!this.storage) {
      this.storage = new Storage(this.hot.rootElement.id, this.hot.rootWindow);
    }

    this.addHook('persistentStateSave', (key, value) => this.saveValue(key, value));
    this.addHook('persistentStateLoad', (key, saveTo) => this.loadValue(key, saveTo));
    this.addHook('persistentStateReset', () => this.resetValue());

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.storage = void 0;

    super.disablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
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
  loadValue(key, saveTo) {
    saveTo.value = this.storage.loadValue(key);
  }

  /**
   * Saves the data to local storage.
   *
   * @param {string} key Storage key.
   * @param {Mixed} value Value to save.
   */
  saveValue(key, value) {
    this.storage.saveValue(key, value);
  }

  /**
   * Resets the data or all data from local storage.
   *
   * @param {string} key [optional] Storage key.
   */
  resetValue(key) {
    if (typeof key === 'undefined') {
      this.storage.resetAll();

    } else {
      this.storage.reset(key);
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
