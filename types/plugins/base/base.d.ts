export class BasePlugin {
  constructor(hotInstance: any);

  pluginName: string;
  pluginsInitializedCallbacks: any[];
  isPluginsReady: boolean;
  enabled: boolean;
  initialized: boolean;

  init(): void;
  enablePlugin(): void;
  disablePlugin(): void;
  addHook(name: string, callback: Function): void;
  removeHooks(name: string): void;
  clearHooks(): void;
  callOnPluginsReady(callback: Function): void;
  destroy(): void;
}
