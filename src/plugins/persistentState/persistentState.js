import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';
import Storage from './storage';

/**
 *  Save the state of column sorting, column positions and column sizes in local storage.
 *
 *
 * @plugin persistentState
 */
class PersistentState extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    this.hot.addHook('beforeInit', () => this.onBeforeInit());
    this.hot.addHook('afterUpdateSettings', () => this.onBeforeInit());
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

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    if (this.storage) {
      this.storage = null;
      this.storage.savedKeys.length = 0;
    }

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
   * Save data to localStorage
   *
   * @param {String} key Key string.
   * @param {Mixed} value Value to save.
   */
  saveValue(key, value) {
    this.storage.saveValue(key, value);
  }

  /**
   * Load value from localStorage
   *
   * @param {String} key Key string.
   * @param {} saveTo
   */
  loadValue(key, saveTo) {
    saveTo.value = this.storage.loadValue(key);
  }

  /**
   * Reset given data or all data from localStorage.
   *
   * @param {String} key Key string.
   */
  resetValue(key) {
    if (typeof key === 'undefined') {
      this.storage.resetAll();

    } else {
      this.storage.reset(key);
    }
  }

  /**
   * `afterInit` hook.
   *
   * @private
   */
  onAfterInit() {
    this.hot.storage.loadSavedKeys();
  }

  /**
   * `beforeInit` hook.
   *
   * @private
   */
  onBeforeInit() {
    let pluginSettings = this.hot.getSettings().persistentState;

    if (!pluginSettings) {
      this.hot.removeHook('persistentStateLoad', this.loadValue);
      this.hot.removeHook('persistentStateSave', this.saveValue);
      this.hot.removeHook('persistentStateReset', this.resetValue);

      return;
    }

    if (!this.hot.storage) {
      this.hot.storage = new Storage(this.hot.rootElement.id);
    }

    this.hot.resetState = this.resetValue;

    this.addHook('persistentStateLoad', this.loadValue);
    this.addHook('persistentStateSave', this.saveValue);
    this.addHook('persistentStateReset', this.resetValue);
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
