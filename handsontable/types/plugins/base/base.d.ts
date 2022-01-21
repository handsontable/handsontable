import Core from '../../core';

export class BasePlugin {
  constructor(hotInstance: Core);

  static get PLUGIN_KEY(): string;
  static get SETTING_KEYS(): string[] | boolean;

  pluginName: string;
  pluginsInitializedCallbacks: string[];
  isPluginsReady: boolean;
  enabled: boolean;
  initialized: boolean;

  init(): void;
  enablePlugin(): void;
  disablePlugin(): void;
  updatePlugin(): void;
  addHook(name: string, callback: () => void): void;
  removeHooks(name: string): void;
  clearHooks(): void;
  callOnPluginsReady(callback: () => void): void;
  destroy(): void;
}
