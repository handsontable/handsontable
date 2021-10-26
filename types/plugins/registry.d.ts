import Core from '../core';
import { Plugins } from './index';
import { BasePlugin } from './base';

export function getPluginsNames(): string[];
export function getPlugin<T extends keyof Plugins>(pluginName: T): Plugins[T];
export function hasPlugin(pluginName: string): boolean;
export function registerPlugin(pluginName: string, pluginClass: { new(hotInstance?: Core): BasePlugin }): void;
export function registerPlugin(pluginClass: { new(hotInstance?: Core): BasePlugin }): void;
