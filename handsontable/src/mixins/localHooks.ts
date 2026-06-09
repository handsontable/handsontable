import { defineGetter } from './../helpers/object';
import { fastCall } from './../helpers/function';

const MIXIN_NAME = 'localHooks';

interface LocalHooks {
  _localHooks: Record<string, Function[]>;
  addLocalHook(key: string, callback: Function): this;
  removeLocalHook(key: string, callback: Function): this;
  runLocalHooks(key: string,
                arg1?: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown, arg5?: unknown, arg6?: unknown): void;
  clearLocalHooks(): this;
}

/**
 * Mixin object to extend objects functionality for local hooks.
 *
 * @type {object}
 */
const localHooks: LocalHooks = {
  /**
   * Internal hooks storage.
   */
  _localHooks: Object.create(null) as Record<string, Function[]>,

  /**
   * Add hook to the collection.
   *
   * @param {string} key The hook name.
   * @param {Function} callback The hook callback.
   * @returns {object}
   */
  addLocalHook(this: LocalHooks, key: string, callback: Function): LocalHooks {
    if (!this._localHooks[key]) {
      this._localHooks[key] = [];
    }
    this._localHooks[key].push(callback);

    return this;
  },

  /**
   * Removes the hook name associated with the callback function.
   *
   * @param {string} key The hook name.
   * @param {*} callback The hook callback.
   * @returns {object}
   */
  removeLocalHook(this: LocalHooks, key: string, callback: Function): LocalHooks {
    if (this._localHooks[key]) {
      const index = this._localHooks[key].indexOf(callback);

      if (index > -1) {
        this._localHooks[key].splice(index, 1);
      }
    }

    return this;
  },

  /**
   * Run hooks.
   *
   * @param {string} key The name of the hook to run.
   * @param {*} [arg1] An additional parameter passed to the callback function.
   * @param {*} [arg2] An additional parameter passed to the callback function.
   * @param {*} [arg3] An additional parameter passed to the callback function.
   * @param {*} [arg4] An additional parameter passed to the callback function.
   * @param {*} [arg5] An additional parameter passed to the callback function.
   * @param {*} [arg6] An additional parameter passed to the callback function.
   */
  runLocalHooks(this: LocalHooks, key: string,
                arg1?: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown, arg5?: unknown, arg6?: unknown) {
    if (this._localHooks[key]) {
      const length = this._localHooks[key].length;

      // don't optimize this loop with the `arrayEach()` method or arrow functions
      // otherwise, performance will decrease because of garbage collection
      // using the `...rest` syntax (ES6 and later) will decrease performance as well
      for (let i = 0; i < length; i++) {
        fastCall(this._localHooks[key][i] as (...args: unknown[]) => unknown, this, arg1, arg2, arg3, arg4, arg5, arg6);
      }
    }
  },

  /**
   * Clear all added hooks.
   *
   * @returns {object}
   */
  clearLocalHooks(this: LocalHooks): LocalHooks {
    this._localHooks = {};

    return this;
  },
};

defineGetter(localHooks, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default localHooks;
