
/**
 * @description
 * Handsontable events are the common interface that function in 2 ways: as __callbacks__ and as __hooks__.
 *
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

// @TODO: Move plugin description hooks to plugin?
const REGISTERED_HOOKS = [
  /**
   * Callback fired after reset cell's meta.
   *
   * @event Hooks#afterCellMetaReset
   * @since 0.11
   */
  "afterCellMetaReset",

  /**
   * @description
   * Callback fired after one or more cells is changed. Its main use case is to save the input.
   *
   * __Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.
   *
   * @event Hooks#afterChange
   * @param {Array} changes 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`
   * @param {String} source Is one of the strings: `"alter", "empty", "edit", "populateFromArray", "loadData", "autofill", "paste"`.
   */
  "afterChange",
  "afterChangesObserved",
  "afterColumnMove",
  "afterColumnResize",
  "afterContextMenuDefaultOptions",
  "afterContextMenuHide",
  "afterContextMenuShow",
  "afterCopyLimit",

  /**
   * Callback is fired when a new column is created.
   *
   * @event Hooks#afterCreateCol
   * @param {Number} index Represents the index of first newly created column in the data source array.
   * @param {Number} amount Number of newly created columns in the data source array.
   */
  "afterCreateCol",

  /**
   * Callback is fired when a new row is created.
   *
   * @event Hooks#afterCreateRow
   * @param {Number} index Represents the index of first newly created row in the data source array.
   * @param {Number} amount Number of newly created rows in the data source array.
   */
  "afterCreateRow",

  /**
   * Event called when current cell is deselected.
   *
   * @event Hooks#afterDeselect
   */
  "afterDeselect",

  /**
   * Callback fired after destroying Handsontable instance.
   *
   * @event Hooks#afterDestroy
   */
  "afterDestroy",

  /**
   * @event Hooks#afterDocumentKeyDown
   */
  "afterDocumentKeyDown",

  /**
   * Callback fired after getting cell settings.
   *
   * @event Hooks#afterGetCellMeta
   * @param {Number} row
   * @param {Number} col
   * @param {Object} cellProperties
   */
  "afterGetCellMeta",

  /**
   * Callback fired after getting info about column header.
   *
   * @event Hooks#afterGetColHeader
   * @param {Number} col
   * @param {Element} TH
   */
  "afterGetColHeader",

  /**
   * @event Hooks#afterGetRowHeader
   */
  "afterGetRowHeader",

  /**
   * Callback fired after Handsontable instance is initiated.
   *
   * @event Hooks#afterInit
   */
  "afterInit",

  /**
   * @event Hooks#afterIsMultipleSelectionCheck
   */
  "afterIsMultipleSelectionCheck",

  /**
   * Callback fired after new data is loaded (by `loadData` method) into the data source array.
   *
   * @event Hooks#afterLoadData
   */
  "afterLoadData",

  /**
   * @event Hooks#afterMomentumScroll
   */
  "afterMomentumScroll",

  /**
   * @event Hooks#afterOnCellCornerMouseDown
   * @since 0.11
   * @param {Object} event
   */
  "afterOnCellCornerMouseDown",

  /**
   * Callback fired after clicking on a cell or row/column header.
   * In case the row/column header was clicked, the index is negative.
   * For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseDown` called with coords `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellMouseDown
   * @since 0.11
   * @param {Object} event
   * @param {Object} coords
   * @param {Object} TD
   */
  "afterOnCellMouseDown",

  /**
   * Callback fired after hovering a cell or row/column header with the mouse cursor.
   * In case the row/column header was hovered, the index is negative.
   * For example clicking on the row header of cell (0, 0) results with `afterOnCellMouseOver` called with coords `{row: 0, col: -1}`.
   *
   * @event Hooks#afterOnCellMouseOver
   * @since 0.11
   * @param {Object} event
   * @param {Object} coords
   * @param {Object} TD
   */
  "afterOnCellMouseOver",

  /**
   * Callback is fired when one or more columns are removed.
   *
   * @event Hooks#afterRemoveCol
   * @param {Number} index Is an index of starter column.
   * @param {Number} amount Is an amount of removed columns.
   */
  "afterRemoveCol",

  /**
   * Callback is fired when one or more rows are removed.
   *
   * @event Hooks#afterRemoveRow
   * @param {Number} index Is an index of starter row.
   * @param {Number} amount Is an amount of removed rows.
   */
  "afterRemoveRow",

  /**
   * Callback fired after Handsontable table is rendered.
   *
   * @event Hooks#afterRender
   * @param {Boolean} isForced Is `true` if rendering was triggered by a change of settings or data; or `false` if
   *                           rendering was triggered by scrolling or moving selection.
   */
  "afterRender",

  /**
   * @event Hooks#afterRenderer
   * @since 0.11
   * @param {Object} TD
   * @param {Number} row
   * @param {Number} col
   * @param {String} prop
   * @param {String} value
   * @param {Object} cellProperties
   */
  "afterRenderer",
  "afterRowMove",
  "afterRowResize",

  /**
   * @event Hooks#afterScrollHorizontally
   * @since 0.11
   */
  "afterScrollHorizontally",

  /**
   * @event Hooks#afterScrollVertically
   * @since 0.11
   */
  "afterScrollVertically",

  /**
   * Callback fired while one or more cells are being selected (on mouse move).
   *
   * @event Hooks#afterSelection
   * @param {Number} r Selection start row
   * @param {Number} c Selection start column
   * @param {Number} r2 Selection end row
   * @param {Number} c2 Selection end column
   */
  "afterSelection",

  /**
   * The same as above, but data source object property name is used instead of the column number.
   *
   * @event Hooks#afterSelectionByProp
   * @param {Number} r Selection start row
   * @param {String} p Selection start data source object property
   * @param {Number} r2 Selection end row
   * @param {String} p2 Selection end data source object property
   */
  "afterSelectionByProp",

  /**
   * Callback fired after one or more cells are selected (on mouse up).
   *
   * @event Hooks#afterSelectionEnd
   * @param {Number} r Selection start row
   * @param {Number} c Selection start column
   * @param {Number} r2 Selection end row
   * @param {Number} c2 Selection end column
   */
  "afterSelectionEnd",

  /**
   * The same as above, but data source object property name is used instead of the column number.
   *
   * @event Hooks#afterSelectionEndByProp
   * @param {Number} r Selection start row
   * @param {String} p Selection start data source object property
   * @param {Number} r2 Selection end row
   * @param {String} p2 Selection end data source object property
   */
  "afterSelectionEndByProp",

  /**
   * Called after cell meta was changed, e.g. using the context menu.
   *
   * @event Hooks#afterSetCellMeta
   * @since 0.11.0
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   * @param {*} value
   */
  "afterSetCellMeta",

  /**
   * @event Hooks#afterUpdateSettings
   */
  "afterUpdateSettings",

  /**
   * @description
   * A plugin hook executed after validator function, only if validator function is defined.
   * Validation result is the first parameter. This can be used to determinate if validation passed successfully or not.
   *
   * __You can cancel current change by returning false.__
   *
   * @event Hooks#afterValidate
   * @since 0.9.5
   * @param {Boolean} isValid
   * @param {*} value
   * @param {Number} row
   * @param {String} prop
   * @param {String} source
   */
  "afterValidate",

  /**
   * @event Hooks#beforeAutofill
   * @param {Object} start Object containing information about first filled cell: `{row: 2, col: 0}`
   * @param {Object} end Object containing information about last filled cell: `{row: 4, col: 1}`
   * @param {Array} data 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`
   */
  "beforeAutofill",

  /**
   * @event Hooks#beforeCellAlignment
   */
  "beforeCellAlignment",

  /**
   * Callback fired before one or more cells is changed. Its main purpose is to alter changes silently before input.
   *
   * @event Hooks#beforeChange
   * @param {Array} changes 2D array containing information about each of the edited cells.
   * @param {String} source The name of a source of changes.
   * @example
   * ```js
   * // To disregard a single change, set changes[i] to null or remove it from array using changes.splice(i, 1).
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeChange: function(changes, source) {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0] = null;
   *   }
   * });
   * ...
   *
   * // To alter a single change, overwrite the desired value to changes[i][3].
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeChange: function(changes, source) {
   *     // [[row, prop, oldVal, newVal], ...]
   *     changes[0][1] = 10;
   *   }
   * });
   * ...
   *
   * // To cancel all edit, return false from the callback or set array length to 0 (changes.length = 0).
   * ...
   * new Handsontable(document.getElementById('example'), {
   *   beforeChange: function(changes, source) {
   *     // [[row, prop, oldVal, newVal], ...]
   *     return false;
   *   }
   * });
   * ...
   * ```
   */
  "beforeChange",

  /**
   * @event Hooks#beforeChangeRender
   * @since 0.11
   */
  "beforeChangeRender",

  /**
   * @event Hooks#beforeDrawBorders
   */
  "beforeDrawBorders",

  /**
   * Callback fired before getting cell settings.
   *
   * @event Hooks#beforeGetCellMeta
   * @param {Number} row
   * @param {Number} col
   * @param {Object} cellProperties
   */
  "beforeGetCellMeta",

  /**
   * @description
   * Callback fired before Handsontable instance is initiated.
   *
   * @event Hooks#beforeInit
   */

  "beforeInit",

  /**
   * Callback fired before Walkontable instance is initiated.
   *
   * @since 0.11
   * @event Hooks#beforeInitWalkontable
   */
  "beforeInitWalkontable",

  /**
   * Callback fired before keydown event is handled. It can be used to overwrite default key bindings.
   * Caution - in your `beforeKeyDown` handler you need to call `event.stopImmediatePropagation()` to prevent default key behavior.
   *
   * @event Hooks#beforeKeyDown
   * @since 0.9.0
   * @param {Object} event Original DOM event
   */
  "beforeKeyDown",

  /**
   * @event Hooks#beforeOnCellMouseDown
   */
  "beforeOnCellMouseDown",

  /**
   * Callback is fired when one or more columns are about to be removed.
   *
   * @event Hooks#beforeRemoveCol
   * @param {Number} index Index of starter column.
   * @param {Number} amount Amount of columns to be removed.
   */
  "beforeRemoveCol",

  /**
   * Callback is fired when one or more rows are about to be removed.
   *
   * @event Hooks#beforeRemoveRow
   * @param {Number} index Index of starter column.
   * @param {Number} amount Amount of columns to be removed.
   */
  "beforeRemoveRow",

  /**
   * Callback fired before Handsontable table is rendered.
   *
   * @event Hooks#beforeRender
   * @param {Boolean} isForced If `true` rendering was triggered by a change of settings or data; or `false` if
   *                           rendering was triggered by scrolling or moving selection.
   */
  "beforeRender",

  /**
   * Callback fired before setting range is ended.
   *
   * @event Hooks#beforeSetRangeEnd
   * @param {Array} coords WalkontableCellCoords array.
   */
  "beforeSetRangeEnd",

  /**
   * @event Hooks#beforeTouchScroll
   */
  "beforeTouchScroll",

  /**
   * @description
   * A plugin hook executed before validator function, only if validator function is defined.
   * This can be used to manipulate value of changed cell before it is applied to the validator function.
   *
   * __Notice:__ this will not affect values of changes. This will change value ONLY for validation!
   *
   * @event Hooks#beforeValidate
   * @since 0.9.5
   * @param {*} value
   * @param {Number} row
   * @param {String} prop
   * @param {String} source
   */
  "beforeValidate",

  /**
   * Callback fired after Handsontable instance is constructed (via `new` operator).
   *
   * @event Hooks#construct
   * @since 0.16.1
   */
  "construct",

  /**
   * Callback fired after Handsontable instance is initiated but before table is rendered.
   *
   * @event Hooks#init
   * @since 0.16.1
   */
  "init",

  /**
   * Callback fired after column modify.
   *
   * @event Hooks#modifyCol
   * @since 0.11
   * @param {Number} col
   */
  "modifyCol",

  /**
   * Callback fired after modify column's width.
   *
   * @event Hooks#modifyColWidth
   * @since 0.11
   * @param {Number} width
   * @param {Number} col
   */
  "modifyColWidth",

  /**
   * Callback fired after row modify.
   *
   * @event Hooks#modifyRow
   * @since 0.11
   * @param {Number} row
   */
  "modifyRow",

  /**
   * Callback fired after modify height of row.
   *
   * @event Hooks#modifyRowHeight
   * @since 0.11
   * @param {Number} height
   * @param {Number} row
   */
  "modifyRowHeight",

  /**
   * @event Hooks#persistentStateLoad
   */
  "persistentStateLoad",

  /**
   * @event Hooks#persistentStateReset
   */
  "persistentStateReset",

  /**
   * @event Hooks#persistentStateSave
   */
  "persistentStateSave"
];

import {EventManager} from './eventManager';
import {arrayEach} from './helpers/array';
import {objectEach} from './helpers/object';

class Hooks {
  /**
   *
   */
  constructor() {
    this.globalBucket = this.createEmptyBucket();
  }

  /**
   * Returns new object with empty handlers related to every registered hook name.
   *
   * @returns {Object}
   *
   * @example
   * ```js
   * Handsontable.hooks.createEmptyBucket();
   * // Results:
   * {
   * ...
   * afterCreateCol: [],
   * afterCreateRow: [],
   * beforeInit: [],
   * ...
   * }
   * ```
   */
  createEmptyBucket() {
    const bucket = Object.create(null);

    arrayEach(REGISTERED_HOOKS, (hook) => (bucket[hook] = []));

    return bucket;
  }

  /**
   * Get hook bucket based on context object or if argument is `undefined` get global hook bucked.
   *
   * @param {Object} [context=null]
   * @returns {Object} Returns global or handsontable instance bucket
   */
  getBucket(context = null) {
    if (context) {
      if (!context.pluginHookBucket) {
        context.pluginHookBucket = this.createEmptyBucket();
      }

      return context.pluginHookBucket;
    }

    return this.globalBucket;
  }

  /**
   * Adds listener (globally or locally) to specified hook name.
   *
   * @see Core#addHook
   * @param {String} key Hook/Event name
   * @param {Function|Array} callback Callback function or array of functions
   * @param {Object} [context=null]
   * @returns {Hooks} Instance of Hooks
   *
   * @example
   * ```js
   * Handsontable.hooks.add('beforeInit', myCallback, hotInstance);
   * ```
   */
  add(key, callback, context = null) {
    if (Array.isArray(callback)) {
      arrayEach(callback, (c) => (this.add(key, c, context)));

    } else {
      const bucket = this.getBucket(context);

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
   * @see Core#addHookOnce
   * @param {String} key Hook/Event name
   * @param {Function} callback Callback function
   * @param {Object} [context=null]
   *
   * @example
   * ```js
   * Handsontable.hooks.once('beforeInit', myCallback, hotInstance);
   * ```
   */
  once(key, callback, context = null) {
    if (Array.isArray(callback)) {
      arrayEach(callback, (c) => (this.once(key, c, context)));

    } else {
      callback.runOnce = true;
      this.add(key, callback, context);
    }
  }

  /**
   * Removes listener from hooks.
   *
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
   * @see Core#runHooks
   * @param {Object} context
   * @param {String} key Hook/Event name
   * @param {*} [p1]
   * @param {*} [p2]
   * @param {*} [p3]
   * @param {*} [p4]
   * @param {*} [p5]
   * @param {*} [p6]
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
      let index = -1;
      let length = globalHandlers ? globalHandlers.length : 0;

      if (length) {
        // Do not optimise this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (++index < length) {
          if (!globalHandlers[index] || globalHandlers[index].skip) {
            continue;
          }
          // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
          let res = globalHandlers[index].call(context, p1, p2, p3, p4, p5, p6);

          if (res !== void 0) {
            p1 = res;
          }
          if (globalHandlers[index] && globalHandlers[index].runOnce) {
            this.remove(key, globalHandlers[index]);
          }
        }
      }
    }
    {
      const localHandlers = this.getBucket(context)[key];
      let index = -1;
      let length = localHandlers ? localHandlers.length : 0;

      if (length) {
        // Do not optimise this loop with arrayEach or arrow function! If you do You'll decrease perf because of GC.
        while (++index < length) {
          if (!localHandlers[index] || localHandlers[index].skip) {
            continue;
          }
          // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
          let res = localHandlers[index].call(context, p1, p2, p3, p4, p5, p6);

          if (res !== void 0) {
            p1 = res;
          }
          if (localHandlers[index] && localHandlers[index].runOnce) {
            this.remove(key, localHandlers[index], context);
          }
        }
      }
    }

    return p1;
  }

  /**
   * Destroy all listeners connected to the context. If context is not exists then listeners will by destroy
   * from globally.
   *
   * @param {Object} [context=null]
   */
  destroy(context = null) {
    objectEach(this.getBucket(context), (value, key, bucket) => (bucket[key].length = 0));
  }

  /**
   * Registers a hook name (adds it to the list of the known hook names). Used by plugins. It is not necessary to call,
   * register, but if you use it, your plugin hook will be used returned by getRegistered
   * (which itself is used in the demo http://handsontable.com/demo/callbacks.html).
   *
   * @param key {String} Hook name
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
   * Unregister a hook name (removes it from the list of known hook names).
   *
   * @param key {String} Hook name
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
   * Returns boolean information if a hook by such name has been registered.
   *
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

export {Hooks};

// temp for tests only!
Handsontable.utils = Handsontable.utils || {};
Handsontable.utils.Hooks = Hooks;
