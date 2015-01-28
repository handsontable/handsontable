/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes
 */

export {registerPlugin, getPlugin};

var registeredPlugins = {};

// support for older versions of Handsontable
//Handsontable.plugins = Handsontable.plugins || {};

/**
 * Registers plugin under given name
 *
 * @param {String} pluginName
 * @param {Function} PluginClass
 */
function registerPlugin(pluginName, PluginClass) {
  var plugin;

  if (registeredPlugins[pluginName]) {
    throw Error('Plugin "' + pluginName + '" is already registered');
  }
  plugin = new PluginClass();

  Handsontable.hooks.add('beforeInit', function () {
    plugin.beforeInit(this);
  });
  registeredPlugins[pluginName] = plugin;

  // support for older versions of Handsontable
  //Handsontable.plugins[helper.toUpperCaseFirst(PluginClass.name)] = PluginClass;
}

/**
 * @param {String|Function} pluginName
 * @returns {Function} pluginClass
 */
function getPlugin(pluginName) {
  if (typeof pluginName != 'string'){
    throw Error('Only strings can be passed as "plugin" parameter');
  }

  if (!(pluginName in registeredPlugins)) {
    throw Error('No plugin registered under name "' + pluginName + '"');
  }

  return registeredPlugins[pluginName];
}
