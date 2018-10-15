'use strict';

exports.__esModule = true;

var _array = require('./../helpers/array');

var _object = require('./../helpers/object');

var MIXIN_NAME = 'localHooks';

/**
 * Mixin object to extend objects functionality for local hooks.
 *
 * @type {Object}
 */
var localHooks = {
  /**
   * Internal hooks storage.
   */
  _localHooks: Object.create(null),

  /**
   * Add hook to the collection.
   *
   * @param {String} key Hook name.
   * @param {Function} callback Hook callback
   * @returns {Object}
   */
  addLocalHook: function addLocalHook(key, callback) {
    if (!this._localHooks[key]) {
      this._localHooks[key] = [];
    }
    this._localHooks[key].push(callback);

    return this;
  },


  /**
   * Run hooks.
   *
   * @param {String} key Hook name.
   * @param {*} params
   */
  runLocalHooks: function runLocalHooks(key) {
    var _this = this;

    for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }

    if (this._localHooks[key]) {
      (0, _array.arrayEach)(this._localHooks[key], function (callback) {
        return callback.apply(_this, params);
      });
    }
  },


  /**
   * Clear all added hooks.
   *
   * @returns {Object}
   */
  clearLocalHooks: function clearLocalHooks() {
    this._localHooks = {};

    return this;
  }
};

(0, _object.defineGetter)(localHooks, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false
});

exports.default = localHooks;