
/**
 * @description
 * Handsontable events are the common interface that function in 2 ways: as __callbacks__ and as __plugin hooks__.
 *
 * @constructor Handsontable.Hooks
 * @example
 *
 * // __Using events as callbacks:__
 * ...
 * $('div#example1').handsontable({
 *   afterChange: function(changes, source) {
 *     $.ajax({
 *       url: "save.php",
 *       data: change
 *     });
 *   }
 * });
 * ...
 *
 * // __Using events as plugin hooks:__
 * ...
 * $('#example1').handsontable({
 *   'myPlugin': true
 * });
 *
 * $('#example2').handsontable({
 *   'myPlugin': false
 * });
 *
 * // global hook
 * Handsontable.PluginHooks.add('afterChange', function() {
 *   if(this.getSettings().myPlugin) {
 *     // function body - will only run in #example1
 *   }
 * });
 *
 * // local hook (has same effect as a callback)
 * $('#example2').handsontable('getInstance').addHook('afterChange', function() {
 *   // function body - will only run in #example2
 * });
 * ...
 */
Handsontable.PluginHookClass = (function () {

  var Hooks = function () {
    return {
      /**
       * Callback fired before Walkontable instance is initiated.
       *
       * @since 0.11
       * @event Handsontable.Hooks#beforeInitWalkontable
       */
      beforeInitWalkontable: [],

      /**
       * @description
       * Callback fired before Handsontable instance is initiated.
       *
       * __Note:__ This can be set only by global PluginHooks instance.
       *
       * @event Handsontable.Hooks#beforeInit
       */
      beforeInit: [],

      /**
       * Callback fired before Handsontable table is rendered.
       *
       * @event Handsontable.Hooks#beforeRender
       * @param {Boolean} isForced If true rendering was triggered by a change of settings or data; or false if
       *                           rendering was triggered by scrolling or moving selection.
       */
      beforeRender: [],

      /**
       * Callback fired before setting range is ended.
       *
       * @event Handsontable.Hooks#beforeSetRangeEnd
       * @param {Array} coords WalkontableCellCoords array.
       */
      beforeSetRangeEnd: [],

      /**
       * @event Handsontable.Hooks#beforeDrawBorders
       */
      beforeDrawBorders: [],

      /**
       * Callback fired before one or more cells is changed. Its main purpose is to alter changes silently before input.
       *
       * @example
       * // To disregard a single change, set changes[i] to null or remove it from array using changes.splice(i, 1).
       * ...
       * $('div#example1').handsontable({
       *   beforeChange: function(changes, source) {
       *     // [[row, prop, oldVal, newVal], ...]
       *     changes[0] = null;
       *   }
       * });
       * ...
       *
       * // To alter a single change, overwrite the desired value to changes[i][3].
       * ...
       * $('div#example1').handsontable({
       *   beforeChange: function(changes, source) {
       *     // [[row, prop, oldVal, newVal], ...]
       *     changes[0][1] = 10;
       *   }
       * });
       * ...
       *
       * // To cancel all edit, return false from the callback or set array length to 0 (changes.length = 0).
       * ...
       * $('div#example1').handsontable({
       *   beforeChange: function(changes, source) {
       *     // [[row, prop, oldVal, newVal], ...]
       *     return false;
       *   }
       * });
       * ...
       *
       * @event Handsontable.Hooks#beforeChange
       * @param {Array} changes 2D array containing information about each of the edited cells.
       * @param {String} source The name of a source of changes.
       */
      beforeChange: [],

      /**
       * @event Handsontable.Hooks#beforeChangeRender
       * @since 0.11
       */
      beforeChangeRender: [],

      /**
       * Callback is fired when one or more columns are about to be removed.
       *
       * @event Handsontable.Hooks#beforeRemoveCol
       * @param {Number} index Index of starter column.
       * @param {Number} amount Amount of columns to be removed.
       */
      beforeRemoveCol: [],

      /**
       * Callback is fired when one or more rows are about to be removed.
       *
       * @event Handsontable.Hooks#beforeRemoveRow
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
       * @event Handsontable.Hooks#beforeValidate
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
       * @event Handsontable.Hooks#beforeGetCellMeta
       * @param {Number} row
       * @param {Number} col
       * @param {Object} cellProperties
       */
      beforeGetCellMeta: [],

      /**
       * @event Handsontable.Hooks#beforeAutofill
       * @param {Object} start Object containing information about first filled cell: `{row: 2, col: 0}`
       * @param {Object} end Object containing information about last filled cell: `{row: 4, col: 1}`
       * @param {Array} data 2D array containing information about fill pattern: `[["1", "Ted"], ["1", "John"]]`
       */
      beforeAutofill: [],

      /**
       * Callback fired before keydown event is handled. It can be used to overwrite default key bindings.
       * Caution - in your `beforeKeyDown` handler you need to call `event.stopImmediatePropagation()` to prevent default key behavior.
       *
       * @event Handsontable.Hooks#beforeKeyDown
       * @since 0.9.0
       * @param {Object} event Original DOM event
       */
      beforeKeyDown: [],

      /**
       * @event Handsontable.Hooks#beforeOnCellMouseDown
       */
      beforeOnCellMouseDown: [],

      /**
       * @event Handsontable.Hooks#beforeTouchScroll
       */
      beforeTouchScroll: [],

      /**
       * Callback fired after Handsontable instance is initiated.
       *
       * @event Handsontable.Hooks#afterInit
       */
      afterInit : [],

      /**
       * Callback fired after new data is loaded (by `loadData` method) into the data source array.
       *
       * @event Handsontable.Hooks#afterLoadData
       */
      afterLoadData : [],

      /**
       * @event Handsontable.Hooks#afterLoadData
       */
      afterUpdateSettings: [],

      /**
       * Callback fired after Handsontable table is rendered.
       *
       * @event Handsontable.Hooks#afterRender
       * @param {Boolean} isForced Is `true` if rendering was triggered by a change of settings or data; or `false` if
       *                           rendering was triggered by scrolling or moving selection.
       */
      afterRender : [],

      /**
       * @event Handsontable.Hooks#afterRenderer
       * @since 0.11
       * @param {Object} TD
       * @param {Number} row
       * @param {Number} col
       * @param {String} prop
       * @param {String} value
       * @param {Object} cellProperties
       */
      afterRenderer : [],

      /**
       * @description
       * Callback fired after one or more cells is changed. Its main use case is to save the input.
       *
       * __Note:__ For performance reasons, the `changes` array is null for `"loadData"` source.
       *
       * @event Handsontable.Hooks#afterChange
       * @param {Array} changes 2D array containing information about each of the edited cells `[[row, prop, oldVal, newVal], ...]`
       * @param {String} source Is one of the strings: `"alter", "empty", "edit", "populateFromArray", "loadData", "autofill", "paste"`.
       */
      afterChange : [],

      /**
       * @description
       * A plugin hook executed after validator function, only if validator function is defined.
       * Validation result is the first parameter. This can be used to determinate if validation passed successfully or not.
       *
       * __You can cancel current change by returning false.__
       *
       * @event Handsontable.Hooks#afterValidate
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
       * @event Handsontable.Hooks#afterGetCellMeta
       * @param {Number} row
       * @param {Number} col
       * @param {Object} cellProperties
       */
      afterGetCellMeta: [],

      /**
       * Called after cell meta was changed, e.g. using the context menu.
       *
       * @event Handsontable.Hooks#afterSetCellMeta
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
       * @event Handsontable.Hooks#afterGetColHeader
       * @param {Number} col
       * @param {Element} TH
       */
      afterGetColHeader: [],

      /**
       * @event Handsontable.Hooks#afterGetRowHeader
       */
      afterGetRowHeader: [],

      /**
       * Callback fired after destroing Handsontable instance.
       *
       * @event Handsontable.Hooks#afterDestroy
       */
      afterDestroy: [],

      /**
       * Callback is fired when one or more rows are removed.
       *
       * @event Handsontable.Hooks#afterRemoveRow
       * @param {Number} index Is an index of starter row.
       * @param {Number} amount Is an anount of removed rows.
       */
      afterRemoveRow: [],

      /**
       * Callback is fired when a new row is created.
       *
       * @event Handsontable.Hooks#afterCreateRow
       * @param {Number} index Represents the index of first newly created row in the data source array.
       * @param {Number} amount Number of newly created rows in the data source array.
       */
      afterCreateRow: [],

      /**
       * Callback is fired when one or more columns are removed.
       *
       * @event Handsontable.Hooks#afterRemoveCol
       * @param {Number} index Is an index of starter column.
       * @param {Number} amount Is an amount of removed columns.
       */
      afterRemoveCol: [],

      /**
       * Callback is fired when a new column is created.
       *
       * @event Handsontable.Hooks#afterCreateCol
       * @param {Number} index Represents the index of first newly created column in the data source array.
       * @param {Number} amount Number of newly created columns in the data source array.
       */
      afterCreateCol: [],

      /**
       * Event called when current cell is deselected.
       *
       * @event Handsontable.Hooks#afterDeselect
       */
      afterDeselect: [],

      /**
       * Callback fired while one or more cells are being selected (on mouse move).
       *
       * @event Handsontable.Hooks#afterSelection
       * @param {Number} r Selection start row
       * @param {Number} c Selection start column
       * @param {Number} r2 Selection end row
       * @param {Number} c2 Selection end column
       */
      afterSelection: [],

      /**
       * The same as above, but data source object property name is used instead of the column number.
       *
       * @event Handsontable.Hooks#afterSelectionByProp
       * @param {Number} r Selection start row
       * @param {String} p Selection start data source object property
       * @param {Number} r2 Selection end row
       * @param {String} p2 Selection end data source object property
       */
      afterSelectionByProp: [],

      /**
       * Callback fired after one or more cells are selected (on mouse up).
       *
       * @event Handsontable.Hooks#afterSelectionEnd
       * @param {Number} r Selection start row
       * @param {Number} c Selection start column
       * @param {Number} r2 Selection end row
       * @param {Number} c2 Selection end column
       */
      afterSelectionEnd: [],

      /**
       * The same as above, but data source object property name is used instead of the column number.
       *
       * @event Handsontable.Hooks#afterSelectionEndByProp
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
       * @event Handsontable.Hooks#afterOnCellMouseDown
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
       * @event Handsontable.Hooks#afterOnCellMouseOver
       * @since 0.11
       * @param {Object} event
       * @param {Object} coords
       * @param {Object} TD
       */
      afterOnCellMouseOver: [],

      /**
       * @event Handsontable.Hooks#afterOnCellCornerMouseDown
       * @since 0.11
       * @param {Object} event
       */
      afterOnCellCornerMouseDown: [],

      /**
       * @event Handsontable.Hooks#afterScrollVertically
       * @since 0.11
       */
      afterScrollVertically: [],

      /**
       * @event Handsontable.Hooks#afterScrollHorizontally
       * @since 0.11
       */
      afterScrollHorizontally: [],

      /**
       * Callback fired after reset cell's meta.
       *
       * @event Handsontable.Hooks#afterCellMetaReset
       * @since 0.11
       */
      afterCellMetaReset: [],

      /**
       * @event Handsontable.Hooks#afterIsMultipleSelectionCheck
       */
      afterIsMultipleSelectionCheck: [],

      /**
       * @event Handsontable.Hooks#afterDocumentKeyDown
       */
      afterDocumentKeyDown: [],

      /**
       * @event Handsontable.Hooks#afterMomentumScroll
       */
      afterMomentumScroll: [],
      beforeCellAlignment: [],

      /**
       * Callback fired after modify column's width.
       *
       * @event Handsontable.Hooks#modifyColWidth
       * @since 0.11
       * @param {Number} width
       * @param {Number} col
       */
      modifyColWidth: [],

      /**
       * Callback fired after modify height of row.
       *
       * @event Handsontable.Hooks#modifyRowHeight
       * @since 0.11
       * @param {Number} height
       * @param {Number} row
       */
      modifyRowHeight: [],

      /**
       * Callback fired after row modify.
       *
       * @event Handsontable.Hooks#modifyRow
       * @since 0.11
       * @param {Number} row
       */
      modifyRow: [],

      /**
       * Callback fired after column modify.
       *
       * @event Handsontable.Hooks#modifyCol
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
     * @event Handsontable.Hooks#onBeforeChange
     * @deprecated
     * @param {Array} changes
     * @param {String} source
     */
    onBeforeChange: "beforeChange",

    /**
     * Now event is called {@link event:afterChange}.
     *
     * @event Handsontable.Hooks#onChange
     * @deprecated
     * @param {Array} changes
     * @param {String} source
     */
    onChange: "afterChange",

    /**
     * @event Handsontable.Hooks#onCreateRow
     * @deprecated
     */
    onCreateRow: "afterCreateRow",

    /**
     * @event Handsontable.Hooks#onCreateCol
     * @deprecated
     */
    onCreateCol: "afterCreateCol",

    /**
     * Now event is called {@link event:afterSelection}.
     *
     * @event Handsontable.Hooks#onSelection
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
     * @event Handsontable.Hooks#onCopyLimit
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
     * @event Handsontable.Hooks#onSelectionEnd
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
     * @event Handsontable.Hooks#onSelectionByProp
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
     * @event Handsontable.Hooks#onSelectionEndByProp
     * @deprecated
     * @param {Number} r
     * @param {String} p
     * @param {Number} r2
     * @param {String} p2
     */
    onSelectionEndByProp: "afterSelectionEndByProp"
  };

  function PluginHookClass() {
    /* jshint ignore:start */
    this.hooks = Hooks();
    /* jshint ignore:end */
    this.globalBucket = {};
    this.legacy = legacy;

  }

  /**
   * Get hook bucket based on Handsontable instance or if instance is `undefined` get global hook bucked.
   *
   * @memberof Handsontable.Hooks#
   * @function getBucket
   * @param {Object} instance Instance of Handsontable
   * @returns {Object} Returns global or handsontable instance bucket
   */
  PluginHookClass.prototype.getBucket = function (instance) {
    if(instance) {
      if(!instance.pluginHookBucket) {
        instance.pluginHookBucket = {};
      }
      return instance.pluginHookBucket;
    }
    return this.globalBucket;
  };

  /**
   * @memberof Handsontable.Hooks#
   * @function add
   * @param {String} key Hook/Event name
   * @param {Function} fn Callback function
   * @param {Object} instance Instance of Handsontable
   * @returns {Handsontable.Hooks} Instance of Handsontable.Hooks
   */
  PluginHookClass.prototype.add = function (key, fn, instance) {
    //if fn is array, run this for all the array items
    if (Array.isArray(fn)) {
      for (var i = 0, len = fn.length; i < len; i++) {
        this.add(key, fn[i]);
      }
    }
    else {
      // provide support for old versions of HOT
      if (key in legacy) {
        key = legacy[key];
      }

      var bucket = this.getBucket(instance);

      if (typeof bucket[key] === "undefined") {
        bucket[key] = [];
      }

      fn.skip = false;

      if (bucket[key].indexOf(fn) == -1) {
        bucket[key].push(fn); //only add a hook if it has not already been added (adding the same hook twice is now silently ignored)
      }
    }
    return this;
  };

  /**
   * @memberof Handsontable.Hooks#
   * @function once
   * @param {String} key Hook/Event name
   * @param {Function} fn Callback function
   * @param {Object} instance of Handsontable
   */
  PluginHookClass.prototype.once = function(key, fn, instance){

    if(Array.isArray(fn)){

      for(var i = 0, len = fn.length; i < len; i++){
        fn[i].runOnce = true;
        this.add(key, fn[i], instance);
      }

    } else {
      fn.runOnce = true;
      this.add(key, fn, instance);

    }

  };

  /**
   * @memberof Handsontable.Hooks#
   * @function remove
   * @param {String} key Hook/Event name
   * @param {Function} fn Callback function
   * @param {Object} instance of Handsontable
   * @return {Boolean}
   */
  PluginHookClass.prototype.remove = function (key, fn, instance) {
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
   * @memberof Handsontable.Hooks#
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
  PluginHookClass.prototype.run = function (instance, key, p1, p2, p3, p4, p5, p6) {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }
    p1 = this._runBucket(this.globalBucket, instance, key, p1, p2, p3, p4, p5, p6);
    p1 = this._runBucket(this.getBucket(instance), instance, key, p1, p2, p3, p4, p5, p6);

    return p1;
  };

  PluginHookClass.prototype._runBucket = function (bucket, instance, key, p1, p2, p3, p4, p5, p6) {
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

  PluginHookClass.prototype.destroy = function (instance) {
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
   * @memberof Handsontable.Hooks#
   * @function register
   * @private
   * @param key {String}
   */
  PluginHookClass.prototype.register = function (key) {
    if (!this.isRegistered(key)) {
      this.hooks[key] = [];
    }
  };

  /**
   * Deregisters a hook name (removes it from the list of known hook names)
   *
   * @memberof Handsontable.Hooks#
   * @function deregister
   * @private
   * @param key {String}
   */
  PluginHookClass.prototype.deregister = function (key) {
    delete this.hooks[key];
  };

  /**
   * Returns boolean information if a hook by such name has been registered
   *
   * @memberof Handsontable.Hooks#
   * @function isRegistered
   * @private
   * @param key {String}
   */
  PluginHookClass.prototype.isRegistered = function (key) {
    return (typeof this.hooks[key] !== "undefined");
  };

  /**
   * Returns an array of registered hooks
   *
   * @memberof Handsontable.Hooks#
   * @function getRegistered
   * @private
   * @returns {Array}
   */
  PluginHookClass.prototype.getRegistered = function () {
    return Object.keys(this.hooks);
  };

  return PluginHookClass;

})();

Handsontable.hooks = new Handsontable.PluginHookClass();
Handsontable.PluginHooks = Handsontable.hooks; //in future move this line to legacy.js
