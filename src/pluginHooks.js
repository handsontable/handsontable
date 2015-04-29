
export {PluginHook};

/**
 * @description
 * Handsontable events are the common interface that function in 2 ways: as __callbacks__ and as __plugin hooks__.
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
 *   'myPlugin': true
 * });
 *
 * var hot2 = new Handsontable(document.getElementById('example2'), {
 *   'myPlugin': false
 * });
 *
 * // global hook
 * Handsontable.PluginHooks.add('afterChange', function() {
 *   if (this.getSettings().myPlugin) {
 *     // function body - will only run in #example1
 *   }
 * });
 *
 * // local hook (has same effect as a callback)
 * hot.addHook('afterChange', function() {
 *   // function body - will only run in #example2
 * });
 * ```
 * ...
 */
var Hooks = function() {
  return {
    /**
     * Callback fired before Walkontable instance is initiated.
     *
     * @since 0.11
     * @event Hooks#beforeInitWalkontable
     */
    beforeInitWalkontable: [],

    /**
     * @description
     * Callback fired before Handsontable instance is initiated.
     *
     * __Note:__ This can be set only by global PluginHooks instance.
     *
     * @event Hooks#beforeInit
     */
    beforeInit: [],

    /**
     * Callback fired before Handsontable table is rendered.
     *
     * @event Hooks#beforeRender
     * @param {Boolean} isForced If true rendering was triggered by a change of settings or data; or false if
     *                           rendering was triggered by scrolling or moving selection.
     */
    beforeRender: [],

    /**
     * Callback fired before setting range is ended.
     *
     * @event Hooks#beforeSetRangeEnd
     * @param {Array} coords WalkontableCellCoords array.
     */
    beforeSetRangeEnd: [],

    /**
     * @event Hooks#beforeDrawBorders
     */
    beforeDrawBorders: [],

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
    beforeChange: [],

    /**
     * @event Hooks#beforeChangeRender
     * @since 0.11
     */
    beforeChangeRender: [],

    /**
     * Callback is fired when one or more columns are about to be removed.
     *
     * @event Hooks#beforeRemoveCol
     * @param {Number} index Index of starter column.
     * @param {Number} amount Amount of columns to be removed.
     */
    beforeRemoveCol: [],

    /**
     * Callback is fired when one or more rows are about to be removed.
     *
     * @event Hooks#beforeRemoveRow
     * @param {Number} index Index of starter column.
     * @param {Number} amount Amount of columns to be removed.
     */
    beforeRemoveRow: [],

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
    beforeValidate: [],

    /**
     * Callback fired before getting cell settings.
     *
     * @event Hooks#beforeGetCellMeta
     * @param {Number} row
     * @param {Number} col
     * @param {Object} cellProperties
     */
    beforeGetCellMeta: [],

    /**
     * @event Hooks#beforeAutofill
     * @param {Object} start Object containing information about first filled cell: `{row: 2, col: 0}`
     * @param {Object} end Object containing information about last filled cell: `{row: 4, col: 1}`
     * @param {Array} data 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`
     */
    beforeAutofill: [],

    /**
     * Callback fired before keydown event is handled. It can be used to overwrite default key bindings.
     * Caution - in your `beforeKeyDown` handler you need to call `event.stopImmediatePropagation()` to prevent default key behavior.
     *
     * @event Hooks#beforeKeyDown
     * @since 0.9.0
     * @param {Object} event Original DOM event
     */
    beforeKeyDown: [],

    /**
     * @event Hooks#beforeOnCellMouseDown
     */
    beforeOnCellMouseDown: [],

    /**
     * @event Hooks#beforeTouchScroll
     */
    beforeTouchScroll: [],

    /**
     * Callback fired after Handsontable instance is initiated.
     *
     * @event Hooks#afterInit
     */
    afterInit: [],

    /**
     * Callback fired after new data is loaded (by `loadData` method) into the data source array.
     *
     * @event Hooks#afterLoadData
     */
    afterLoadData: [],

    /**
     * @event Hooks#afterUpdateSettings
     */
    afterUpdateSettings: [],

    /**
     * Callback fired after Handsontable table is rendered.
     *
     * @event Hooks#afterRender
     * @param {Boolean} isForced Is `true` if rendering was triggered by a change of settings or data; or `false` if
     *                           rendering was triggered by scrolling or moving selection.
     */
    afterRender: [],

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
    afterRenderer: [],

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
    afterChange: [],

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
    afterValidate: [],

    /**
     * Callback fired after getting cell settings.
     *
     * @event Hooks#afterGetCellMeta
     * @param {Number} row
     * @param {Number} col
     * @param {Object} cellProperties
     */
    afterGetCellMeta: [],

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
    afterSetCellMeta: [],

    /**
     * Callback fired after getting info about column header.
     *
     * @event Hooks#afterGetColHeader
     * @param {Number} col
     * @param {Element} TH
     */
    afterGetColHeader: [],

    /**
     * @event Hooks#afterGetRowHeader
     */
    afterGetRowHeader: [],

    /**
     * Callback fired after destroing Handsontable instance.
     *
     * @event Hooks#afterDestroy
     */
    afterDestroy: [],

    /**
     * Callback is fired when one or more rows are removed.
     *
     * @event Hooks#afterRemoveRow
     * @param {Number} index Is an index of starter row.
     * @param {Number} amount Is an anount of removed rows.
     */
    afterRemoveRow: [],

    /**
     * Callback is fired when a new row is created.
     *
     * @event Hooks#afterCreateRow
     * @param {Number} index Represents the index of first newly created row in the data source array.
     * @param {Number} amount Number of newly created rows in the data source array.
     */
    afterCreateRow: [],

    /**
     * Callback is fired when one or more columns are removed.
     *
     * @event Hooks#afterRemoveCol
     * @param {Number} index Is an index of starter column.
     * @param {Number} amount Is an amount of removed columns.
     */
    afterRemoveCol: [],

    /**
     * Callback is fired when a new column is created.
     *
     * @event Hooks#afterCreateCol
     * @param {Number} index Represents the index of first newly created column in the data source array.
     * @param {Number} amount Number of newly created columns in the data source array.
     */
    afterCreateCol: [],

    /**
     * Event called when current cell is deselected.
     *
     * @event Hooks#afterDeselect
     */
    afterDeselect: [],

    /**
     * Callback fired while one or more cells are being selected (on mouse move).
     *
     * @event Hooks#afterSelection
     * @param {Number} r Selection start row
     * @param {Number} c Selection start column
     * @param {Number} r2 Selection end row
     * @param {Number} c2 Selection end column
     */
    afterSelection: [],

    /**
     * The same as above, but data source object property name is used instead of the column number.
     *
     * @event Hooks#afterSelectionByProp
     * @param {Number} r Selection start row
     * @param {String} p Selection start data source object property
     * @param {Number} r2 Selection end row
     * @param {String} p2 Selection end data source object property
     */
    afterSelectionByProp: [],

    /**
     * Callback fired after one or more cells are selected (on mouse up).
     *
     * @event Hooks#afterSelectionEnd
     * @param {Number} r Selection start row
     * @param {Number} c Selection start column
     * @param {Number} r2 Selection end row
     * @param {Number} c2 Selection end column
     */
    afterSelectionEnd: [],

    /**
     * The same as above, but data source object property name is used instead of the column number.
     *
     * @event Hooks#afterSelectionEndByProp
     * @param {Number} r Selection start row
     * @param {String} p Selection start data source object property
     * @param {Number} r2 Selection end row
     * @param {String} p2 Selection end data source object property
     */
    afterSelectionEndByProp: [],

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
    afterOnCellMouseDown: [],

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
    afterOnCellMouseOver: [],

    /**
     * @event Hooks#afterOnCellCornerMouseDown
     * @since 0.11
     * @param {Object} event
     */
    afterOnCellCornerMouseDown: [],

    /**
     * @event Hooks#afterScrollVertically
     * @since 0.11
     */
    afterScrollVertically: [],

    /**
     * @event Hooks#afterScrollHorizontally
     * @since 0.11
     */
    afterScrollHorizontally: [],

    /**
     * Callback fired after reset cell's meta.
     *
     * @event Hooks#afterCellMetaReset
     * @since 0.11
     */
    afterCellMetaReset: [],

    /**
     * @event Hooks#afterIsMultipleSelectionCheck
     */
    afterIsMultipleSelectionCheck: [],

    /**
     * @event Hooks#afterDocumentKeyDown
     */
    afterDocumentKeyDown: [],

    /**
     * @event Hooks#afterMomentumScroll
     */
    afterMomentumScroll: [],
    beforeCellAlignment: [],

    /**
     * Callback fired after modify column's width.
     *
     * @event Hooks#modifyColWidth
     * @since 0.11
     * @param {Number} width
     * @param {Number} col
     */
    modifyColWidth: [],

    /**
     * Callback fired after modify height of row.
     *
     * @event Hooks#modifyRowHeight
     * @since 0.11
     * @param {Number} height
     * @param {Number} row
     */
    modifyRowHeight: [],

    /**
     * Callback fired after row modify.
     *
     * @event Hooks#modifyRow
     * @since 0.11
     * @param {Number} row
     */
    modifyRow: [],

    /**
     * Callback fired after column modify.
     *
     * @event Hooks#modifyCol
     * @since 0.11
     * @param {Number} col
     */
    modifyCol: []
  };
};

var legacy = {
  /**
   * Now event is called {@link event:modifyCol}.
   *
   * @event Hooks#onBeforeChange
   * @deprecated
   * @param {Array} changes
   * @param {String} source
   */
  onBeforeChange: "beforeChange",

  /**
   * Now event is called {@link event:afterChange}.
   *
   * @event Hooks#onChange
   * @deprecated
   * @param {Array} changes
   * @param {String} source
   */
  onChange: "afterChange",

  /**
   * @event Hooks#onCreateRow
   * @deprecated
   */
  onCreateRow: "afterCreateRow",

  /**
   * @event Hooks#onCreateCol
   * @deprecated
   */
  onCreateCol: "afterCreateCol",

  /**
   * Now event is called {@link event:afterSelection}.
   *
   * @event Hooks#onSelection
   * @deprecated
   * @param {Number} r
   * @param {Number} c
   * @param {Number} r2
   * @param {Number} c2
   */
  onSelection: "afterSelection",

  /**
   * Now event is called {@link event:afterCopyLimit}.
   *
   * @event Hooks#onCopyLimit
   * @deprecated
   * @param {Number} selectedRowsCount
   * @param {Number} selectedColsCount
   * @param {Number} copyRowsLimit
   * @param {Number} copyColsLimit
   */
  onCopyLimit: "afterCopyLimit",

  /**
   * Now event is called {@link event:afterSelectionEnd}.
   *
   * @event Hooks#onSelectionEnd
   * @deprecated
   * @param {Number} r
   * @param {Number} c
   * @param {Number} r2
   * @param {Number} c2
   */
  onSelectionEnd: "afterSelectionEnd",

  /**
   * Now event is called {@link event:afterSelectionByProp}.
   *
   * @event Hooks#onSelectionByProp
   * @deprecated
   * @param {Number} r
   * @param {String} p
   * @param {Number} r2
   * @param {String} p2
   */
  onSelectionByProp: "afterSelectionByProp",

  /**
   * Now event is called {@link event:afterSelectionEndByProp}.
   *
   * @event Hooks#onSelectionEndByProp
   * @deprecated
   * @param {Number} r
   * @param {String} p
   * @param {Number} r2
   * @param {String} p2
   */
  onSelectionEndByProp: "afterSelectionEndByProp"
};

function PluginHook() {
  /* jshint ignore:start */
  this.hooks = Hooks();
  /* jshint ignore:end */
  this.globalBucket = {};
  this.legacy = legacy;
}

/**
 * Get hook bucket based on Handsontable instance or if instance is `undefined` get global hook bucked.
 *
 * @memberof Hooks#
 * @function getBucket
 * @param {Object} instance Instance of Handsontable
 * @returns {Object} Returns global or handsontable instance bucket
 */
PluginHook.prototype.getBucket = function(instance) {
  if (instance) {
    if (!instance.pluginHookBucket) {
      instance.pluginHookBucket = {};
    }

    return instance.pluginHookBucket;
  }

  return this.globalBucket;
};

/**
 * @memberof Hooks#
 * @function add
 * @param {String} key Hook/Event name
 * @param {Function} fn Callback function
 * @param {Object} instance Instance of Handsontable
 * @returns {PluginHook} Instance of Hooks
 */
PluginHook.prototype.add = function(key, fn, instance) {
  // if fn is array, run this for all the array items
  if (Array.isArray(fn)) {
    for (var i = 0, len = fn.length; i < len; i++) {
      this.add(key, fn[i]);
    }
  } else {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }
    var bucket = this.getBucket(instance);

    if (typeof bucket[key] === 'undefined') {
      bucket[key] = [];
    }
    fn.skip = false;

    if (bucket[key].indexOf(fn) === -1) {
      // only add a hook if it has not already been added (adding the same hook twice is now silently ignored)
      bucket[key].push(fn);
    }
  }

  return this;
};

/**
 * @memberof Hooks#
 * @function once
 * @param {String} key Hook/Event name
 * @param {Function} fn Callback function
 * @param {Object} instance of Handsontable
 */
PluginHook.prototype.once = function(key, fn, instance) {
  if (Array.isArray(fn)) {
    for (var i = 0, len = fn.length; i < len; i++) {
      fn[i].runOnce = true;
      this.add(key, fn[i], instance);
    }

  } else {
    fn.runOnce = true;
    this.add(key, fn, instance);
  }
};

/**
 * @memberof Hooks#
 * @function remove
 * @param {String} key Hook/Event name
 * @param {Function} fn Callback function
 * @param {Object} instance of Handsontable
 * @return {Boolean}
 */
PluginHook.prototype.remove = function(key, fn, instance) {
  var status = false;

  // provide support for old versions of HOT
  if (key in legacy) {
    key = legacy[key];
  }
  var bucket = this.getBucket(instance);

  if (typeof bucket[key] !== 'undefined') {
    for (var i = 0, leni = bucket[key].length; i < leni; i++) {
      if (bucket[key][i] == fn) {
        bucket[key][i].skip = true;
        status = true;
        break;
      }
    }
  }

  return status;
};

/**
 * @memberof Hooks#
 * @function run
 * @param {Object} instance of Handsontable
 * @param {String} key Hook/Event name
 * @param {*} p1
 * @param {*} p2
 * @param {*} p3
 * @param {*} p4
 * @param {*} p5
 * @param {*} p6
 * @returns {*}
 */
PluginHook.prototype.run = function(instance, key, p1, p2, p3, p4, p5, p6) {
  // provide support for old versions of HOT
  if (legacy[key]) {
    key = legacy[key];
  }
  p1 = this._runBucket(this.globalBucket, instance, key, p1, p2, p3, p4, p5, p6);
  p1 = this._runBucket(this.getBucket(instance), instance, key, p1, p2, p3, p4, p5, p6);

  return p1;
};

PluginHook.prototype._runBucket = function(bucket, instance, key, p1, p2, p3, p4, p5, p6) {
  var handlers = bucket[key],
    res, i, len;

  // performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
  if (handlers) {
    for (i = 0, len = handlers.length; i < len; i++) {
      if (!handlers[i].skip) {
        res = handlers[i].call(instance, p1, p2, p3, p4, p5, p6);

        if (res !== void 0) {
          p1 = res;
        }

        if (handlers[i].runOnce) {
          this.remove(key, handlers[i], bucket === this.globalBucket ? null : instance);
        }
      }
    }
  }

  return p1;
};

PluginHook.prototype.destroy = function(instance) {
  var bucket = this.getBucket(instance);

  for (var key in bucket) {
    if (bucket.hasOwnProperty(key)) {
      for (var i = 0, leni = bucket[key].length; i < leni; i++) {
        this.remove(key, bucket[key], instance);
      }
    }
  }
};

/**
 * Registers a hook name (adds it to the list of the known hook names). Used by plugins. It is not neccessary to call,
 * register, but if you use it, your plugin hook will be used returned by getRegistered
 * (which itself is used in the demo http://handsontable.com/demo/callbacks.html)
 *
 * @memberof Hooks#
 * @function register
 * @private
 * @param key {String}
 */
PluginHook.prototype.register = function(key) {
  if (!this.isRegistered(key)) {
    this.hooks[key] = [];
  }
};

/**
 * Deregisters a hook name (removes it from the list of known hook names)
 *
 * @memberof Hooks#
 * @function deregister
 * @private
 * @param key {String}
 */
PluginHook.prototype.deregister = function(key) {
  delete this.hooks[key];
};

/**
 * Returns boolean information if a hook by such name has been registered
 *
 * @memberof Hooks#
 * @function isRegistered
 * @private
 * @param key {String}
 */
PluginHook.prototype.isRegistered = function(key) {
  return (typeof this.hooks[key] !== "undefined");
};

/**
 * Returns an array of registered hooks
 *
 * @memberof Hooks#
 * @function getRegistered
 * @private
 * @returns {Array}
 */
PluginHook.prototype.getRegistered = function() {
  return Object.keys(this.hooks);
};
