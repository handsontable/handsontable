/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes
 */
import Handsontable from './browser';
import {objectEach} from './helpers/object';
import {toUpperCaseFirst} from './helpers/string';

const registeredPlugins = new WeakMap();

/**
 * Registers plugin under given name
 *
 * @param {String} pluginName
 * @param {Function} PluginClass
 */
function registerPlugin(pluginName, PluginClass) {
  pluginName = toUpperCaseFirst(pluginName);

  Handsontable.plugins[pluginName] = PluginClass;

  Handsontable.hooks.add('construct', function() {
    let holder;

    if (!registeredPlugins.has(this)) {
      registeredPlugins.set(this, {});
    }
    holder = registeredPlugins.get(this);

    if (!holder[pluginName]) {
      holder[pluginName] = new PluginClass(this);
    }
  });
  Handsontable.hooks.add('afterDestroy', function() {
    if (registeredPlugins.has(this)) {
      let pluginsHolder = registeredPlugins.get(this);

      objectEach(pluginsHolder, (plugin) => plugin.destroy());
      registeredPlugins.delete(this);
    }
  });
}

/**
 * @param {Object} instance
 * @param {String|Function} pluginName
 * @returns {Function} pluginClass Returns plugin instance if exists or `undefined` if not exists.
 */
function getPlugin(instance, pluginName) {
  if (typeof pluginName != 'string') {
    throw Error('Only strings can be passed as "plugin" parameter');
  }
  let _pluginName = toUpperCaseFirst(pluginName);

  if (!registeredPlugins.has(instance) || !registeredPlugins.get(instance)[_pluginName]) {
    return void 0;
  }

  return registeredPlugins.get(instance)[_pluginName];
}

/**
 * Get all registred plugins names for concrete Handsontable instance.
 *
 * @param {Object} hotInstance
 * @returns {Array}
 */
function getRegistredPluginNames(hotInstance) {
  return registeredPlugins.has(hotInstance) ? Object.keys(registeredPlugins.get(hotInstance)) : [];
}

/**
 * Get plugin name.
 *
 * @param {Object} hotInstance
 * @param {Object} plugin
 * @returns {String|null}
 */
function getPluginName(hotInstance, plugin) {
  let pluginName = null;

  if (registeredPlugins.has(hotInstance)) {
    objectEach(registeredPlugins.get(hotInstance), (pluginInstance, name) => {
      if (pluginInstance === plugin) {
        pluginName = name;
      }
    });
  }

  return pluginName;
}

export {registerPlugin, getPlugin, getRegistredPluginNames, getPluginName};
