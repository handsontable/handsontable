Handsontable.PluginHookClass = (function () {

  var Hooks = function () {
    return {
      // Hooks
      beforeInitWalkontable: [],
      beforeInit: [],
      beforeRender: [],
      beforeSetRangeEnd: [],
      beforeDrawBorders: [],
      beforeChange: [],
      beforeChangeRender: [],
      beforeRemoveCol: [],
      beforeRemoveRow: [],
      beforeValidate: [],
      beforeGetCellMeta: [],
      beforeAutofill: [],
      beforeKeyDown: [],
      beforeOnCellMouseDown: [],
      beforeTouchScroll: [],
      afterInit : [],
      afterLoadData : [],
      afterUpdateSettings: [],
      afterRender : [],
      afterRenderer : [],
      afterChange : [],
      afterValidate: [],
      afterGetCellMeta: [],
      afterSetCellMeta: [],
      afterGetColHeader: [],
      afterGetRowHeader: [],
      afterDestroy: [],
      afterRemoveRow: [],
      afterCreateRow: [],
      afterRemoveCol: [],
      afterCreateCol: [],
      afterDeselect: [],
      afterSelection: [],
      afterSelectionByProp: [],
      afterSelectionEnd: [],
      afterSelectionEndByProp: [],
      afterOnCellMouseDown: [],
      afterOnCellMouseOver: [],
      afterOnCellCornerMouseDown: [],
      afterScrollVertically: [],
      afterScrollHorizontally: [],
      afterCellMetaReset: [],
      afterIsMultipleSelectionCheck: [],
      afterDocumentKeyDown: [],
      afterMomentumScroll: [],

      // Modifiers
      modifyColWidth: [],
      modifyRowHeight: [],
      modifyRow: [],
      modifyCol: []
    };
  };

  var legacy = {
    onBeforeChange: "beforeChange",
    onChange: "afterChange",
    onCreateRow: "afterCreateRow",
    onCreateCol: "afterCreateCol",
    onSelection: "afterSelection",
    onCopyLimit: "afterCopyLimit",
    onSelectionEnd: "afterSelectionEnd",
    onSelectionByProp: "afterSelectionByProp",
    onSelectionEndByProp: "afterSelectionEndByProp"
  };

  function PluginHookClass() {
    /* jshint ignore:start */
    this.hooks = Hooks();
    /* jshint ignore:end */
    this.globalBucket = {};
    this.legacy = legacy;

  }

  PluginHookClass.prototype.getBucket = function (instance) {
    if(instance) {
      if(!instance.pluginHookBucket) {
        instance.pluginHookBucket = {};
      }
      return instance.pluginHookBucket;
    }
    return this.globalBucket;
  };

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

  /**
   * Registers a hook name (adds it to the list of the known hook names). Used by plugins. It is not neccessary to call,
   * register, but if you use it, your plugin hook will be used returned by getRegistered
   * (which itself is used in the demo http://handsontable.com/demo/callbacks.html)
   * @param key {String}
   */
  PluginHookClass.prototype.register = function (key) {
    if (!this.isRegistered(key)) {
      this.hooks[key] = [];
    }
  };

  /**
   * Deregisters a hook name (removes it from the list of known hook names)
   * @param key {String}
   */
  PluginHookClass.prototype.deregister = function (key) {
    delete this.hooks[key];
  };

  /**
   * Returns boolean information if a hook by such name has been registered
   * @param key {String}
   */
  PluginHookClass.prototype.isRegistered = function (key) {
    return (typeof this.hooks[key] !== "undefined");
  };

  /**
   * Returns an array of registered hooks
   * @returns {Array}
   */
  PluginHookClass.prototype.getRegistered = function () {
    return Object.keys(this.hooks);
  };

  return PluginHookClass;

})();

Handsontable.hooks = new Handsontable.PluginHookClass();
Handsontable.PluginHooks = Handsontable.hooks; //in future move this line to legacy.js
