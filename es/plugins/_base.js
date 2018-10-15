var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { defineGetter, objectEach } from './../helpers/object';
import { arrayEach } from './../helpers/array';
import { getTranslator } from './../utils/recordTranslator';
import { getRegistredPluginNames, getPluginName } from './../plugins';

var privatePool = new WeakMap();
var initializedPlugins = null;

/**
 * @util
 */

var BasePlugin = function () {
  /**
   * @param {Object} hotInstance Handsontable instance.
   */
  function BasePlugin(hotInstance) {
    var _this = this;

    _classCallCheck(this, BasePlugin);

    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    defineGetter(this, 'hot', hotInstance, {
      writable: false
    });
    defineGetter(this, 't', getTranslator(hotInstance), {
      writable: false
    });

    privatePool.set(this, { hooks: {} });
    initializedPlugins = null;

    this.pluginName = null;
    this.pluginsInitializedCallbacks = [];
    this.isPluginsReady = false;
    this.enabled = false;
    this.initialized = false;

    this.hot.addHook('afterPluginsInitialized', function () {
      return _this.onAfterPluginsInitialized();
    });
    this.hot.addHook('afterUpdateSettings', function (newSettings) {
      return _this.onUpdateSettings(newSettings);
    });
    this.hot.addHook('beforeInit', function () {
      return _this.init();
    });
  }

  _createClass(BasePlugin, [{
    key: 'init',
    value: function init() {
      this.pluginName = getPluginName(this.hot, this);

      if (this.isEnabled && this.isEnabled()) {
        this.enablePlugin();
      }
      if (!initializedPlugins) {
        initializedPlugins = getRegistredPluginNames(this.hot);
      }
      if (initializedPlugins.indexOf(this.pluginName) >= 0) {
        initializedPlugins.splice(initializedPlugins.indexOf(this.pluginName), 1);
      }
      if (!initializedPlugins.length) {
        this.hot.runHooks('afterPluginsInitialized');
      }
      this.initialized = true;
    }

    /**
     * Enable plugin for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      this.enabled = true;
    }

    /**
     * Disable plugin for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      if (this.eventManager) {
        this.eventManager.clear();
      }
      this.clearHooks();
      this.enabled = false;
    }

    /**
     * Add listener to plugin hooks system.
     *
     * @param {String} name
     * @param {Function} callback
     */

  }, {
    key: 'addHook',
    value: function addHook(name, callback) {
      privatePool.get(this).hooks[name] = privatePool.get(this).hooks[name] || [];

      var hooks = privatePool.get(this).hooks[name];

      this.hot.addHook(name, callback);
      hooks.push(callback);
      privatePool.get(this).hooks[name] = hooks;
    }

    /**
     * Remove all hooks listeners by hook name.
     *
     * @param {String} name
     */

  }, {
    key: 'removeHooks',
    value: function removeHooks(name) {
      var _this2 = this;

      arrayEach(privatePool.get(this).hooks[name] || [], function (callback) {
        _this2.hot.removeHook(name, callback);
      });
    }

    /**
     * Clear all hooks.
     */

  }, {
    key: 'clearHooks',
    value: function clearHooks() {
      var _this3 = this;

      var hooks = privatePool.get(this).hooks;

      objectEach(hooks, function (callbacks, name) {
        return _this3.removeHooks(name);
      });
      hooks.length = 0;
    }

    /**
     * Register function which will be immediately called after all plugins initialized.
     *
     * @param {Function} callback
     */

  }, {
    key: 'callOnPluginsReady',
    value: function callOnPluginsReady(callback) {
      if (this.isPluginsReady) {
        callback();
      } else {
        this.pluginsInitializedCallbacks.push(callback);
      }
    }

    /**
     * On after plugins initialized listener.
     *
     * @private
     */

  }, {
    key: 'onAfterPluginsInitialized',
    value: function onAfterPluginsInitialized() {
      arrayEach(this.pluginsInitializedCallbacks, function (callback) {
        return callback();
      });
      this.pluginsInitializedCallbacks.length = 0;
      this.isPluginsReady = true;
    }

    /**
     * On update settings listener.
     *
     * @private
     */

  }, {
    key: 'onUpdateSettings',
    value: function onUpdateSettings() {
      if (this.isEnabled) {
        if (this.enabled && !this.isEnabled()) {
          this.disablePlugin();
        }
        if (!this.enabled && this.isEnabled()) {
          this.enablePlugin();
        }
        if (this.enabled && this.isEnabled()) {
          this.updatePlugin();
        }
      }
    }

    /**
     * Updates the plugin to use the latest options you have specified.
     *
     * @private
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {}

    /**
     * Destroy plugin.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      var _this4 = this;

      if (this.eventManager) {
        this.eventManager.destroy();
      }
      this.clearHooks();

      objectEach(this, function (value, property) {
        if (property !== 'hot' && property !== 't') {
          _this4[property] = null;
        }
      });
      delete this.t;
      delete this.hot;
    }
  }]);

  return BasePlugin;
}();

export default BasePlugin;