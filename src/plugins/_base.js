import { defineGetter, objectEach } from './../helpers/object';
import { arrayEach } from './../helpers/array';
import { getTranslator } from './../utils/recordTranslator';
import { getRegistredPluginNames, getPluginName } from './../plugins';

const privatePool = new WeakMap();
let initializedPlugins = null;

/**
 * @util
 */
class BasePlugin {
  /**
   * @param {Object} hotInstance Handsontable instance.
   */
  constructor(hotInstance) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    defineGetter(this, 'hot', hotInstance, {
      writable: false
    });
    defineGetter(this, 't', getTranslator(hotInstance), {
      writable: false
    });

    privatePool.set(this, { hooks: {} });
    initializedPlugins = null;

    this.pluginName = null;
    this.pluginsInitializedCallbacks = [];
    this.isPluginsReady = false;
    this.enabled = false;
    this.initialized = false;

    this.hot.addHook('afterPluginsInitialized', () => this.onAfterPluginsInitialized());
    this.hot.addHook('afterUpdateSettings', newSettings => this.onUpdateSettings(newSettings));
    this.hot.addHook('beforeInit', () => this.init());
  }

  init() {
    this.pluginName = getPluginName(this.hot, this);

    if (this.isEnabled && this.isEnabled()) {
      this.enablePlugin();
    }
    if (!initializedPlugins) {
      initializedPlugins = getRegistredPluginNames(this.hot);
    }
    if (initializedPlugins.indexOf(this.pluginName) >= 0) {
      initializedPlugins.splice(initializedPlugins.indexOf(this.pluginName), 1);
    }
    if (!initializedPlugins.length) {
      this.hot.runHooks('afterPluginsInitialized');
    }
    this.initialized = true;
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
    privatePool.get(this).hooks[name] = (privatePool.get(this).hooks[name] || []);

    const hooks = privatePool.get(this).hooks[name];

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
   * Register function which will be immediately called after all plugins initialized.
   *
   * @param {Function} callback
   */
  callOnPluginsReady(callback) {
    if (this.isPluginsReady) {
      callback();
    } else {
      this.pluginsInitializedCallbacks.push(callback);
    }
  }

  /**
   * On after plugins initialized listener.
   *
   * @private
   */
  onAfterPluginsInitialized() {
    arrayEach(this.pluginsInitializedCallbacks, callback => callback());
    this.pluginsInitializedCallbacks.length = 0;
    this.isPluginsReady = true;
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
      if (this.enabled && this.isEnabled()) {
        this.updatePlugin();
      }
    }
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   *
   * @private
   */
  updatePlugin() {

  }

  /**
   * Destroy plugin.
   */
  destroy() {
    if (this.eventManager) {
      this.eventManager.destroy();
    }
    this.clearHooks();

    objectEach(this, (value, property) => {
      if (property !== 'hot' && property !== 't') {
        this[property] = null;
      }
    });
    delete this.t;
    delete this.hot;
  }
}

export default BasePlugin;
