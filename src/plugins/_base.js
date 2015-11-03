import {defineGetter, objectEach} from './../helpers/object';
import {arrayEach} from './../helpers/array';
import {getRegistredPluginNames} from './../plugins';

const privatePool = new WeakMap();
let initializedPlugins = null;

/**
 * @private
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
    privatePool.set(this, {hooks: {}});
    initializedPlugins = null;

    if (!this.constructor.name) {
      this.constructor.name = getPluginName(this);
    }
    this.pluginsInitializedCallbacks = [];
    this.isPluginsReady = false;
    this.enabled = false;
    this.initialized = false;

    this.hot.addHook('afterPluginsInitialized', () => this.onAfterPluginsInitialized());
    this.hot.addHook('afterUpdateSettings', () => this.onUpdateSettings());
    this.hot.addHook('beforeInit', () => this.init());
  }

  init() {
    let pluginName = this.constructor.name;

    if (this.isEnabled && this.isEnabled()) {
      this.enablePlugin();
    }
    if (!initializedPlugins) {
      initializedPlugins = getRegistredPluginNames(this.hot);
    }
    if (initializedPlugins.indexOf(pluginName) >= 0) {
      initializedPlugins.splice(initializedPlugins.indexOf(pluginName), 1);
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
    arrayEach(this.pluginsInitializedCallbacks, (callback) => callback());
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
   * Update the plugin's settings
   *
   * @private
   */
  updatePlugin() {

  }

  /**
   * Destroy plugin
   */
  destroy() {
    if (this.eventManager) {
      this.eventManager.destroy();
    }
    this.clearHooks();

    objectEach(this, (value, property) => {
      if (property !== 'hot') {
        this[property] = null;
      }
    });
    delete this.hot;
  }
}

function getPluginName(plugin) {
  let name = plugin.constructor.name;

  if (!name) {
    /*jshint -W020 */
    name = plugin.constructor.toString().match(/^function\s*([^\s(]+)/)[1];
  }

  return name;
}

export default BasePlugin;

Handsontable.plugins.BasePlugin = BasePlugin;
