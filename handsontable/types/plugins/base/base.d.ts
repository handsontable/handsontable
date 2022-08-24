import Core from '../../core';
import { Events } from '../../pluginHooks';

export class BasePlugin {
  readonly hot: Core;

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
  addHook<K extends keyof Events>(key: K, callback: Events[K] | Array<Events[K]>): void;
  removeHooks(name: keyof Events): void;
  clearHooks(): void;
  callOnPluginsReady(callback: () => void): void;
  destroy(): void;
}
