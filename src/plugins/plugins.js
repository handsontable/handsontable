/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes.
 */
import { toUpperCaseFirst } from '../helpers/string';

const orderedPluginsRegistry = new Map();
const unorderedPluginsRegistry = new Set();
const pluginsRegistry = new Map();

/**
 * Binds plugin name with its plugin class reference.
 *
 * @param {string} pluginName The plugin name.
 * @param {BasePlugin} pluginClass The plugin class.
 * @throws Will throw an error if there is already registered plugin on the passed name.
 */
function addToPluginsRegistry(pluginName, pluginClass) {
  if (pluginsRegistry.has(pluginName)) {
    throw Error(`There is already registered ${pluginName} plugin`);
  }

  pluginsRegistry.set(pluginName, pluginClass);
}
/**
 * Register plugin in unordered registry.
 *
 * @param {string} pluginName Plugin's name.
 * @throws Will throw an error if passed pluginName is already taken.
 */
function registerUnorderedPlugin(pluginName) {
  if (unorderedPluginsRegistry.has(pluginName)) {
    throw Error(`There is already registered ${pluginName} plugin`);
  }

  unorderedPluginsRegistry.add(pluginName);
}
/**
 * Gets plugins' names registered in unordered registry.
 *
 * @returns {string[]}
 */
function getUnorderedPluginsNames() {
  return [...unorderedPluginsRegistry];
}
/**
 * Register plugin in ordered registry.
 *
 * @param {string} pluginName Plugin's name.
 * @param {number} priority Plugin's priority.
 * @throws Will throw an error if passed priority is already taken.
 */
function registerOrderedPlugin(pluginName, priority) {
  if (orderedPluginsRegistry.has(priority)) {
    throw Error(`There is already registered plugin on priority ${priority}`);
  }

  orderedPluginsRegistry.set(priority, pluginName);
}
/**
 * Gets plugins' names registered in ordered registry.
 *
 * @returns {string[]}
 */
function getOrderedPluginsNames() {
  return [...orderedPluginsRegistry]
    // we want to be sure we sort over a priority key
    // if we are sure we can remove custom compare function
    // then we should replace next line with a default `.sort()`
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(item => item[1]);
}

/**
 * Gets registered plugins' names with appropriated order.
 * First ordered plugins by their ascending priority.
 * Then plugins from the unordered registry in order of registration.
 *
 * @returns {string[]}
 */
export function getPluginsNames() {
  return [
    ...getOrderedPluginsNames(),
    ...getUnorderedPluginsNames(),
  ];
}
/**
 * Gets registered plugin's class by passed name.
 *
 * @param {string} pluginName Plugin's name.
 * @returns {BasePlugin}
 * @throws Will throw an error if there is no registered plugin on a passed name.
 */
export function getPlugin(pluginName) {
  const correctedPluginName = toUpperCaseFirst(pluginName);

  if (!pluginsRegistry.has(correctedPluginName)) {
    throw Error(`There is no registered ${correctedPluginName} plugin`);
  }

  return pluginsRegistry.get(correctedPluginName);
}
/**
 * Registers plugin under given name.
 *
 * @param {string} pluginName The plugin name.
 * @param {Function} pluginClass The plugin class.
 * @param {number} [priority] The plugin priority.
 */
export function registerPlugin(pluginName, pluginClass, priority) {
  const correctedPluginName = toUpperCaseFirst(pluginName);

  addToPluginsRegistry(correctedPluginName, pluginClass);

  if (priority === void 0) {
    registerUnorderedPlugin(correctedPluginName);
  } else {
    registerOrderedPlugin(correctedPluginName, priority);
  }
}
