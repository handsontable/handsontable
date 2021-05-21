import { defineGetter, objectEach } from '../../helpers/object';
import { arrayEach } from '../../helpers/array';
import { getPluginsNames, hasPlugin } from '../registry';
import { hasCellType } from '../../cellTypes/registry';
import { hasEditor } from '../../editors/registry';
import { hasRenderer } from '../../renderers/registry';
import { hasValidator } from '../../validators/registry';

const DEPS_TYPE_CHECKERS = new Map([
  ['plugin', hasPlugin],
  ['cell-type', hasCellType],
  ['editor', hasEditor],
  ['renderer', hasRenderer],
  ['validator', hasValidator],
]);

export const PLUGIN_KEY = 'base';
const privatePool = new WeakMap();
const missingDependeciesMsgs = [];
let initializedPlugins = null;

/**
 * @util
 */
export class BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * @param {object} hotInstance Handsontable instance.
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
    this.pluginName = this.hot.getPluginName(this);

    const pluginDeps = this.constructor.PLUGIN_DEPS;
    const dependecies = Array.isArray(pluginDeps) ? pluginDeps : [];

    if (dependecies.length > 0) {
      const missingDependencies = [];

      dependecies.forEach((dependency) => {
        const [type, moduleName] = dependency.split(':');

        if (!DEPS_TYPE_CHECKERS.has(type)) {
          throw new Error(`Unknown plugin dependency type "${type}" was found.`);
        }

        if (!DEPS_TYPE_CHECKERS.get(type)(moduleName)) {
          missingDependencies.push(` - ${moduleName} (${type})`);
        }
      });

      if (missingDependencies.length > 0) {
        const errorMsg = [
          `The ${this.pluginName} plugin requires the following modules:\n`,
          `${missingDependencies.join('\n')}\n`,
        ].join('');

        missingDependeciesMsgs.push(errorMsg);
      }
    }

    if (!initializedPlugins) {
      initializedPlugins = getPluginsNames();
    }

    // Workaround for the UndoRedo plugin which, currently doesn't follow the plugin architecture.
    // Without this line the `callOnPluginsReady` callback won't be triggered after all plugin
    // initialization.
    if (initializedPlugins.indexOf('UndoRedo') >= 0) {
      initializedPlugins.splice(initializedPlugins.indexOf('UndoRedo'), 1);
    }

    if (initializedPlugins.indexOf(this.pluginName) >= 0) {
      initializedPlugins.splice(initializedPlugins.indexOf(this.pluginName), 1);
    }

    this.hot.addHookOnce('afterPluginsInitialized', () => {
      if (this.isEnabled && this.isEnabled()) {
        this.enablePlugin();
      }
    });

    const isAllPluginsAreInitialized = initializedPlugins.length === 0;

    if (isAllPluginsAreInitialized) {
      if (missingDependeciesMsgs.length > 0) {
        const errorMsg = [
          `${missingDependeciesMsgs.join('\n')}\n`,
          'You have to import and register them manually.',
        ].join('');

        throw new Error(errorMsg);
      }

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
   * @param {string} name The hook name.
   * @param {Function} callback The listener function to add.
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
   * @param {string} name The hook name.
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
   * @param {Function} callback The listener function to call.
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
   * @param {object} newSettings New set of settings passed to the `updateSettings` method.
   */
  onUpdateSettings(newSettings) {
    if (this.isEnabled) {
      if (this.enabled && !this.isEnabled()) {
        this.disablePlugin();
      }
      if (!this.enabled && this.isEnabled()) {
        this.enablePlugin();
      }
      if (this.enabled && this.isEnabled()) {
        this.updatePlugin(newSettings);
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
      if (property !== 'hot') {
        this[property] = null;
      }
    });
    delete this.t;
    delete this.hot;
  }
}
