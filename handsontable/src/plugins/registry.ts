/**
 * Utility to register plugins and common namespace for keeping the reference to all plugins classes.
 */
import { toUpperCaseFirst } from '../helpers/string';
import { throwWithCause } from '../helpers/errors';
import type { BasePlugin } from './base/base';
import { createPriorityMap } from '../utils/dataStructures/priorityMap';
import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createUniqueSet } from '../utils/dataStructures/uniqueSet';

const ERROR_PLUGIN_REGISTERED = (pluginName: string) => `There is already registered "${pluginName}" plugin.`;
const ERROR_PRIORITY_REGISTERED = (priority: number) => `There is already registered plugin on priority "${priority}".`;
const ERROR_PRIORITY_NAN = (priority: unknown) => `The priority "${priority}" is not a number.`;

/**
 * Stores plugins' names' queue with their priorities.
 */
const priorityPluginsQueue = createPriorityMap({
  errorPriorityExists: ERROR_PRIORITY_REGISTERED,
  errorPriorityNaN: ERROR_PRIORITY_NAN,
});
/**
 * Stores plugins names' queue by registration order.
 */
const uniquePluginsQueue = createUniqueSet({
  errorItemExists: ERROR_PLUGIN_REGISTERED,
});
/**
 * Stores plugins references between their name and class.
 */
const uniquePluginsList = createUniqueMap({
  errorIdExists: ERROR_PLUGIN_REGISTERED,
});

/**
 * Gets registered plugins' names in the following order:
 * 1) Plugins registered with a defined priority attribute, in the ascending order of priority.
 * 2) Plugins registered without a defined priority attribute, in the registration order.
 *
 * @returns {string[]}
 */
export function getPluginsNames(): string[] {
  return [
    ...priorityPluginsQueue.getItems() as string[],
    ...uniquePluginsQueue.getItems() as string[],
  ];
}

/**
 * Open map of plugin name string literals to their class constructor types.
 * Augmented by `src/plugins/index.ts` for all built-in plugins.
 * Third-party packages can augment this interface to enable type inference for custom plugins.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PluginClassMap {}

/**
 * Gets registered plugin's class based on the given name.
 *
 * @param {string} pluginName Plugin's name.
 * @returns {BasePlugin}
 */
export function getPlugin<K extends keyof PluginClassMap>(pluginName: K): PluginClassMap[K] | undefined;
export function getPlugin(pluginName: string): typeof BasePlugin | undefined;
/**
 * Gets registered plugin's class based on the given name.
 *
 * @param {string} pluginName Plugin's name.
 * @returns {typeof BasePlugin | undefined}
 */
export function getPlugin(pluginName: string): typeof BasePlugin | undefined {
  const unifiedPluginName = toUpperCaseFirst(pluginName);

  return uniquePluginsList.getItem(unifiedPluginName) as typeof BasePlugin | undefined;
}

/**
 * Checks if the plugin under the name is already registered.
 *
 * @param {string} pluginName Plugin's name.
 * @returns {boolean}
 */
export function hasPlugin(pluginName: string) {
  /* eslint-disable no-unneeded-ternary */
  return getPlugin(pluginName) ? true : false;
}

/**
 * Registers plugin under the given name only once.
 *
 * @param {string|Function} pluginName The plugin name or plugin class.
 * @param {Function} [pluginClass] The plugin class.
 * @param {number} [priority] The plugin priority.
 */
export function registerPlugin(pluginName: string | Function, pluginClass?: Function, priority?: number) {
  const [name, klass, prio] = unifyPluginArguments(pluginName, pluginClass, priority);

  if (getPlugin(name) === undefined) {
    _registerPlugin(name, klass, prio);
  }
}

/**
 * Registers plugin under the given name.
 *
 * @param {string|Function} pluginName The plugin name or plugin class.
 * @param {Function} [pluginClass] The plugin class.
 * @param {number} [priority] The plugin priority.
 */
function _registerPlugin(pluginName: string, pluginClass?: Function, priority?: number) {
  const unifiedPluginName = toUpperCaseFirst(pluginName);

  if (uniquePluginsList.hasItem(unifiedPluginName)) {
    throwWithCause(ERROR_PLUGIN_REGISTERED(unifiedPluginName));
  }

  if (priority === undefined) {
    uniquePluginsQueue.addItem(unifiedPluginName);
  } else {
    priorityPluginsQueue.addItem(priority, unifiedPluginName);
  }

  uniquePluginsList.addItem(unifiedPluginName, pluginClass);
}

/**
 * Unifies arguments to register the plugin.
 *
 * @param {string|Function} pluginName The plugin name or plugin class.
 * @param {Function} [pluginClass] The plugin class.
 * @param {number} [priority] The plugin priority.
 * @returns {Array}
 */
interface PluginClassWithMeta extends Function {
  PLUGIN_KEY: string;
  PLUGIN_PRIORITY: number;
}

/**
 *
 */
function unifyPluginArguments(
  pluginName: string | Function, pluginClass?: Function, priority?: number
): [string, Function | undefined, number | undefined] {
  if (typeof pluginName === 'function') {
    pluginClass = pluginName;
    pluginName = (pluginClass as PluginClassWithMeta).PLUGIN_KEY;
    priority = (pluginClass as PluginClassWithMeta).PLUGIN_PRIORITY;
  }

  return [pluginName, pluginClass, priority];
}
