import { Plugins } from './index';
import { BasePlugin } from './base';

export function getPluginsNames(): string[];
export function getPlugin<T extends keyof Plugins>(pluginName: T): Plugins[T];
export function getPlugin(pluginName: string): BasePlugin;
export function hasPlugin(pluginName: string): boolean;
export function registerPlugin(pluginName: string, pluginClass: typeof BasePlugin): void;
export function registerPlugin(pluginClass: typeof BasePlugin): void;
