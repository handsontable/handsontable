import { arrayEach } from '../../helpers/array';
import { substitute } from '../../helpers/string';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { fastCall } from '../../helpers/function';
import { REGISTERED_HOOKS, REMOVED_HOOKS, DEPRECATED_HOOKS } from './constants';
import { HooksBucket } from './bucket';

/**
 * Template warning message for removed hooks.
 *
 * @type {string}
 */
const REMOVED_MESSAGE = toSingleLine`The plugin hook "[hookName]" was removed in Handsontable [removedInVersion].\x20
  Please consult release notes https://github.com/handsontable/handsontable/releases/tag/[removedInVersion] to\x20
  learn about the migration path.`;

export class Hooks {
  static getSingleton() {
    return getGlobalSingleton();
  }

  /**
   * @type {HooksBucket}
   */
  globalBucket = new HooksBucket();

  /**
   * Get hook bucket based on the context of the object or if argument is missing, get the global hook bucket.
   *
   * @param {object} [context=null] A Handsontable instance.
   * @returns {HooksBucket} Returns a global or Handsontable instance bucket.
   */
  getBucket(context = null) {
    if (context) {
      if (!context.pluginHookBucket) {
        context.pluginHookBucket = new HooksBucket();
      }

      return context.pluginHookBucket;
    }

    return this.globalBucket;
  }

  /**
   * Adds a listener (globally or locally) to a specified hook name.
   * If the `context` parameter is provided, the hook will be added only to the instance it references.
   * Otherwise, the callback will be used every time the hook fires on any Handsontable instance.
   * You can provide an array of callback functions as the `callback` argument, this way they will all be fired
   * once the hook is triggered.
   *
   * @param {string} key Hook name.
   * @param {Function|Function[]} callback Callback function or an array of functions.
   * @param {object} [context=null] The context for the hook callback to be added - a Handsontable instance or leave empty.
   * @param {number} [orderIndex] Order index of the callback.
   *                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.
   *                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.
   *                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes.
   * @returns {Hooks} Instance of Hooks.
   *
   * @example
   * ```js
   * // single callback, added locally
   * Handsontable.hooks.add('beforeInit', myCallback, hotInstance);
   *
   * // single callback, added globally
   * Handsontable.hooks.add('beforeInit', myCallback);
   *
   * // multiple callbacks, added locally
   * Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback], hotInstance);
   *
   * // multiple callbacks, added globally
   * Handsontable.hooks.add('beforeInit', [myCallback, anotherCallback]);
   * ```
   */
  add(key, callback, context = null, orderIndex) {
    if (Array.isArray(callback)) {
      arrayEach(callback, c => this.add(key, c, context));
    } else {

      if (REMOVED_HOOKS.has(key)) {
        warn(substitute(REMOVED_MESSAGE, { hookName: key, removedInVersion: REMOVED_HOOKS.get(key) }));
      }
      if (DEPRECATED_HOOKS.has(key)) {
        warn(DEPRECATED_HOOKS.get(key));
      }

      this.getBucket(context).add(key, callback, { orderIndex, runOnce: false });
    }

    return this;
  }

  /**
   * Adds a listener to a specified hook. After the hook runs this listener will be automatically removed from the bucket.
   *
   * @param {string} key Hook/Event name.
   * @param {Function|Function[]} callback Callback function.
   * @param {object} [context=null] A Handsontable instance.
   * @param {number} [orderIndex] Order index of the callback.
   *                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.
   *                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.
   *                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes.
   * @returns {Hooks} Instance of Hooks.
   *
   * @example
   * ```js
   * Handsontable.hooks.once('beforeInit', myCallback, hotInstance);
   * ```
   */
  once(key, callback, context = null, orderIndex) {
    if (Array.isArray(callback)) {
      arrayEach(callback, c => this.once(key, c, context));
    } else {
      this.getBucket(context).add(key, callback, { orderIndex, runOnce: true });
    }

    return this;
  }

  /**
   * Adds a listener to a specified hook. The added hook stays in the bucket at specified index position even after
   * adding another one with the same hook name.
   *
   * @param {string} key Hook/Event name.
   * @param {Function|Function[]} callback Callback function.
   * @param {object} [context=null] A Handsontable instance.
   * @returns {Hooks} Instance of Hooks.
   *
   * @example
   * ```js
   * Handsontable.hooks.addAsFixed('beforeInit', myCallback, hotInstance);
   * ```
   */
  addAsFixed(key, callback, context = null) {
    if (Array.isArray(callback)) {
      arrayEach(callback, c => this.addAsFixed(key, c, context));
    } else {
      this.getBucket(context).add(key, callback, { initialHook: true });
    }

    return this;
  }

  /**
   * Removes a listener from a hook with a given name. If the `context` argument is provided, it removes a listener from a local hook assigned to the given Handsontable instance.
   *
   * @param {string} key Hook/Event name.
   * @param {Function} callback Callback function (needs the be the function that was previously added to the hook).
   * @param {object} [context=null] Handsontable instance.
   * @returns {boolean} Returns `true` if hook was removed, `false` otherwise.
   *
   * @example
   * ```js
   * Handsontable.hooks.remove('beforeInit', myCallback);
   * ```
   */
  remove(key, callback, context = null) {
    return this.getBucket(context).remove(key, callback);
  }

  /**
   * Checks whether there are any registered listeners for the provided hook name.
   * If the `context` parameter is provided, it only checks for listeners assigned to the given Handsontable instance.
   *
   * @param {string} key Hook name.
   * @param {object} [context=null] A Handsontable instance.
   * @returns {boolean} `true` for success, `false` otherwise.
   */
  has(key, context = null) {
    return this.getBucket(context).has(key);
  }

  /**
   * Runs all local and global callbacks assigned to the hook identified by the `key` parameter.
   * It returns either a return value from the last called callback or the first parameter (`p1`) passed to the `run` function.
   *
   * @param {object} context Handsontable instance.
   * @param {string} key Hook/Event name.
   * @param {*} [p1] Parameter to be passed as an argument to the callback function.
   * @param {*} [p2] Parameter to be passed as an argument to the callback function.
   * @param {*} [p3] Parameter to be passed as an argument to the callback function.
   * @param {*} [p4] Parameter to be passed as an argument to the callback function.
   * @param {*} [p5] Parameter to be passed as an argument to the callback function.
   * @param {*} [p6] Parameter to be passed as an argument to the callback function.
   * @returns {*} Either a return value from the last called callback or `p1`.
   *
   * @example
   * ```js
   * Handsontable.hooks.run(hot, 'beforeInit');
   * ```
   */
  run(context, key, p1, p2, p3, p4, p5, p6) {
    {
      const globalHandlers = this.getBucket().getHooks(key);
      const length = globalHandlers ? globalHandlers.length : 0;
      let index = 0;

      if (length) {
        // Do not optimize this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (index < length) {
          if (!globalHandlers[index] || globalHandlers[index].skip) {
            index += 1;
            /* eslint-disable no-continue */
            continue;
          }

          const res = fastCall(globalHandlers[index].callback, context, p1, p2, p3, p4, p5, p6);

          if (res !== undefined) {
            // eslint-disable-next-line no-param-reassign
            p1 = res;
          }
          if (globalHandlers[index] && globalHandlers[index].runOnce) {
            this.remove(key, globalHandlers[index].callback);
          }

          index += 1;
        }
      }
    }
    {
      const localHandlers = this.getBucket(context).getHooks(key);
      const length = localHandlers ? localHandlers.length : 0;
      let index = 0;

      if (length) {
        // Do not optimize this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (index < length) {
          if (!localHandlers[index] || localHandlers[index].skip) {
            index += 1;
            /* eslint-disable no-continue */
            continue;
          }

          const res = fastCall(localHandlers[index].callback, context, p1, p2, p3, p4, p5, p6);

          if (res !== undefined) {
            // eslint-disable-next-line no-param-reassign
            p1 = res;
          }

          if (localHandlers[index] && localHandlers[index].runOnce) {
            this.remove(key, localHandlers[index].callback, context);
          }

          index += 1;
        }
      }
    }

    return p1;
  }

  /**
   * Destroy all listeners connected to the context. If no context is provided, the global listeners will be destroyed.
   *
   * @param {object} [context=null] A Handsontable instance.
   * @example
   * ```js
   * // destroy the global listeners
   * Handsontable.hooks.destroy();
   *
   * // destroy the local listeners
   * Handsontable.hooks.destroy(hotInstance);
   * ```
   */
  destroy(context = null) {
    this.getBucket(context).destroy();
  }

  /**
   * Registers a hook name (adds it to the list of the known hook names). Used by plugins.
   * It is not necessary to call register, but if you use it, your plugin hook will be used returned by
   * the `getRegistered` method. (which itself is used in the [demo](@/guides/getting-started/events-and-hooks/events-and-hooks.md)).
   *
   * @param {string} key The hook name.
   *
   * @example
   * ```js
   * Handsontable.hooks.register('myHook');
   * ```
   */
  register(key) {
    if (!this.isRegistered(key)) {
      REGISTERED_HOOKS.push(key);
    }
  }

  /**
   * Deregisters a hook name (removes it from the list of known hook names).
   *
   * @param {string} key The hook name.
   *
   * @example
   * ```js
   * Handsontable.hooks.deregister('myHook');
   * ```
   */
  deregister(key) {
    if (this.isRegistered(key)) {
      REGISTERED_HOOKS.splice(REGISTERED_HOOKS.indexOf(key), 1);
    }
  }

  /**
   * Returns a boolean value depending on if a hook by such name has been removed or deprecated.
   *
   * @param {string} hookName The hook name to check.
   * @returns {boolean} Returns `true` if the provided hook name was marked as deprecated or
   * removed from API, `false` otherwise.
   * @example
   * ```js
   * Handsontable.hooks.isDeprecated('skipLengthCache');
   *
   * // Results:
   * true
   * ```
   */
  isDeprecated(hookName) {
    return DEPRECATED_HOOKS.has(hookName) || REMOVED_HOOKS.has(hookName);
  }

  /**
   * Returns a boolean depending on if a hook by such name has been registered.
   *
   * @param {string} hookName The hook name to check.
   * @returns {boolean} `true` for success, `false` otherwise.
   * @example
   * ```js
   * Handsontable.hooks.isRegistered('beforeInit');
   *
   * // Results:
   * true
   * ```
   */
  isRegistered(hookName) {
    return REGISTERED_HOOKS.indexOf(hookName) >= 0;
  }

  /**
   * Returns an array of registered hooks.
   *
   * @returns {Array} An array of registered hooks.
   *
   * @example
   * ```js
   * Handsontable.hooks.getRegistered();
   *
   * // Results:
   * [
   * ...
   *   'beforeInit',
   *   'beforeRender',
   *   'beforeSetRangeEnd',
   *   'beforeDrawBorders',
   *   'beforeChange',
   * ...
   * ]
   * ```
   */
  getRegistered() {
    return REGISTERED_HOOKS;
  }
}

const globalSingleton = new Hooks();

/**
 * @returns {Hooks}
 */
function getGlobalSingleton() {
  return globalSingleton;
}

export default Hooks;
