import { arrayEach } from './../helpers/array';
import { defineGetter } from './../helpers/object';

const MIXIN_NAME = 'localHooks';

/**
 * Mixin object to extend objects functionality for local hooks.
 *
 * @type {Object}
 */
const localHooks = {
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
  addLocalHook(key, callback) {
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
  runLocalHooks(key, ...params) {
    if (this._localHooks[key]) {
      arrayEach(this._localHooks[key], callback => callback.apply(this, params));
    }
  },

  /**
   * Clear all added hooks.
   *
   * @returns {Object}
   */
  clearLocalHooks() {
    this._localHooks = {};

    return this;
  },
};

defineGetter(localHooks, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default localHooks;
