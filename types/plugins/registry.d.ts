import Core from '../core';
import { PluginsCollection } from './index';
import { BasePlugin } from './base';

export function getPluginsNames(): string[];
export function getPlugin<T extends keyof PluginsCollection>(pluginName: T): PluginsCollection[T];
export function hasPlugin(pluginName: string): boolean;
export function registerPlugin(pluginName: string, pluginClass: { new(hotInstance?: Core): BasePlugin }): void;
