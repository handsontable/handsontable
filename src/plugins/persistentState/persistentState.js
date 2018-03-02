import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
import Storage from './storage';
import Hooks from './../../pluginHooks';

Hooks.getSingleton().register('persistentStateSave');
Hooks.getSingleton().register('persistentStateLoad');
Hooks.getSingleton().register('persistentStateReset');

/**
 * Save the state of column sorting, column positions and column sizes in local storage
 * to preserve table state between page reloads.
 *
 * In order to enable data storage mechanism, persistentState option must be set to true.
 *
 * When persistentState is enabled it exposes 3 hooks:
 *
 * persistentStateSave (key: String, value: Mixed) -
 * Saves value under given key in browser local storage.
 *
 * persistentStateLoad (key: String, saveTo: Object) -
 * Loads value, saved under given key, form browser local storage.
 * The loaded value will be saved in saveTo.value.
 *
 * persistentStateReset (key: String) -
 * Clears the value saved under key.
 * If no key is given, all values associated with table will be cleared.
 *
 * @plugin persistentState
 */
class PersistentState extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link Storage}.
     *
     * @type {Storage}
     */
    this.storage = void 0;
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().persistentState;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    if (!this.storage) {
      this.storage = new Storage(this.hot.rootElement.id);
    }

    this.addHook('persistentStateSave', (key, value) => this.saveValue(key, value));
    this.addHook('persistentStateLoad', (key, saveTo) => this.loadValue(key, saveTo));
    this.addHook('persistentStateReset', () => this.resetValue());

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.storage = void 0;

    super.disablePlugin();
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Load value from localStorage.
   *
   * @param {String} key Key string.
   * @param {Object} saveTo Saved value from browser local storage.
   */
  loadValue(key, saveTo) {
    saveTo.value = this.storage.loadValue(key);
  }

  /**
   * Save data to localStorage.
   *
   * @param {String} key Key string.
   * @param {Mixed} value Value to save.
   */
  saveValue(key, value) {
    this.storage.saveValue(key, value);
  }

  /**
   * Reset given data or all data from localStorage.
   *
   * @param {String} key [optional] Key string.
   */
  resetValue(key) {
    if (typeof key === 'undefined') {
      this.storage.resetAll();

    } else {
      this.storage.reset(key);
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

registerPlugin('persistentState', PersistentState);

export default PersistentState;
