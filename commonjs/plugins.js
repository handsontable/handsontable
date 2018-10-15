'use strict';

exports.__esModule = true;
exports.getPluginName = exports.getRegistredPluginNames = exports.getPlugin = exports.registerPlugin = undefined;

var _pluginHooks = require('./pluginHooks');

var _pluginHooks2 = _interopRequireDefault(_pluginHooks);

var _object = require('./helpers/object');

var _string = require('./helpers/string');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var registeredPlugins = new WeakMap();

/**
 * Registers plugin under given name
 *
 * @param {String} pluginName
 * @param {Function} PluginClass
 */
/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes
 */
function registerPlugin(pluginName, PluginClass) {
  var correctedPluginName = (0, _string.toUpperCaseFirst)(pluginName);

  _pluginHooks2.default.getSingleton().add('construct', function () {
    if (!registeredPlugins.has(this)) {
      registeredPlugins.set(this, {});
    }

    var holder = registeredPlugins.get(this);

    if (!holder[correctedPluginName]) {
      holder[correctedPluginName] = new PluginClass(this);
    }
  });
  _pluginHooks2.default.getSingleton().add('afterDestroy', function () {
    if (registeredPlugins.has(this)) {
      var pluginsHolder = registeredPlugins.get(this);

      (0, _object.objectEach)(pluginsHolder, function (plugin) {
        return plugin.destroy();
      });
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
  if (typeof pluginName !== 'string') {
    throw Error('Only strings can be passed as "plugin" parameter');
  }
  var _pluginName = (0, _string.toUpperCaseFirst)(pluginName);

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
  var pluginName = null;

  if (registeredPlugins.has(hotInstance)) {
    (0, _object.objectEach)(registeredPlugins.get(hotInstance), function (pluginInstance, name) {
      if (pluginInstance === plugin) {
        pluginName = name;
      }
    });
  }

  return pluginName;
}

exports.registerPlugin = registerPlugin;
exports.getPlugin = getPlugin;
exports.getRegistredPluginNames = getRegistredPluginNames;
exports.getPluginName = getPluginName;