'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _base = require('./../_base');

var _base2 = _interopRequireDefault(_base);

var _plugins = require('./../../plugins');

var _storage = require('./storage');

var _storage2 = _interopRequireDefault(_storage);

var _pluginHooks = require('./../../pluginHooks');

var _pluginHooks2 = _interopRequireDefault(_pluginHooks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

_pluginHooks2.default.getSingleton().register('persistentStateSave');
_pluginHooks2.default.getSingleton().register('persistentStateLoad');
_pluginHooks2.default.getSingleton().register('persistentStateReset');

/**
 * @plugin PersistentState
 *
 * @description
 * Save the state of column sorting, column positions and column sizes in local storage to preserve table state
 * between page reloads.
 *
 * In order to enable data storage mechanism, {@link Options#persistentState} option must be set to `true`.
 *
 * When persistentState is enabled it exposes 3 hooks:
 * - {@link Hooks#persistentStateSave} - Saves value under given key in browser local storage.
 * - {@link Hooks#persistentStateLoad} - Loads value, saved under given key, from browser local storage. The loaded
 * value will be saved in `saveTo.value`.
 * - {@link Hooks#persistentStateReset} - Clears the value saved under key. If no key is given, all values associated
 * with table will be cleared.
 */

var PersistentState = function (_BasePlugin) {
  _inherits(PersistentState, _BasePlugin);

  function PersistentState(hotInstance) {
    _classCallCheck(this, PersistentState);

    /**
     * Instance of {@link Storage}.
     *
     * @private
     * @type {Storage}
     */
    var _this = _possibleConstructorReturn(this, (PersistentState.__proto__ || Object.getPrototypeOf(PersistentState)).call(this, hotInstance));

    _this.storage = void 0;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link PersistentState#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(PersistentState, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return !!this.hot.getSettings().persistentState;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }

      if (!this.storage) {
        this.storage = new _storage2.default(this.hot.rootElement.id);
      }

      this.addHook('persistentStateSave', function (key, value) {
        return _this2.saveValue(key, value);
      });
      this.addHook('persistentStateLoad', function (key, saveTo) {
        return _this2.loadValue(key, saveTo);
      });
      this.addHook('persistentStateReset', function () {
        return _this2.resetValue();
      });

      _get(PersistentState.prototype.__proto__ || Object.getPrototypeOf(PersistentState.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      this.storage = void 0;

      _get(PersistentState.prototype.__proto__ || Object.getPrototypeOf(PersistentState.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.disablePlugin();
      this.enablePlugin();

      _get(PersistentState.prototype.__proto__ || Object.getPrototypeOf(PersistentState.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Loads the value from local storage.
     *
     * @param {String} key Storage key.
     * @param {Object} saveTo Saved value from local storage.
     */

  }, {
    key: 'loadValue',
    value: function loadValue(key, saveTo) {
      saveTo.value = this.storage.loadValue(key);
    }

    /**
     * Saves the data to local storage.
     *
     * @param {String} key Storage key.
     * @param {Mixed} value Value to save.
     */

  }, {
    key: 'saveValue',
    value: function saveValue(key, value) {
      this.storage.saveValue(key, value);
    }

    /**
     * Resets the data or all data from local storage.
     *
     * @param {String} key [optional] Storage key.
     */

  }, {
    key: 'resetValue',
    value: function resetValue(key) {
      if (typeof key === 'undefined') {
        this.storage.resetAll();
      } else {
        this.storage.reset(key);
      }
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      _get(PersistentState.prototype.__proto__ || Object.getPrototypeOf(PersistentState.prototype), 'destroy', this).call(this);
    }
  }]);

  return PersistentState;
}(_base2.default);

(0, _plugins.registerPlugin)('persistentState', PersistentState);

exports.default = PersistentState;