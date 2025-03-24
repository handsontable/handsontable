import { arrayEach } from '../../helpers/array';
import { substitute } from '../../helpers/string';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { fastCall } from '../../helpers/function';
import { AnyFunction } from '../../helpers/types';
import { REGISTERED_HOOKS, REMOVED_HOOKS, DEPRECATED_HOOKS } from './constants';
import { HooksBucket } from './bucket';
import Core from '../../core';

interface CoreInstance {
  pluginHookBucket?: HooksBucket;
  [key: string]: any;
}

/**
 * Template warning message for removed hooks.
 *
 * @type {string}
 */
const REMOVED_MESSAGE = toSingleLine`The plugin hook "[hookName]" was removed in Handsontable [removedInVersion].\x20
  Please consult release notes https://github.com/handsontable/handsontable/releases/tag/[removedInVersion] to\x20
  learn about the migration path.`;

export class Hooks {
  static getSingleton(): Hooks {
    return getGlobalSingleton();
  }

  /**
   * @type {HooksBucket}
   */
  globalBucket: HooksBucket = new HooksBucket();

  /**
   * Get hook bucket based on the context of the object or if argument is missing, get the global hook bucket.
   *
   * @param {object} [context=null] A Handsontable instance.
   * @returns {HooksBucket} Returns a global or Handsontable instance bucket.
   */
  getBucket(context: CoreInstance | null = null): HooksBucket {
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
   * @returns {void}
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
  add(key: string, callback: AnyFunction | AnyFunction[], context: CoreInstance | null = null, orderIndex?: number): void {
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
   * @returns {void}
   *
   * @example
   * ```js
   * Handsontable.hooks.once('beforeInit', myCallback, hotInstance);
   * ```
   */
  once(key: string, callback: AnyFunction | AnyFunction[], context: CoreInstance | null = null, orderIndex?: number): void {
    if (Array.isArray(callback)) {
      arrayEach(callback, c => this.once(key, c, context));
    } else {
      this.getBucket(context).add(key, callback, { orderIndex, runOnce: true });
    }
  }

  /**
   * Adds a listener to a specified hook. The added hook stays in the bucket at specified index position even after
   * adding another one with the same hook name.
   *
   * @param {string} key Hook/Event name.
   * @param {Function|Function[]} callback Callback function.
   * @param {object} [context=null] A Handsontable instance.
   * @returns {void}
   *
   * @example
   * ```js
   * Handsontable.hooks.addAsFixed('beforeInit', myCallback, hotInstance);
   * ```
   */
  addAsFixed(key: string, callback: AnyFunction | AnyFunction[], context: CoreInstance | null = null): void {
    if (Array.isArray(callback)) {
      arrayEach(callback, c => this.addAsFixed(key, c, context));
    } else {
      this.getBucket(context).add(key, callback, { initialHook: true });
    }
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
  remove(key: string, callback: AnyFunction, context: CoreInstance | null = null): boolean {
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
  has(key: string, context: CoreInstance | null = null): boolean {
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
  run(context: CoreInstance, key: string, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any, p6?: any): any {
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
   * Destroys the bucket.
   *
   * @param {object} [context=null] A Handsontable instance.
   */
  destroy(context: CoreInstance | null = null): void {
    this.getBucket(context).destroy();
  }

  /**
   * Registers a new hook.
   *
   * @param {string} key Hook name.
   */
  register(key: string): void {
    if (!REGISTERED_HOOKS.includes(key)) {
      REGISTERED_HOOKS.push(key);
    }
  }

  /**
   * Deregisters a hook.
   *
   * @param {string} key Hook name.
   */
  deregister(key: string): void {
    const index = REGISTERED_HOOKS.indexOf(key);
    if (index > -1) {
      REGISTERED_HOOKS.splice(index, 1);
    }
  }

  /**
   * Checks if a hook is deprecated.
   *
   * @param {string} hookName Hook name.
   * @returns {boolean}
   */
  isDeprecated(hookName: string): boolean {
    return DEPRECATED_HOOKS.has(hookName);
  }

  /**
   * Checks if a hook is registered.
   *
   * @param {string} hookName Hook name.
   * @returns {boolean}
   */
  isRegistered(hookName: string): boolean {
    return REGISTERED_HOOKS.includes(hookName);
  }

  /**
   * Gets all registered hooks.
   *
   * @returns {string[]}
   */
  getRegistered(): string[] {
    return [...REGISTERED_HOOKS];
  }
}

let globalSingleton: Hooks;

function getGlobalSingleton(): Hooks {
  if (!globalSingleton) {
    globalSingleton = new Hooks();
  }
  return globalSingleton;
}

export default Hooks;
