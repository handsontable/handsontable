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

    this.storage = new Storage(this.hot.rootElement.id);

    this.addHook('persistentStateLoad', (key, saveTo) => this.loadValue(key, saveTo));
    this.addHook('persistentStateSave', (key, value) => this.saveValue(key, value));
    this.addHook('persistentStateReset', () => this.resetValue());
    this.addHook('afterInit', () => this.onAfterInit());

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.storage.savedKeys.length = 0;
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
   * Load value from localStorage
   *
   * @param {String} key Key string.
   * @param {Object} saveTo localStorage object.
   */
  loadValue(key, saveTo) {
    saveTo.value = this.storage.loadValue(key);
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
    this.storage.loadSavedKeys();
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
