import { defineGetter, objectEach, isObject } from '../../helpers/object';
import { arrayEach } from '../../helpers/array';
import { getPluginsNames, hasPlugin } from '../registry';
import { hasCellType } from '../../cellTypes/registry';
import { hasEditor } from '../../editors/registry';
import { hasRenderer } from '../../renderers/registry';
import { hasValidator } from '../../validators/registry';
import EventManager from '../../eventManager';
import { Core, BasePluginInterface } from '../types';

interface TypeCheckerMap extends Map<string, (name: string) => boolean> {}

const DEPS_TYPE_CHECKERS: TypeCheckerMap = new Map([
  ['plugin', hasPlugin],
  ['cell-type', hasCellType],
  ['editor', hasEditor],
  ['renderer', hasRenderer],
  ['validator', hasValidator],
]);

export const defaultMainSettingSymbol = Symbol('mainSetting');
export const PLUGIN_KEY = 'base';
const missingDepsMsgs: string[] = [];
let initializedPlugins: string[] | null = null;

/**
 * @util
 * @property {Core} hot Handsontable instance.
 */
export class BasePlugin implements BasePluginInterface {
  static get PLUGIN_KEY(): string {
    return PLUGIN_KEY;
  }

  /**
   * Plugin dependencies
   */
  static PLUGIN_DEPS?: string[];

  /**
   * The `SETTING_KEYS` getter defines the keys that, when present in the config object, trigger the plugin update
   * after the `updateSettings` calls.
   * - When it returns `true`, the plugin updates after all `updateSettings` calls, regardless of the contents of the
   * config object.
   * - When it returns `false`, the plugin never updates on `updateSettings` calls.
   *
   * @returns {string[] | boolean}
   */
  static get SETTING_KEYS(): string[] | boolean {
    return [
      this.PLUGIN_KEY
    ];
  }

  /**
   * The `DEFAULT_SETTINGS` getter defines the plugin default settings.
   *
   * @returns {object}
   */
  static get DEFAULT_SETTINGS(): Record<string, any> {
    return {};
  }

  /**
   * The instance of the {@link EventManager} class.
   *
   * @type {EventManager}
   */
  eventManager = new EventManager(this as unknown as null);
  /**
   * @type {string}
   */
  pluginName: string | null = null;
  /**
   * @type {Function[]}
   */
  pluginsInitializedCallbacks: Function[] = [];
  /**
   * @type {boolean}
   */
  isPluginsReady: boolean = false;
  /**
   * @type {boolean}
   */
  enabled: boolean = false;
  /**
   * @type {boolean}
   */
  initialized: boolean = false;
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  hot!: Core;
  /**
   * For private API usage only
   */
  t?: any;
  /**
   * Collection of the reference to the plugins hooks.
   */
  #hooks: Record<string, Function[]> = {};

  /**
   * @param {object} hotInstance Handsontable instance.
   */
  constructor(hotInstance: Core) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    defineGetter(this, 'hot', hotInstance, {
      writable: false
    });

    initializedPlugins = null;

    this.hot.addHook('afterPluginsInitialized', () => this.onAfterPluginsInitialized());
    this.hot.addHook('afterUpdateSettings', (newSettings: any) => this.onUpdateSettings(newSettings));
    this.hot.addHook('beforeInit', () => this.init());
  }

  init(): void {
    this.pluginName = this.hot.getPluginName(this);

    const pluginDeps = (this.constructor as typeof BasePlugin).PLUGIN_DEPS;
    const deps = Array.isArray(pluginDeps) ? pluginDeps : [];

    if (deps.length > 0) {
      const missingDependencies: string[] = [];

      deps.forEach((dependency) => {
        const [type, moduleName] = dependency.split(':');

        if (!DEPS_TYPE_CHECKERS.has(type)) {
          throw new Error(`Unknown plugin dependency type "${type}" was found.`);
        }

        if (!DEPS_TYPE_CHECKERS.get(type)!(moduleName)) {
          missingDependencies.push(` - ${moduleName} (${type})`);
        }
      });

      if (missingDependencies.length > 0) {
        const errorMsg = [
          `The ${this.pluginName} plugin requires the following modules:\n`,
          `${missingDependencies.join('\n')}\n`,
        ].join('');

        missingDepsMsgs.push(errorMsg);
      }
    }

    if (!initializedPlugins) {
      initializedPlugins = getPluginsNames();
    }

    if (initializedPlugins && this.pluginName) {
      const index = initializedPlugins.indexOf(this.pluginName);
      if (index >= 0) {
        initializedPlugins.splice(index, 1);
      }
    }

    this.hot.addHookOnce('afterPluginsInitialized', () => {
      if (this.isEnabled && this.isEnabled()) {
        this.enablePlugin();
      }
    });

    const isAllPluginsAreInitialized = initializedPlugins && initializedPlugins.length === 0;

    if (isAllPluginsAreInitialized) {
      if (missingDepsMsgs.length > 0) {
        const errorMsg = [
          `${missingDepsMsgs.join('\n')}\n`,
          'You have to import and register them manually.',
        ].join('');

        missingDepsMsgs.length = 0;

        throw new Error(errorMsg);
      }

      this.hot.runHooks('afterPluginsInitialized');
    }

    this.initialized = true;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin(): void {
    this.enabled = true;
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin(): void {
    this.eventManager?.clear();
    this.clearHooks();
    this.enabled = false;
  }

  /**
   * Gets the plugin settings. If there is no setting under the provided key, it returns the default setting
   * provided by the DEFAULT_SETTINGS static property of the class.
   *
   * @param {string} [settingName] The setting name. If the setting name is not provided, it returns
   * the whole plugin's settings object.
   * @returns {*}
   */
  getSetting(settingName?: string): any {
    const pluginSettings = this.hot.getSettings()[(this.constructor as typeof BasePlugin).PLUGIN_KEY];

    if (settingName === undefined) {
      return pluginSettings;
    }

    const defaultSettings = (this.constructor as typeof BasePlugin).DEFAULT_SETTINGS;
    const mainSettingKey = defaultMainSettingSymbol as unknown as string;

    if (
      (Array.isArray(pluginSettings) || isObject(pluginSettings)) &&
      defaultSettings[mainSettingKey] === settingName
    ) {
      if (Array.isArray(pluginSettings)) {
        return pluginSettings;
      }

      return pluginSettings[settingName] ?? defaultSettings[settingName];
    }

    if (isObject(pluginSettings)) {
      return pluginSettings[settingName] ?? defaultSettings[settingName];
    }

    return defaultSettings[settingName];
  }

  /**
   * Add listener to plugin hooks system.
   *
   * @param {string} name The hook name.
   * @param {Function} callback The listener function to add.
   * @param {number} [orderIndex] Order index of the callback.
   *                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.
   *                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.
   *                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes.
   */
  addHook(name: string, callback: Function, orderIndex?: number): void {
    this.#hooks[name] = (this.#hooks[name] || []);

    const hooks = this.#hooks[name];

    this.hot.addHook(name, callback, orderIndex);
    hooks.push(callback);
    this.#hooks[name] = hooks;
  }

  /**
   * Remove all hooks listeners by hook name.
   *
   * @param {string} name The hook name.
   */
  removeHooks(name: string): void {
    arrayEach(this.#hooks[name] || [], (callback) => {
      this.hot.removeHook(name, callback);
    });
  }

  /**
   * Clear all hooks.
   */
  clearHooks(): void {
    const hooks = this.#hooks;

    objectEach(hooks, (callbacks, name) => this.removeHooks(name));
    (hooks as any).length = 0;
  }

  /**
   * Register function which will be immediately called after all plugins initialized.
   *
   * @param {Function} callback The listener function to call.
   */
  callOnPluginsReady(callback: Function): void {
    if (this.isPluginsReady) {
      callback();
    } else {
      this.pluginsInitializedCallbacks.push(callback);
    }
  }

  /**
   * Check if any of the keys defined in `SETTING_KEYS` configuration of the plugin is present in the provided
   * config object, or if the `SETTING_KEYS` configuration states that the plugin is relevant to the config object
   * regardless of its contents.
   *
   * @private
   * @param {Handsontable.DefaultSettings} settings The config object passed to `updateSettings`.
   * @returns {boolean}
   */
  #isRelevantToSettings(settings: any): boolean {
    if (!settings) {
      return false;
    }

    const settingKeys = (this.constructor as typeof BasePlugin).SETTING_KEYS;

    // If SETTING_KEYS is declared as `true` -> update the plugin regardless of the settings declared in
    // `updateSettings`.
    // If SETTING_KEYS is declared as `false` -> DON'T update the plugin regardless of the settings declared in
    // `updateSettings`.
    if (typeof settingKeys === 'boolean') {
      return settingKeys;
    }

    for (let i = 0; i < settingKeys.length; i++) {
      if (settings[settingKeys[i]] !== undefined) {
        return true;
      }
    }

    return false;
  }

  /**
   * On after plugins initialized listener.
   *
   * @private
   */
  onAfterPluginsInitialized(): void {
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
  onUpdateSettings(newSettings: any): void {
    const relevantToSettings = this.#isRelevantToSettings(newSettings);

    if (this.isEnabled) {
      if (this.enabled && !this.isEnabled()) {
        this.disablePlugin();
      }

      if (!this.enabled && this.isEnabled()) {
        this.enablePlugin();
      }

      if (
        this.enabled &&
        this.isEnabled() &&
        relevantToSettings
      ) {
        this.updatePlugin(newSettings);
      }
    }
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   *
   * @private
   */
  updatePlugin(newSettings?: any): void {
    // Empty hook for plugin overwrite
  }

  /**
   * Destroy plugin.
   */
  destroy(): void {
    this.eventManager?.destroy();
    this.clearHooks();

    objectEach(this, (value, property) => {
      if (property !== 'hot') {
        (this as any)[property] = null;
      }
    });
    
    // Use type assertion to avoid the TypeScript error
    const instance = this as any;
    if (instance.t) {
      delete instance.t;
    }
    if (instance.hot) {
      delete instance.hot;
    }
  }

  /**
   * Checks if plugin is enabled.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
