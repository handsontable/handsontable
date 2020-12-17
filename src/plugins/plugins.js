/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes.
 */
import { toUpperCaseFirst } from '../helpers/string';
import { createPriorityQueue } from '../utils/dataStructures/priorityQueue';
import { createUniqueList } from '../utils/dataStructures/uniqueList';
import { createUniqueQueue } from '../utils/dataStructures/uniqueQueue';

const ERROR_PLUGIN_REGISTERED = pluginName => `There is already registered "${pluginName}" plugin.`;
const ERROR_PRIORITY_REGISTERED = priority => `There is already registered plugin on priority "${priority}".`;
const ERROR_PRIORITY_NAN = priority => `The priority "${priority}" is not a number.`;

/**
 * Stores plugins names' queue with they priorities.
 */
const priorityPluginsQueue = createPriorityQueue({
  errorPriorityExists: ERROR_PRIORITY_REGISTERED,
  errorPriorityNaN: ERROR_PRIORITY_NAN,
});
/**
 * Stores plugins names' queue by registration order.
 */
const uniquePluginsQueue = createUniqueQueue({
  errorItemExists: ERROR_PLUGIN_REGISTERED,
});
/**
 * Stores plugins references between theirs' name and class.
 */
const uniquePluginsList = createUniqueList({
  errorIdExists: ERROR_PLUGIN_REGISTERED,
});

/**
 * Gets registered plugins' names with an appropriate order.
 * First ordered plugins by their ascending priority.
 * Then plugins from the unordered registry in order of registration.
 *
 * @returns {string[]}
 */
export function getPluginsNames() {
  return [
    ...priorityPluginsQueue.getItems(),
    ...uniquePluginsQueue.getItems(),
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
  const unifiedPluginName = toUpperCaseFirst(pluginName);

  return uniquePluginsList.getItem(unifiedPluginName);
}
/**
 * Registers plugin under given name.
 *
 * @param {string|Function} pluginName The plugin name or plugin class.
 * @param {Function} [pluginClass] The plugin class.
 * @param {number} [priority] The plugin priority.
 */
export function registerPlugin(pluginName, pluginClass, priority) {
  let name = pluginName;

  if (typeof pluginName === 'function') {
    pluginClass = pluginName;
    name = pluginClass.PLUGIN_KEY;
    priority = pluginClass.PLUGIN_PRIORITY;
  }

  const unifiedPluginName = toUpperCaseFirst(name);

  if (uniquePluginsList.hasItem(unifiedPluginName)) {
    throw new Error(ERROR_PLUGIN_REGISTERED(unifiedPluginName));
  }

  if (priority === void 0) {
    uniquePluginsQueue.addItem(unifiedPluginName);
  } else {
    priorityPluginsQueue.addItem(priority, unifiedPluginName);
  }

  uniquePluginsList.addItem(unifiedPluginName, pluginClass);
}
