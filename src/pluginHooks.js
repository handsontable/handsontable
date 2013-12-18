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
      beforeColumnSort: [],

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
      afterColumnResize: [],
      afterColumnMove: [],
      afterColumnSort: [],
      afterDeselect: [],
      afterSelection: [],
      afterSelectionByProp: [],
      afterSelectionEnd: [],
      afterSelectionEndByProp: [],
      afterCopyLimit: [],
      afterOnCellMouseDown: [],
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
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    if (typeof this.hooks[key] === "undefined") {
      this.hooks[key] = [];
    }

    if (Handsontable.helper.isArray(fn)) {
      for (var i = 0, len = fn.length; i < len; i++) {
        this.hooks[key].push(fn[i]);
      }
    } else {
      if (this.hooks[key].indexOf(fn) > -1) {
        throw new Error("Seems that you are trying to set the same plugin hook twice (" + key + ", " + fn + ")"); //error here should help writing bug-free plugins
      }
      this.hooks[key].push(fn);
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

  return PluginHookClass;

})();

Handsontable.PluginHooks = new Handsontable.PluginHookClass();
