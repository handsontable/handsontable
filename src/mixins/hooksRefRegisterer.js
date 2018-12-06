import { arrayEach } from './../helpers/array';
import { defineGetter, objectEach } from './../helpers/object';

const MIXIN_NAME = 'hooksRefRegisterer';

/**
 * Mixin object to extend objects functionality for auto registering hooks in an Handsontable instance.
 *
 * @type {Object}
 */
const hooksRefRegisterer = {
  /**
   * Internal hooks storage.
   */
  _hooksStorage: Object.create(null),

  /**
   * Add hook to the collection.
   *
   * @param {String} key Hook name.
   * @param {Function} callback Hook callback
   * @returns {Object}
   */
  addHook(key, callback) {
    if (!this._hooksStorage[key]) {
      this._hooksStorage[key] = [];
    }

    this.hot.addHook(key, callback);
    this._hooksStorage[key].push(callback);

    return this;
  },

  /**
   * Remove all hooks listeners by hook name.
   *
   * @param {String} key
   */
  removeHooksByKey(key) {
    arrayEach(this._hooksStorage[key] || [], (callback) => {
      this.hot.removeHook(key, callback);
    });
  },

  /**
   * Clear all added hooks.
   */
  clearHooks() {
    objectEach(this._hooksStorage, (callbacks, name) => this.removeHooksByKey(name));

    this._hooksStorage = {};
  },
};

defineGetter(hooksRefRegisterer, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default hooksRefRegisterer;
