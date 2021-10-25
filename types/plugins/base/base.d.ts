import Core from '../../core';

export class BasePlugin {
  constructor(hotInstance: Core);

  pluginName: string;
  pluginsInitializedCallbacks: string[];
  isPluginsReady: boolean;
  enabled: boolean;
  initialized: boolean;

  init(): void;
  enablePlugin(): void;
  disablePlugin(): void;
  updatePlugin(): void;
  addHook(name: string, callback: Function): void;
  removeHooks(name: string): void;
  clearHooks(): void;
  callOnPluginsReady(callback: Function): void;
  destroy(): void;
}
