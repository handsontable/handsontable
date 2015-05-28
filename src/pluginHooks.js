
/**
 * @description
 * Handsontable events are the common interface that function in 2 ways: as __callbacks__ and as __hooks__.
 *
 * @constructor Hooks
 * @example
 *
 * ```js
 * // Using events as callbacks:
 * ...
 * var hot1 = new Handsontable(document.getElementById('example1'), {
 *   afterChange: function(changes, source) {
 *     $.ajax({
 *       url: "save.php",
 *       data: change
 *     });
 *   }
 * });
 * ...
 * ```
 *
 * ```js
 * // Using events as plugin hooks:
 * ...
 * var hot1 = new Handsontable(document.getElementById('example1'), {
 *   myPlugin: true
 * });
 *
 * var hot2 = new Handsontable(document.getElementById('example2'), {
 *   myPlugin: false
 * });
 *
 * // global hook
 * Handsontable.hooks.add('afterChange', function() {
 *   // Fired twice - for hot1 and hot2
 *   if (this.getSettings().myPlugin) {
 *     // function body - will only run for hot1
 *   }
 * });
 *
 * // local hook (has same effect as a callback)
 * hot2.addHook('afterChange', function() {
 *   // function body - will only run in #example2
 * });
 * ```
 * ...
 */

const REGISTERED_HOOKS = [
  "beforeInit",
  "afterRowResize",
  "afterContextMenuShow",
  "afterColumnResize",
  "afterViewportColumnCalculatorOverride",
  "afterViewportRowCalculatorOverride",
  "afterIsMultipleSelection",
  "modifyTransformEnd",
  "modifyTransformStart",
  "afterContextMenuDefaultOptions",
  "beforeInitWalkontable",
  "beforeInit",
  "beforeRender",
  "beforeSetRangeEnd",
  "beforeDrawBorders",
  "beforeChange",
  "beforeChangeRender",
  "beforeRemoveCol",
  "beforeRemoveRow",
  "beforeValidate",
  "beforeGetCellMeta",
  "beforeAutofill",
  "beforeKeyDown",
  "beforeOnCellMouseDown",
  "beforeTouchScroll",
  "afterInit",
  "afterLoadData",
  "afterUpdateSettings",
  "afterRender",
  "afterRenderer",
  "afterChange",
  "afterValidate",
  "afterGetCellMeta",
  "afterSetCellMeta",
  "afterGetColHeader",
  "afterGetRowHeader",
  "afterDestroy",
  "afterRemoveRow",
  "afterCreateRow",
  "afterRemoveCol",
  "afterCreateCol",
  "afterDeselect",
  "afterSelection",
  "afterSelectionByProp",
  "afterSelectionEnd",
  "afterSelectionEndByProp",
  "afterOnCellMouseDown",
  "afterOnCellMouseOver",
  "afterOnCellCornerMouseDown",
  "afterScrollVertically",
  "afterScrollHorizontally",
  "afterCellMetaReset",
  "afterIsMultipleSelectionCheck",
  "afterDocumentKeyDown",
  "afterMomentumScroll",
  "beforeCellAlignment",
  "modifyColWidth",
  "modifyRowHeight",
  "afterGetColumnHeaderRenderers",
  "afterModifyTransformStart",
  "beforeAutofillInsidePopulate",
  "afterModifyTransformEnd",
  "beforeSetRangeStart",
  "afterGetRowHeaderRenderers",
  "modifyRow",
  "modifyCol",
  "afterColumnSort",
  "beforeColumnSort",

  "afterCopyLimit",
  "persistentStateLoad",
  "persistentStateSave",
  "persistentStateReset",

  "postAfterValidate",

  "afterChangesObserved",

  "afterContextMenuHide",
  "afterContextMenuShow",
  "afterContextMenuDefaultOptions",

  "afterColumnMove",
  "afterRowMove"
];


class PluginHook {
  /**
   *
   */
  constructor() {
    this.globalBucket = this.createEmptyHooksHandler();
  }

  /**
   *
   */
  createEmptyHooksHandler() {
    const handler = {};

    for (let i = 0, len = REGISTERED_HOOKS.length; i < len; i++) {
      handler[REGISTERED_HOOKS[i]] = [];
    }

    return handler;
  }

  /**
   * Get hook bucket based on context object or if argument is `undefined` get global hook bucked.
   *
   * @memberof Hooks#
   * @function getBucket
   * @param {Object} [context=null]
   * @returns {Object} Returns global or handsontable instance bucket
   */
  getBucket(context = null) {
    if (context) {
      if (!context.pluginHookBucket) {
        context.pluginHookBucket = this.createEmptyHooksHandler();
      }

      return context.pluginHookBucket;
    }

    return this.globalBucket;
  }

  /**
   * Adds listener (globally or locally) to specified hook name.
   *
   * @memberof Hooks#
   * @function add
   * @see Core#addHook
   * @param {String} key Hook/Event name
   * @param {Function|Array} callback Callback function or array of functions
   * @param {Object} [context=null]
   * @returns {PluginHook} Instance of Hooks
   *
   * @example
   * ```js
   * Handsontable.hooks.add('beforeInit', myCallback, hot);
   * ```
   */
  add(key, callback, context = null) {
    if (Array.isArray(callback)) {
      for (let i = 0, len = callback.length; i < len; i++) {
        this.add(key, callback[i]);
      }
    } else {
      let bucket = this.getBucket(context);

      if (typeof bucket[key] === 'undefined') {
        this.register(key);
        bucket[key] = [];
      }
      callback.skip = false;

      if (bucket[key].indexOf(callback) === -1) {
        // only add a hook if it has not already been added (adding the same hook twice is now silently ignored)
        bucket[key].push(callback);
      }
    }

    return this;
  }

  /**
   * Adds listener to specified hook. After hook runs this listener will be automatically removed.
   *
   * @memberof Hooks#
   * @function once
   * @see Core#addHookOnce
   * @param {String} key Hook/Event name
   * @param {Function} callback Callback function
   * @param {Object} [context=null]
   *
   * @example
   * ```js
   * Handsontable.hooks.once('beforeInit', myCallback, hot);
   * ```
   */
  once(key, callback, context = null) {
    if (Array.isArray(callback)) {
      for (let i = 0, len = callback.length; i < len; i++) {
        callback[i].runOnce = true;
        this.add(key, callback[i], context);
      }

    } else {
      callback.runOnce = true;
      this.add(key, callback, context);
    }
  }

  /**
   * Removes listener from hooks.
   *
   * @memberof Hooks#
   * @function remove
   * @see Core#removeHook
   * @param {String} key Hook/Event name
   * @param {Function} callback Callback function
   * @param {Object} [context=null]
   * @return {Boolean} Returns `true` if hook was removed
   *
   * @example
   * ```js
   * Handsontable.hooks.remove('beforeInit', myCallback);
   * ```
   */
  remove(key, callback, context = null) {
    let bucket = this.getBucket(context);

    if (typeof bucket[key] !== 'undefined') {
      if (bucket[key].indexOf(callback) >= 0) {
        callback.skip = true;

        return true;
      }
    }

    return false;
  }

  /**
   * Run all local and global listeners by hook name.
   *
   * @memberof Hooks#
   * @function run
   * @see Core#runHooks
   * @param {Object} context
   * @param {String} key Hook/Event name
   * @param {*} p1
   * @param {*} p2
   * @param {*} p3
   * @param {*} p4
   * @param {*} p5
   * @param {*} p6
   * @returns {*}
   *
   * @example
   * ```js
   * Handsontable.hooks.run(hot, 'beforeInit');
   * ```
   */
  run(context, key, p1, p2, p3, p4, p5, p6) {
    {
      const globalHandlers = this.globalBucket[key];
      let len = globalHandlers ? globalHandlers.length : 0;

      for (let i = 0; i < len; i++) {
        if (globalHandlers[i].skip) {
          continue;
        }
        // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
        let res = globalHandlers[i].call(context, p1, p2, p3, p4, p5, p6);

        if (res !== void 0) {
          p1 = res;
        }

        if (globalHandlers[i].runOnce) {
          this.remove(key, globalHandlers[i]);
        }
      }
    }
    {
      const localHandlers = this.getBucket(context)[key];
      let len = localHandlers ? localHandlers.length : 0;

      for (let i = 0; i < len; i++) {
        if (localHandlers[i].skip) {
          continue;
        }
        // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
        let res = localHandlers[i].call(context, p1, p2, p3, p4, p5, p6);

        if (res !== void 0) {
          p1 = res;
        }

        if (localHandlers[i].runOnce) {
          this.remove(key, localHandlers[i], context);
        }
      }
    }

    return p1;
  }

  /**
   * Destroy all listeners connected to the context. If context is not exists then listeners will by destroy
   * from globally.
   *
   * @memberof Hooks#
   * @function destroy
   * @param {Object} [context=null]
   */
  destroy(context = null) {
    let bucket = this.getBucket(context);

    for (let key in bucket) {
      if (bucket.hasOwnProperty(key)) {
        for (let i = 0, len = bucket[key].length; i < len; i++) {
          this.remove(key, bucket[key], context);
        }
      }
    }
  }

  /**
   * Registers a hook name (adds it to the list of the known hook names). Used by plugins. It is not necessary to call,
   * register, but if you use it, your plugin hook will be used returned by getRegistered
   * (which itself is used in the demo http://handsontable.com/demo/callbacks.html).
   *
   * @memberof Hooks#
   * @function register
   * @param key {String} Hook name
   */
  register(key) {
    if (!this.isRegistered(key)) {
      REGISTERED_HOOKS.push(key);
    }
  }

  /**
   * Unregister a hook name (removes it from the list of known hook names).
   *
   * @memberof Hooks#
   * @function deregister
   * @param key {String} Hook name
   */
  deregister(key) {
    if (this.isRegistered(key)) {
      REGISTERED_HOOKS.splice(REGISTERED_HOOKS.indexOf(key), 1);
    }
  }

  /**
   * Returns boolean information if a hook by such name has been registered.
   *
   * @memberof Hooks#
   * @function isRegistered
   * @param key {String} Hook name
   * @returns {Boolean}
   *
   * @example
   * ```js
   * Handsontable.hooks.isRegistered('beforeInit');
   * // Results:
   * true
   * ```
   */
  isRegistered(key) {
    return REGISTERED_HOOKS.indexOf(key) >= 0;
  }

  /**
   * Returns an array of registered hooks.
   *
   * @memberof Hooks#
   * @function getRegistered
   * @returns {Array}
   *
   * @example
   * ```js
   * Handsontable.hooks.getRegistered();
   * // Results:
   * [
   * ...
   *   "beforeInit",
   *   "beforeRender",
   *   "beforeSetRangeEnd",
   *   "beforeDrawBorders",
   *   "beforeChange",
   * ...
   * ]
   * ```
   */
  getRegistered() {
    return REGISTERED_HOOKS;
  }
}

export {PluginHook};
