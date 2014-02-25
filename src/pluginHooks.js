Handsontable.PluginHookClass = (function () {

  var Hooks = function () {
    return {
      // Hooks
      beforeInitWalkontable: [],

      beforeInit: [],
      beforeRender: [],
      beforeChange: [],
      beforeRemoveCol: [],
      beforeRemoveRow: [],
      beforeValidate: [],
      beforeGet: [],
      beforeSet: [],
      beforeGetCellMeta: [],
      beforeAutofill: [],
      beforeKeyDown: [],

      afterInit : [],
      afterLoadData : [],
      afterUpdateSettings: [],
      afterRender : [],
      afterRenderer : [],
      afterChange : [],
      afterValidate: [],
      afterGetCellMeta: [],
      afterGetColHeader: [],
      afterGetColWidth: [],
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

      // Modifiers
      modifyCol: []
    }
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

    this.hooks = Hooks();

    this.legacy = legacy;

  }

  PluginHookClass.prototype.add = function (key, fn) {
    //if fn is array, run this for all the array items
    if (Handsontable.helper.isArray(fn)) {
      for (var i = 0, len = fn.length; i < len; i++) {
        this.add(key, fn[i]);
      }
    }
    else {
      // provide support for old versions of HOT
      if (key in legacy) {
        key = legacy[key];
      }

      if (typeof this.hooks[key] === "undefined") {
        this.hooks[key] = [];
      }

      if (this.hooks[key].indexOf(fn) == -1) {
        this.hooks[key].push(fn); //only add a hook if it has not already be added (adding the same hook twice is now silently ignored)
      }
    }
    return this;
  };

  PluginHookClass.prototype.once = function(key, fn){

    if(Handsontable.helper.isArray(fn)){

      for(var i = 0, len = fn.length; i < len; i++){
        fn[i].runOnce = true;
        this.add(key, fn[i]);
      }

    } else {
      fn.runOnce = true;
      this.add(key, fn);

    }

  };

  PluginHookClass.prototype.remove = function (key, fn) {
    var status = false;

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    if (typeof this.hooks[key] !== 'undefined') {

      for (var i = 0, leni = this.hooks[key].length; i < leni; i++) {

        if (this.hooks[key][i] == fn) {
          delete this.hooks[key][i].runOnce;
          this.hooks[key].splice(i, 1);
          status = true;
          break;
        }

      }

    }

    return status;
  };

  PluginHookClass.prototype.run = function (instance, key, p1, p2, p3, p4, p5) {

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    if (typeof this.hooks[key] !== 'undefined') {

      //Make a copy of handler array
      var handlers = Array.prototype.slice.call(this.hooks[key]);

      for (var i = 0, leni = handlers.length; i < leni; i++) {
        handlers[i].call(instance, p1, p2, p3, p4, p5);

        if(handlers[i].runOnce){
          this.remove(key, handlers[i]);
        }
      }

    }

  };

  PluginHookClass.prototype.execute = function (instance, key, p1, p2, p3, p4, p5) {
    var res, handlers;

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
      if (typeof this.hooks[key] !== 'undefined') {

        handlers = Array.prototype.slice.call(this.hooks[key]);

        for (var i = 0, leni = handlers.length; i < leni; i++) {

          res = handlers[i].call(instance, p1, p2, p3, p4, p5);
          if (res !== void 0) {
            p1 = res;
          }

          if(handlers[i].runOnce){
            this.remove(key, handlers[i]);
          }

          if(res === false){ //if any handler returned false
            return false; //event has been cancelled and further execution of handler queue is being aborted
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
