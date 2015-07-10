
import {defineGetter, objectEach, arrayEach} from './../helpers.js';

const privatePool = new WeakMap();

/**
 * @private
 */
class BasePlugin {
  /**
   * @param {Object} hotInstance Handsontable instance.
   */
  constructor(hotInstance) {
    /**
     * @type {Core} hot Handsontable instance.
     */
    defineGetter(this, 'hot', hotInstance, {
      writable: false
    });
    privatePool.set(this, {hooks: {}});
    this.enabled = false;

    this.hot.addHook('afterUpdateSettings', () => this.onUpdateSettings());
    this.hot.addHook('beforeInit', () => this.init());
  }

  init() {
    if (this.isEnabled) {
      this[(this.isEnabled() ? 'enable' : 'disable') + 'Plugin']();
      this.enabled = this.isEnabled();
    }
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    this.enabled = true;
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    if (this.eventManager) {
      this.eventManager.clear();
    }
    this.clearHooks();
    this.enabled = false;
  }

  /**
   * Add listener to plugin hooks system.
   *
   * @param {String} name
   * @param {Function} callback
   */
  addHook(name, callback) {
    const hooks = privatePool.get(this).hooks[name] = (privatePool.get(this).hooks[name] || []);

    this.hot.addHook(name, callback);
    hooks.push(callback);
    privatePool.get(this).hooks[name] = hooks;
  }

  /**
   * Remove all hooks listeners by hook name.
   *
   * @param {String} name
   */
  removeHooks(name) {
    arrayEach(privatePool.get(this).hooks[name] || [], (callback) => {
      this.hot.removeHook(name, callback);
    });
  }

  /**
   * Clear all hooks.
   */
  clearHooks() {
    const hooks = privatePool.get(this).hooks;

    objectEach(hooks, (callbacks, name) => this.removeHooks(name));
    hooks.length = 0;
  }

  /**
   * On update settings listener.
   *
   * @private
   */
  onUpdateSettings() {
    if (this.isEnabled) {
      if (this.enabled && !this.isEnabled()) {
        this.disablePlugin();
      }
      if (!this.enabled && this.isEnabled()) {
        this.enablePlugin();
      }
    }
  }

  /**
   * Destroy plugin
   */
  destroy() {
    if (this.eventManager) {
      this.eventManager.clear();
    }
    this.clearHooks();
    delete this.hot;
  }
}

export default BasePlugin;
