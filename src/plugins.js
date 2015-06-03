/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes
 */

export {registerPlugin, getPlugin};

var registeredPlugins = new WeakMap();

/**
 * Registers plugin under given name
 *
 * @param {String} pluginName
 * @param {Function} PluginClass
 */
function registerPlugin(pluginName, PluginClass) {
  Handsontable.hooks.add('beforeInit', function () {
    var holder;

    pluginName = pluginName.toLowerCase();

    if (!registeredPlugins.has(this)) {
      registeredPlugins.set(this, {});
    }
    holder = registeredPlugins.get(this);

    if (!holder[pluginName]) {
      holder[pluginName] = new PluginClass(this);
    }
  });
  Handsontable.hooks.add('afterDestroy', function () {
    var i, pluginsHolder;

    if (registeredPlugins.has(this)) {
      pluginsHolder = registeredPlugins.get(this);

      for (i in pluginsHolder) {
        if (pluginsHolder.hasOwnProperty(i)) {
          pluginsHolder[i].destroy();
        }
      }
      registeredPlugins.delete(this);
    }
  });
}

/**
 * @param {Object} instance
 * @param {String|Function} pluginName
 * @returns {Function} pluginClass
 */
function getPlugin(instance, pluginName) {
  if (typeof pluginName != 'string'){
    throw Error('Only strings can be passed as "plugin" parameter');
  }
  let _pluginName = pluginName.toLowerCase();

  if (!registeredPlugins.has(instance) || !registeredPlugins.get(instance)[_pluginName]) {
    throw Error('No plugin registered under name "' + pluginName + '"');
  }

  return registeredPlugins.get(instance)[_pluginName];
}
