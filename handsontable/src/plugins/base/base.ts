import type { HotInstance } from '../../core/types';
import type { HookCallback } from '../../core/hooks/bucket';
import type { Events } from '../../core/settings';
import {
  defineGetter, objectEach, isObject, isPlainObject, assignObjectDefaults, getProperty,
} from '../../helpers/object';
import { throwWithCause } from '../../helpers/errors';
import { arrayEach } from '../../helpers/array';
import { hasPlugin } from '../registry';
import { hasCellType } from '../../cellTypes/registry';
import { hasEditor } from '../../editors/registry';
import { hasRenderer } from '../../renderers/registry';
import { hasValidator } from '../../validators/registry';
import EventManager from '../../eventManager';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { getHardConflict } from './conflictRegistry';

// eslint-disable-next-line no-spaced-func, func-call-spacing
const DEPS_TYPE_CHECKERS = new Map<string, (name: string) => boolean>([
  ['plugin', hasPlugin],
  ['cell-type', hasCellType],
  ['editor', hasEditor],
  ['renderer', hasRenderer],
  ['validator', hasValidator],
]);

export const defaultMainSettingSymbol = Symbol('mainSetting');
export const PLUGIN_KEY = 'base';

/**
 * What UndoRedo tells a plugin's `restoreState()` about the step it restores.
 */
export interface PluginRestoreContext {
  /**
   * The plugin's state on the other side of the step: after it for an undo, before it for a redo.
   */
  other?: unknown;
  /**
   * `'undo'` or `'redo'`.
   */
  direction?: 'undo' | 'redo';
  /**
   * `true` when the restore replayed row or column insertions or removals first. The grid's live state
   * is then numbered like the restored side, not like `other`, so the two cannot be compared.
   */
  reordered?: boolean;
}

/**
 * Returns the error message line for every module a plugin declares in `PLUGIN_DEPS` that is not registered.
 *
 * @param {BasePlugin} plugin The plugin to check.
 * @returns {string|null} The message, or `null` when every dependency is registered.
 */
function getMissingDependenciesMessage(plugin: BasePlugin): string | null {
  const pluginDeps = plugin.constructor.PLUGIN_DEPS;
  const deps = Array.isArray(pluginDeps) ? pluginDeps : [];
  const missingDependencies: string[] = [];

  deps.forEach((dependency) => {
    const [type, moduleName] = dependency.split(':');

    if (!DEPS_TYPE_CHECKERS.has(type)) {
      throwWithCause(`Unknown plugin dependency type "${type}" was found.`);
    }

    if (!DEPS_TYPE_CHECKERS.get(type)!(moduleName)) {
      missingDependencies.push(` - ${moduleName} (${type})`);
    }
  });

  if (missingDependencies.length === 0) {
    return null;
  }

  return [
    `The ${plugin.pluginName} plugin requires the following modules:\n`,
    `${missingDependencies.join('\n')}\n`,
  ].join('');
}

/**
 * Runs the init sequence of one grid's plugins. Core calls it once, while `beforeInit` is dispatched,
 * with the plugins in `PLUGIN_PRIORITY` order: every plugin's `init()`, one error for all missing
 * dependencies, one `afterPluginsInitialized`, then one `enablePlugin()` for each enabled plugin, in the
 * same order. The state lives in this call, so grids built side by side cannot share it.
 *
 * @param {HotInstance} hot The Handsontable instance the plugins belong to.
 * @param {BasePlugin[]} plugins The grid's plugins, in priority order.
 */
export function initializePlugins(hot: HotInstance, plugins: BasePlugin[]): void {
  const missingDepsMsgs: string[] = [];

  plugins.forEach((plugin) => {
    plugin.init();

    const missingDepsMsg = getMissingDependenciesMessage(plugin);

    if (missingDepsMsg !== null) {
      missingDepsMsgs.push(missingDepsMsg);
    }
  });

  if (missingDepsMsgs.length > 0) {
    throwWithCause([
      `${missingDepsMsgs.join('\n')}\n`,
      'You have to import and register them manually.',
    ].join(''));
  }

  hot.runHooks('afterPluginsInitialized');

  plugins.forEach(plugin => plugin.onInitEnableTurn());
}

/**
 * @util
 * @property {Core} hot Handsontable instance.
 */
export class BasePlugin {
  /**
   * Reference to the Handsontable instance this plugin belongs to.
   */
  declare hot: HotInstance;
  /**
   * Translation helper object provided by the i18n system, if available.
   */
  declare t?: Record<string, Function>;
  /**
   * Reference to the plugin's own class constructor, used for static property access at runtime.
   */
  declare ['constructor']: typeof BasePlugin;

  // Allow child classes to define isEnabled
  /**
   * Returns `true` if the plugin should be active based on current Handsontable settings. Defined by each subclass.
   */
  isEnabled?(): boolean;

  /**
   * Returns the plugin key used to identify and look up this plugin in Handsontable settings and the plugin registry.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * The SETTING_KEYS getter defines the keys that, when present in the config object, trigger the plugin update
   * after the updateSettings calls.
   * - When it returns true, the plugin updates after all updateSettings calls, regardless of the contents of the
   * config object.
   * - When it returns false, the plugin never updates on updateSettings calls.
   *
   * @returns {string[] | boolean}
   */
  static get SETTING_KEYS(): string[] | boolean {
    return [
      this.PLUGIN_KEY
    ];
  }

  /**
   * The DEFAULT_SETTINGS getter defines the plugin default settings.
   *
   * @returns {object}
   */
  static get DEFAULT_SETTINGS(): Record<string | symbol, unknown> {
    return {};
  }

  /**
   * Validators for plugin settings.
   *
   * @type {Function|object|null}
   */
  static get SETTINGS_VALIDATORS(): ((value: unknown) => boolean) | Record<string, (value: unknown) => boolean> | null {
    return null;
  }

  /**
   * Optional list of plugin dependencies in the format 'type:ModuleName'.
   *
   * @type {string[] | undefined}
   */
  static PLUGIN_DEPS?: string[];

  /**
   * Plugin settings.
   *
   * @type {object|null}
   */
  #pluginSettings: Record<string | symbol, unknown> | unknown[] | boolean | string | number | null = null;

  /**
   * The instance of the EventManager class.
   *
   * @type {EventManager}
   */
  eventManager = new EventManager(this);
  /**
   * @type {string}
   */
  pluginName: string | null = null;
  /**
   * @type {Function[]}
   */
  pluginsInitializedCallbacks: (() => void)[] = [];
  /**
   * @type {boolean}
   */
  isPluginsReady = false;
  /**
   * @type {boolean}
   */
  enabled = false;
  /**
   * @type {boolean}
   */
  initialized = false;
  /**
   * Collection of the reference to the plugins hooks.
   */
  #hooks: Record<string, HookCallback[]> = {};
  /**
   * Whether the plugin owes work to core's `onDataReady()` pass (see `deferDataWork()`).
   */
  #deferredDataWork = false;
  /**
   * Whether the plugin waits for its turn in the grid's init sequence (see `initializePlugins()`). Set by
   * `init()`, cleared by `onInitEnableTurn()`. While it is set, a settings pass started by an earlier
   * plugin does not enable the plugin, so every plugin enables once, in priority order.
   */
  #awaitsInitEnableTurn = false;
  /**
   * Whether a settings pass that carried the plugin's own option ran while the plugin waited for its
   * turn, so `onInitEnableTurn()` reads the plugin settings again before it enables the plugin.
   */
  #settingsChangedBeforeInitEnable = false;
  /**
   * Whether the plugin owes its ready step (`onGridReady()`). Set when an `enablePlugin()` or
   * `updatePlugin()` call returns with the plugin enabled, cleared by `disablePlugin()` and when the step
   * runs (see `runOwedReadyStep()`).
   */
  #readyStepOwed = false;
  /**
   * The lifecycle listeners the constructor registers directly on the Handsontable instance. They
   * bypass `addHook()`, so `clearHooks()` never removes them - `destroy()` does. The init sequence
   * itself is run by core (`initializePlugins()`), not by a listener of each plugin.
   */
  #lifecycleHooks: Record<string, HookCallback> = {
    afterPluginsInitialized: () => this.onAfterPluginsInitialized(),
    afterUpdateSettings: (newSettings: Record<string, unknown>) => this.onUpdateSettings(newSettings),
  };

  /**
   * @param {object} hotInstance Handsontable instance.
   */
  constructor(hotInstance: HotInstance) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    defineGetter(this, 'hot', hotInstance, {
      writable: false
    });

    objectEach(this.#lifecycleHooks, (callback: HookCallback, name: string) => {
      this.hot.addHook(name, callback);
    });

    this.#routeLifecycleCalls();
  }

  /**
   * Routes every call of the plugin's `enablePlugin()`, `updatePlugin()` and `disablePlugin()` through
   * core's lifecycle pass, so the ready step an enable or an update owes runs once the outermost call
   * returns, whoever made it. Each method is replaced on the instance by a wrapper that calls the method
   * the plugin's class resolves at that moment, so an override and a spy on a prototype still run.
   * The wrappers are not enumerable, so `destroy()`, which nulls the enumerable own properties, keeps
   * them, and a call on a destroyed plugin still reaches the method's own guard.
   */
  #routeLifecycleCalls(): void {
    const toProperty = (value: Function): PropertyDescriptor => ({
      configurable: true,
      enumerable: false,
      writable: true,
      value,
    });

    // `this.constructor.prototype` is the most derived class's prototype, read on every call.
    Object.defineProperties(this, {
      enablePlugin: toProperty(() => this.#runLifecycleCall(true, () => {
        this.constructor.prototype.enablePlugin.call(this);
      })),
      updatePlugin: toProperty((...args: Parameters<BasePlugin['updatePlugin']>) => this.#runLifecycleCall(true, () => {
        this.constructor.prototype.updatePlugin.apply(this, args);
      })),
      disablePlugin: toProperty(() => this.#runLifecycleCall(false, () => {
        this.constructor.prototype.disablePlugin.call(this);
      })),
    });
  }

  /**
   * Runs one lifecycle call of the plugin as a core lifecycle pass. An enable or an update that leaves
   * the plugin enabled makes it owe its ready step.
   *
   * @param {boolean} owesReadyStep Whether the call is an enable or an update.
   * @param {Function} call The lifecycle call.
   */
  #runLifecycleCall(owesReadyStep: boolean, call: () => void): void {
    // A destroyed plugin has no grid to run a pass on, and a host that is not a Handsontable instance
    // (a test double built around the plugin) runs no passes. The method then runs as it always did.
    if (!this.hot || typeof this.hot._runInPluginLifecyclePass !== 'function') {
      call();

      return;
    }

    this.hot._runInPluginLifecyclePass(() => {
      call();

      if (owesReadyStep && this.enabled) {
        this.#readyStepOwed = true;
      }
    });
  }

  /**
   * Initializes the plugin by resolving its name and applying its settings. Core calls it once per grid,
   * from `initializePlugins()`, which also checks the plugin's `PLUGIN_DEPS`.
   */
  init(): void {
    this.pluginName = this.hot.getPluginName(this);
    this.updatePluginSettings(this.hot.getSettings()[this.constructor.PLUGIN_KEY]);
    this.#awaitsInitEnableTurn = true;
    this.initialized = true;
  }

  /**
   * Enables the plugin when its turn in the grid's init sequence comes (see `initializePlugins()`), if
   * its settings ask for it and no hard conflict blocks it. A plugin another plugin enabled directly
   * before its turn is not enabled again.
   *
   * @private
   */
  onInitEnableTurn(): void {
    const awaitedTurn = this.#awaitsInitEnableTurn;
    const settingsChanged = this.#settingsChangedBeforeInitEnable;

    this.#awaitsInitEnableTurn = false;
    this.#settingsChangedBeforeInitEnable = false;

    if (!awaitedTurn || this.enabled || !this.isEnabled?.()) {
      return;
    }

    if (this.isHardConflictBlocked()) {
      this.hot.getSettings()[this.constructor.PLUGIN_KEY] = false;

      return;
    }

    if (settingsChanged) {
      this.updatePluginSettings(this.hot.getSettings()[this.constructor.PLUGIN_KEY]);
    }

    this.enablePlugin();
  }

  /**
   * Whether this plugin is blocked by a registered hard conflict (another top-level setting is truthy; for example
   * nestedRows blocks pagination, or manualRowMove blocks dataProvider). Emits a console warning when blocked.
   *
   * @returns {boolean} true if the plugin must not enable.
   */
  isHardConflictBlocked() {
    const pluginKey = this.constructor.PLUGIN_KEY;
    const conflict = getHardConflict(this.hot.getSettings(), pluginKey);

    if (conflict) {
      const { incompatibleSettingKey } = conflict;

      warn(toSingleLine`The \`${pluginKey}\` plugin cannot be used with the \`${incompatibleSettingKey}\` option.\x20
        This combination is not supported. The plugin will remain disabled.`);

      return true;
    }

    return false;
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
    this.#deferredDataWork = false;
    this.#readyStepOwed = false;
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
   * @returns {T}
   */
  getSetting<T = unknown>(settingName?: string): T {
    const defaultSettings = this.constructor.DEFAULT_SETTINGS;
    const settingsValidators = this.constructor.SETTINGS_VALIDATORS;

    if (settingName === undefined) {
      if (isPlainObject(this.#pluginSettings)) {
        return assignObjectDefaults(this.#pluginSettings, defaultSettings) as T;
      }

      return this.#pluginSettings as T;
    }

    let settingValue;

    if (
      (Array.isArray(this.#pluginSettings) || isPlainObject(this.#pluginSettings)) &&
      defaultSettings[defaultMainSettingSymbol] === settingName
    ) {
      if (Array.isArray(this.#pluginSettings)) {
        settingValue = this.#pluginSettings;
      } else {
        settingValue = this.#pluginSettings[settingName] ?? defaultSettings[settingName];
      }
    } else if (settingName.includes('.')) {
      const pluginValue = isPlainObject(this.#pluginSettings) ?
        getProperty(this.#pluginSettings, settingName) : undefined;
      const defaultValue = getProperty(defaultSettings, settingName);

      if (isPlainObject(pluginValue)) {
        settingValue = assignObjectDefaults(
          pluginValue, isPlainObject(defaultValue) ? defaultValue : {}
        );
      } else {
        settingValue = pluginValue !== undefined ? pluginValue : defaultValue;
      }
    } else if (isPlainObject(this.#pluginSettings)) {
      settingValue = assignObjectDefaults(
        this.#pluginSettings, defaultSettings
      )[settingName];
    } else {
      settingValue = defaultSettings[settingName];
    }

    if (typeof settingValue === 'function' && settingsValidators && typeof settingsValidators === 'object') {
      const validator = settingsValidators[settingName];

      if (validator && typeof validator === 'function') {
        const wrappedFn = settingValue as (...args: unknown[]) => unknown;

        return this.#wrapSettingWithValidator(wrappedFn, validator, settingName) as T;
      }
    }

    return settingValue as T;
  }

  /**
   * Wraps a setting function with its validator, returning a guarded wrapper that emits a warning
   * and returns undefined when the validator rejects the result.
   *
   * @param {Function} settingFn The setting function to wrap.
   * @param {Function} validator The validator function for the setting.
   * @param {string} settingName The name of the setting (used in the warning message).
   * @returns {Function} A wrapped function that validates the result before returning it.
   */
  #wrapSettingWithValidator(
    settingFn: (...args: unknown[]) => unknown,
    validator: (result: unknown) => boolean,
    settingName: string
  ): (...args: unknown[]) => unknown {
    return (...args: unknown[]): unknown => {
      const result: unknown = settingFn(...args);
      const isValid = validator(result);

      if (isValid === false) {
        const formattedArgs = args.map(arg => (typeof arg === 'string' ? `"${arg}"` : '')).join(', ');
        const source = args.length > 0 ? formattedArgs : '';

        warn(`${this.pluginName} Plugin: "${settingName}" function (${source}) result \
               is not valid and will be ignored.`);

        return;
      }

      return result;
    };
  }

  /**
   * Update plugin settings.
   *
   * @param {*} newSettings New settings.
   * @returns {object} Updated settings object.
   */
  updatePluginSettings(newSettings: unknown) {
    const settingsValidators = this.constructor.SETTINGS_VALIDATORS;

    if (settingsValidators &&
      typeof settingsValidators === 'function' &&
      typeof newSettings !== 'object'
    ) {
      const isValid = settingsValidators(newSettings);

      if (isValid === false) {
        warn(`${this.pluginName} Plugin: option is not valid and it will be ignored.`);

        return;
      }

      this.#pluginSettings = newSettings as boolean | string | number | null;

      return this.#pluginSettings;
    }

    if (settingsValidators &&
       typeof settingsValidators === 'object' &&
       isPlainObject(newSettings)
    ) {
      if (!isPlainObject(this.#pluginSettings)) {
        this.#pluginSettings = { ...this.constructor.DEFAULT_SETTINGS };
      }

      // isPlainObject confirms the type after the potential reset above
      const currentSettings = isPlainObject(this.#pluginSettings) ? this.#pluginSettings : {};

      Object.keys(settingsValidators).forEach((key) => {
        if (!(key in newSettings)) {
          return;
        }

        const validator = settingsValidators[key];
        const isValid = validator ? validator(newSettings[key]) : true;

        if (isValid === false) {
          warn(`${this.pluginName} Plugin: "${key}" option is not valid and it will be ignored.`);

          return;
        }

        currentSettings[key] = newSettings[key];
      });

      return this.#pluginSettings;
    }

    this.#pluginSettings = newSettings as Record<string, unknown> | unknown[] | boolean | string | number | null;

    return newSettings;
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
  addHook<K extends keyof Events>(name: K, callback: Events[K], orderIndex?: number): void;
  /**
   * Registers a hook listener under a known hook name, accepting any explicitly-annotated callback
   * (see the overload-ladder description on `HotInstance` in `core/types.ts`).
   */
  addHook<K extends keyof Events>(name: K, callback: HookCallback, orderIndex?: number): void;
  /**
   * Registers a hook listener under a dynamically-named hook.
   */
  addHook(name: string, callback: HookCallback, orderIndex?: number): void;
  /**
   * Registers a hook listener and tracks it so it can be removed automatically when the plugin is disabled.
   */
  addHook(name: string, callback: HookCallback, orderIndex?: number): void {
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

    objectEach(hooks, (callbacks: unknown, name: string) => this.removeHooks(name));
    Object.keys(hooks).forEach(key => delete hooks[key]);
  }

  /**
   * Register function which will be immediately called after all plugins initialized.
   *
   * @param {Function} callback The listener function to add.
   */
  callOnPluginsReady(callback: () => void): void {
    if (this.isPluginsReady) {
      callback();
    } else {
      this.pluginsInitializedCallbacks.push(callback);
    }
  }

  /**
   * Check if any of the keys defined in SETTING_KEYS configuration of the plugin is present in the provided
   * config object, or if the SETTING_KEYS configuration states that the plugin is relevant to the config object
   * regardless of its contents.
   *
   * @private
   * @param {Handsontable.DefaultSettings} settings The config object passed to updateSettings.
   * @returns {boolean}
   */
  #isRelevantToSettings(settings: Record<string, unknown>) {
    if (!settings) {
      return false;
    }

    const settingKeys = this.constructor.SETTING_KEYS;

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
   * Optional step core's `_applySettingsAndData()` calls once the data the settings describe is loaded,
   * for every enabled plugin that defines it, in plugin priority order (see `isDataWorkDeferred()`).
   *
   * @private
   */
  onDataReady?(): void;

  /**
   * Optional ready step: the part of enabling or updating the plugin that reads the loaded rows, the
   * view (`hot.view`), the DOM or the editor manager. Core calls it once after every `enablePlugin()` or
   * `updatePlugin()` call that leaves the plugin enabled, as soon as all of these exist, and before the
   * next render: at init after the view is built (before the `init` hook), at the end of
   * `updateSettings()`, and once a direct call returns. Calls nested in one pass get one step, in
   * plugin priority order, after every plugin of the pass is enabled. `enablePlugin()` and
   * `updatePlugin()` then only configure the plugin (hooks, index maps, settings, own state), so none of
   * them needs to check whether `hot.view` exists. Nothing the step does is journaled by UndoRedo.
   *
   * @private
   */
  onGridReady?(): void;

  /**
   * Runs the plugin's ready step (`onGridReady()`) if the plugin owes one, and clears the debt. Only an
   * enabled plugin owes it: `disablePlugin()` clears it. Core calls it, in plugin priority order.
   *
   * @private
   * @returns {boolean} `true` if the plugin owed the step.
   */
  runOwedReadyStep(): boolean {
    if (!this.#readyStepOwed) {
      return false;
    }

    this.#readyStepOwed = false;
    this.onGridReady?.();

    return true;
  }

  /**
   * Whether the settings this plugin is applying describe data the grid has not loaded yet. Core's
   * `_applySettingsAndData()` applies settings first and loads their data after, the order the grid's
   * own initialization uses, and answers `true` from its settings pass through the load and the
   * held-back meta phase (`afterCellMetaReset` included), dropping only before the `onDataReady()`
   * pass. A plugin whose `enablePlugin()` or `updatePlugin()` reads or writes the loaded rows skips that
   * work while this is `true`, records it with `deferDataWork()` and does it in `onDataReady()` when
   * `takeDeferredDataWork()` answers `true`. Core calls `onDataReady()` once the data is loaded, in plugin
   * priority order, for every enabled plugin that has one. Work that needs the load itself, rather than
   * the loaded rows, waits only while `isDataLoadPending()` answers `true`.
   *
   * @private
   * @returns {boolean}
   */
  isDataWorkDeferred(): boolean {
    return this.hot._isDataWorkDeferred();
  }

  /**
   * Whether the data the settings describe is still to be loaded: `true` only while core's
   * `_applySettingsAndData()` applies its settings, before its load. Work that needs that load itself (a
   * check of the incoming data, a sheet the load fills) waits for it while this is `true`, and does the work
   * at once when the settings arrive later in the call (an `afterLoadData` listener), because the load has
   * already run then.
   *
   * @private
   * @returns {boolean}
   */
  isDataLoadPending(): boolean {
    return this.hot._isDataLoadPending();
  }

  /**
   * Records that the plugin owes work to core's `onDataReady()` pass, which runs once the data the settings
   * describe is loaded. Nothing is recorded while the grid has no view: core skips that pass on a grid still
   * being built, and the plugin's own `afterInit` does the work there. The record is dropped when the plugin
   * is disabled, and when the call fails before the pass, so it can never run against another call's data.
   *
   * @private
   */
  deferDataWork(): void {
    if (this.hot.view) {
      this.#deferredDataWork = true;
    }
  }

  /**
   * Answers whether the plugin owes work to `onDataReady()` (see `deferDataWork()`), and clears the record.
   *
   * @private
   * @returns {boolean}
   */
  takeDeferredDataWork(): boolean {
    const owed = this.#deferredDataWork;

    this.#deferredDataWork = false;

    return owed;
  }

  /**
   * Drops the work the plugin owes to `onDataReady()`. Core calls it when `_applySettingsAndData()` fails
   * before that pass.
   *
   * @private
   */
  dropDeferredDataWork(): void {
    this.#deferredDataWork = false;
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
   * On update settings listener. Re-applies hard conflict rules when settings change so a plugin that is already
   * enabled disables if a conflicting top-level setting becomes truthy, even when this plugin's SETTING_KEYS do not
   * overlap the updateSettings payload.
   *
   * A call that turns the plugin on refreshes the plugin settings from the merged grid settings before
   * `enablePlugin()`, which reads them, and does not refresh them again before `updatePlugin()`: a second
   * refresh logged every validation warning twice, and, for a payload carrying only a foreign `SETTING_KEYS`
   * option, wiped what the first one read.
   *
   * @private
   * @param {object} newSettings New set of settings passed to the updateSettings method.
   */
  onUpdateSettings(newSettings: Record<string, unknown>) {
    if (!this.isEnabled) {
      return;
    }

    // A settings pass that runs inside the grid's init sequence (SheetsBar builds its first sheet from
    // its `enablePlugin()`) must not enable a plugin that still waits for its turn: core enables it
    // there, once and in priority order, reading the settings again when this pass carried its option.
    if (this.#awaitsInitEnableTurn) {
      if (newSettings?.[this.constructor.PLUGIN_KEY] !== undefined) {
        this.#settingsChangedBeforeInitEnable = true;
      }

      return;
    }

    const relevantToSettings = this.#isRelevantToSettings(newSettings);

    if (this.enabled && !this.isEnabled()) {
      this.disablePlugin();
    }

    let settingsRefreshed = false;

    if (!this.enabled && this.isEnabled()) {
      if (this.isHardConflictBlocked()) {
        return;
      }
      this.updatePluginSettings(this.hot.getSettings()[this.constructor.PLUGIN_KEY]);
      settingsRefreshed = true;
      this.enablePlugin();
    }

    if (
      this.enabled &&
      this.isEnabled() &&
      this.isHardConflictBlocked()
    ) {
      this.disablePlugin();

      return;
    }

    if (
      this.enabled &&
      this.isEnabled() &&
      relevantToSettings
    ) {
      if (!settingsRefreshed) {
        this.updatePluginSettings(newSettings[this.constructor.PLUGIN_KEY]);
      }

      this.updatePlugin(newSettings);
    }
  }

  /**
   * Updates the plugin to use the latest options you have specified.
   *
   * @private
   */
  updatePlugin(newSettings?: Record<string, unknown>): void {
    // Intentionally empty
  }

  /**
   * Runs one of the plugin's mutations as an operation, so everything it changes is recorded as a
   * single user action (one undo step). Nested inside another operation, it joins it.
   *
   * @private
   * @param {string} name The operation name. It becomes the undo step's `actionType` when the
   * operation is the outermost one.
   * @param {Function} callback The mutation.
   * @param {object} [details] Public details of the action, handed to the undo hooks as fields of the undo step.
   * @param {string} [source] The operation source. Defaults to `<PluginName>.<name>`.
   * @returns {*} The value the callback returns.
   */
  runOperation<T>(name: string, callback: () => T, details?: Record<string, unknown>, source?: string): T {
    const scope = this.hot._getOperationScope();

    return scope.run(name, source ?? `${this.pluginName}.${name}`, () => {
      if (details !== undefined) {
        scope.describe(details);
      }

      return callback();
    });
  }

  /**
   * Returns the part of the plugin's state that lives outside its index maps and must be put back
   * when an action is undone or redone (the index maps are captured by UndoRedo itself). A plugin
   * without such state does not implement the method.
   *
   * The capture runs after every user action, so it must be cheap when nothing changed: return
   * `previous` itself – the value this method returned last time – when the state did not change
   * since then. Snapshots are shared between undo steps and must never be mutated afterwards.
   *
   * @private
   * @param {*} previous The value the previous capture returned, or `undefined`.
   * @returns {*} The captured state.
   */
  captureState?(previous: unknown): unknown;

  /**
   * Puts back a state returned by `captureState()`. It runs while UndoRedo restores a snapshot, with
   * rendering and index recalculation suspended and after the index maps were restored, so the
   * visual index space already is the restored one. It must not fire the hooks the original action
   * fired: `afterUndo`/`afterRedo` tell listeners about the restore.
   *
   * `context` names the step being restored: the plugin's state on its other side and the direction.
   * It lets a plugin apply only what the step changed, so a change made outside any step since
   * survives. It is absent when the restore puts back a state no step changed.
   *
   * @private
   * @param {*} state The state to restore.
   * @param {object} [context] The step being restored.
   */
  restoreState?(state: unknown, context?: PluginRestoreContext): void;

  /**
   * Returns the physical columns a step addresses through this plugin's state: the columns whose
   * state differs between `state` and `other`, the plugin's states on the two sides of the step.
   * UndoRedo asks when a `columns` settings update changes which field a column shows, and keeps
   * the step only when none of these columns changed. Return `null`, or leave the method out, when
   * the state cannot be read per column – the step is then dropped.
   *
   * @private
   * @param {*} state The state on one side of the step.
   * @param {*} other The state on the other side.
   * @returns {number[]|null}
   */
  getStateColumns?(state: unknown, other: unknown): readonly number[] | null;

  /**
   * Returns the shape of the source data, for a plugin that reshapes the source array itself (the
   * NestedRows plugin moves rows inside its tree). UndoRedo then restores the source shape from this
   * snapshot instead of replaying the recorded row insertions and removals. Same copy-on-change
   * contract as `captureState()`.
   *
   * @private
   * @param {*} previous The value the previous capture returned, or `undefined`.
   * @returns {*} The captured source shape.
   */
  captureSourceStructure?(previous: unknown): unknown;

  /**
   * Puts back a source shape returned by `captureSourceStructure()`. Runs first in a restore, before
   * any recorded data change is replayed.
   *
   * @private
   * @param {*} state The source shape to restore.
   */
  restoreSourceStructure?(state: unknown): void;

  /**
   * Destroy plugin.
   */
  destroy(): void {
    // A plugin destroyed on its own, ahead of the grid, must stop answering the grid's lifecycle
    // hooks: `onUpdateSettings()` reads `this.hot`, which is gone below, so the next
    // `updateSettings()` would throw (DEV-775). The grid destroys every plugin again on its own
    // `destroy()`, when `hot` is already gone and there is nothing left to remove.
    if (this.hot) {
      objectEach(this.#lifecycleHooks, (callback: HookCallback, name: string) => {
        this.hot.removeHook(name, callback);
      });
    }

    this.#pluginSettings = null;
    this.#readyStepOwed = false;
    this.eventManager?.destroy();
    this.clearHooks();

    objectEach(this, (_value: unknown, property: string) => {
      if (property !== 'hot') {
        Reflect.set(this, property, null);
      }
    });
    delete this.t;
    // `hot` is non-writable (set via defineGetter with writable: false) so Reflect.set
    // silently fails for it. Delete the own property instead so that async guards like
    // `if (!this.hot)` return `undefined` (falsy) after the plugin is destroyed.
    Reflect.deleteProperty(this, 'hot');
  }
}
