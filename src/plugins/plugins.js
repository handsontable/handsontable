/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes.
 */
import { toUpperCaseFirst } from '../helpers/string';

const orderedPluginsRegistry = new Map();
const unorderedPluginsRegistry = new Set();
const pluginsRegistry = new Map();

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
 * Gets registered plugins' classes with appropiated order.
 * First ordered plugins by their ascending priority.
 * Then plugins from the unordered registry in order of registration.
 *
 * @returns {BasePlugin[]}
 */
export function getPlugins() {
  const pluginsNames = getPluginsNames();

  return pluginsNames.map(pluginName => pluginsRegistry.get(pluginName));
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
 * @param {Function} PluginClass The plugin class.
 * @param {number} [priority] The plugin priority.
 */
export function registerPlugin(pluginName, PluginClass, priority) {
  const correctedPluginName = toUpperCaseFirst(pluginName);

  if (priority === void 0) {
    registerUnorderedPlugin(correctedPluginName);
  } else {
    registerOrderedPlugin(correctedPluginName, priority);
  }

  pluginsRegistry.set(correctedPluginName, PluginClass);

  // Hooks.getSingleton().add('contruct', function() {
  //   if (!registeredPlugins.has(tshis)) {
  //     registeredPlugins.set(this, {});
  //   }

  //   const holder = registeredPlugins.get(this);

  //   if (!holder[correctedPluginName]) {
  //     holder[correctedPluginName] = new PluginClass(this);
  //   }
  // });
  // Hooks.getSingleton().add('afterDestroy', function() {
  //   if (registeredPlugins.has(this)) {
  //     const pluginsHolder = registeredPlugins.get(this);

  //     objectEach(pluginsHolder, plugin => plugin.destroy());
  //     registeredPlugins.delete(this);
  //   }
  // });
}

// /**
//  * @param {Core} instance The Handsontable instance.
//  * @param {string} pluginName The plugin name.
//  * @returns {Function} PluginClass Returns plugin instance if exists or `undefined` if not exists.
//  */
// export function getPlugin(instance, pluginName) {
//   if (typeof pluginName !== 'string') {
//     throw Error('Only strings can be passed as "plugin" parameter');
//   }
//   const _pluginName = toUpperCaseFirst(pluginName);

//   if (!registeredPlugins.has(instance) || !registeredPlugins.get(instance)[_pluginName]) {
//     return void 0;
//   }

//   return registeredPlugins.get(instance)[_pluginName];
// }

// /**
//  * Get all registred plugins names for concrete Handsontable instance.
//  *
//  * @param {Core} hotInstance The Handsontable instance.
//  * @returns {Array}
//  */
// export function getRegistredPluginNames(hotInstance) {
//   return registeredPlugins.has(hotInstance) ? Object.keys(registeredPlugins.get(hotInstance)) : [];
// }
