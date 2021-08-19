import { defineGetter } from './../helpers/object';
import { fastCall } from './../helpers/function';

const MIXIN_NAME = 'localHooks';

/**
 * Mixin object to extend objects functionality for local hooks.
 *
 * @type {object}
 */
const localHooks = {
  /**
   * Internal hooks storage.
   */
  _localHooks: Object.create(null),

  /**
   * Add hook to the collection.
   *
   * @param {string} key The hook name.
   * @param {Function} callback The hook callback.
   * @returns {object}
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
   * @param {string} key The hook name.
   * @param {*} [arg1] Additional parameter passed to callback function.
   * @param {*} [arg2] Additional parameter passed to callback function.
   * @param {*} [arg3] Additional parameter passed to callback function.
   * @param {*} [arg4] Additional parameter passed to callback function.
   * @param {*} [arg5] Additional parameter passed to callback function.
   * @param {*} [arg6] Additional parameter passed to callback function.
   */
  runLocalHooks(key, arg1, arg2, arg3, arg4, arg5, arg6) {
    if (this._localHooks[key]) {
      const length = this._localHooks[key].length;

      // Do not optimize this loop with the arrayEach or arrow function! If you do, You'll
      // decrease perf because of GC. The "...rest" ES6+ syntax as well decreases the performance.
      for (let i = 0; i < length; i++) {
        fastCall(this._localHooks[key][i], this, arg1, arg2, arg3, arg4, arg5, arg6);
      }
    }
  },

  /**
   * Clear all added hooks.
   *
   * @returns {object}
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
