import { defineGetter } from './../helpers/object';
import { fastCall } from './../helpers/function';
import { Constructor } from './constructor.type';

const MIXIN_NAME = 'localHooks';

/**
 * Mixin object to extend objects functionality for local hooks.
 *
 * @type {object}
 */
// This mixin adds a scale property, with getters and setters
// for changing it with an encapsulated private property:
 
function LocalHooksMixin<T extends Constructor>(Base: T) {
  return class LocalHooks extends Base {
    /**
     * Internal hooks storage.
     */
    _localHooks = Object.create(null);

    /**
     * Add hook to the collection.
     *
     * @param {string} key The hook name.
     * @param {Function} callback The hook callback.
     * @returns {object}
     */
    addLocalHook(key: string, callback: Function): LocalHooks {
      if (!this._localHooks[key]) {
        this._localHooks[key] = [];
      }
      this._localHooks[key].push(callback);

      return this;
    }

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
    runLocalHooks(key: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any): void {
      if (this._localHooks[key]) {
        const length = this._localHooks[key].length;

        // don't optimize this loop with the `arrayEach()` method or arrow functions
        // otherwise, performance will decrease because of garbage collection
        // using the `...rest` syntax (ES6 and later) will decrease performance as well
        for (let i = 0; i < length; i++) {
          fastCall(this._localHooks[key][i], this, arg1, arg2, arg3, arg4, arg5, arg6);
        }
      }
    }

    /**
     * Clear all added hooks.
     *
     * @returns {object}
     */
    clearLocalHooks(): LocalHooks {
      this._localHooks = {};

      return this;
    }
  }
};

defineGetter(LocalHooksMixin, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default LocalHooksMixin;
