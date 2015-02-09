/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes
 */

export {registerPlugin, getPlugin};

var registeredPlugins = new WeakMap();

// support for older versions of Handsontable
//Handsontable.plugins = Handsontable.plugins || {};

/**
 * Registers plugin under given name
 *
 * @param {String} pluginName
 * @param {Function} PluginClass
 */
function registerPlugin(pluginName, PluginClass) {
  //if (registeredPlugins.has(pluginName)) {
  //  throw Error('Plugin "' + pluginName + '" is already registered');
  //}

  Handsontable.hooks.add('beforeInit', function () {
    var holder;

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
        if (pluginsHolder.hasOwnProperty(i) && pluginsHolder[i].destroy) {
          pluginsHolder[i].destroy();
        }
      }
      registeredPlugins.delete(this);
    }
  });
  // support for older versions of Handsontable
  //Handsontable.plugins[helper.toUpperCaseFirst(PluginClass.name)] = PluginClass;
}

/**
 * @param {String|Function} pluginName
 * @returns {Function} pluginClass
 */
function getPlugin(instance, pluginName) {
  if (typeof pluginName != 'string'){
    throw Error('Only strings can be passed as "plugin" parameter');
  }

  if (!registeredPlugins.has(instance) || !registeredPlugins.get(instance)[pluginName]) {
    throw Error('No plugin registered under name "' + pluginName + '"');
  }

  return registeredPlugins.get(instance)[pluginName];
}
