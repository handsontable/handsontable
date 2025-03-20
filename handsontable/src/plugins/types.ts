/**
 * Types for plugins module
 */

/**
 * Interface for the Handsontable core instance
 */
export interface Core {
  getPluginName(plugin: any): string;
  getSettings(): any;
  addHook(name: string, callback: Function, orderIndex?: number): void;
  removeHook(name: string, callback: Function): void;
  runHooks(name: string, ...args: any[]): any;
  addHookOnce(name: string, callback: Function, orderIndex?: number): void;
  [key: string]: any;
}

/**
 * Type definition for plugin constructor
 */
export interface PluginClass {
  PLUGIN_KEY: string;
  PLUGIN_PRIORITY?: number;
  PLUGIN_DEPS?: string[];
  SETTING_KEYS: string[] | boolean;
  DEFAULT_SETTINGS: Record<string, any>;
  new(hotInstance: Core): BasePluginInterface;
}

/**
 * Interface for the BasePlugin class
 */
export interface BasePluginInterface {
  hot: Core;
  eventManager: any;
  pluginName: string | null;
  pluginsInitializedCallbacks: Function[];
  isPluginsReady: boolean;
  enabled: boolean;
  initialized: boolean;
  
  init(): void;
  enablePlugin(): void;
  disablePlugin(): void;
  getSetting(settingName?: string): any;
  addHook(name: string, callback: Function, orderIndex?: number): void;
  removeHooks(name: string): void;
  clearHooks(): void;
  callOnPluginsReady(callback: Function): void;
  onAfterPluginsInitialized(): void;
  onUpdateSettings(newSettings: any): void;
  updatePlugin(): void;
  destroy(): void;
} 