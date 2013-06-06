Handsontable.PluginHookClass = (function () {

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

  function PluginHookClass () {

    this.hooks = {
      // Hooks
      beforeInitWalkontable : [],

      beforeInit : [],
      beforeRender : [],
      beforeChange : [],
      beforeGet : [],
      beforeSet : [],
      beforeGetCellMeta : [],
      beforeAutofill : [],
      beforeKeyDown : [],

      afterInit : [],
      afterLoadData : [],
      afterRender : [],
      afterChange : [],
      afterGetCellMeta : [],
      afterGetColHeader : [],
      afterGetColWidth : [],
      afterDestroy : [],
      afterRemoveRow : [],
      afterCreateRow : [],
      afterRemoveCol : [],
      afterCreateCol : [],
      afterColumnResize : [],
      afterColumnMove : [],
      afterDeselect : [],
      afterSelection : [],
      afterSelectionByProp : [],
      afterSelectionEnd : [],
      afterSelectionEndByProp : [],
      afterCopyLimit : [],

      // Modifiers
      modifyCol : []
    };

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

    if (fn instanceof Array) {
      for (var i = 0, len = fn.length; i < len; i++) {
        this.hooks[key].push(fn[i]);
      }
    } else {
      this.hooks[key].push(fn);
    }

    return this;
  };

  PluginHookClass.prototype.once = function (key, fn) {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    var instance = this
      , _remove = this.remove
      , wrapper = function () {
        _remove.call(instance, key, wrapper);

        return fn.apply(instance, arguments);
      };

    return this.add(key, wrapper);
  };

  PluginHookClass.prototype.remove = function (key, fn) {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    for (var i = 0, len = this.hooks[key].length; i < len; i++) {
      if (this.hooks[key][i] == fn) {
        this.hooks[key].splice(i, 1);
        return true;
      }
    }
    return false;
  }

  PluginHookClass.prototype.run = function (instance, key, p1, p2, p3, p4, p5) {

    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    if (typeof this.hooks[key] !== 'undefined') {
      for (var i = 0, len = this.hooks[key].length; i < len; i++) {
        this.hooks[key][i].call(instance, p1, p2, p3, p4, p5);
      }
    }
  }

  PluginHookClass.prototype.execute = function (instance, key, p1, p2, p3, p4, p5) {
    // provide support for old versions of HOT
    if (key in legacy) {
      key = legacy[key];
    }

    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    if (typeof this.hooks[key] !== 'undefined') {
      for (var i = 0, len = this.hooks[key].length; i < len; i++) {
        p1 = this.hooks[key][i].call(instance, p1, p2, p3, p4, p5);
      }
    }

    return p1;
  }

  return PluginHookClass;

})();

Handsontable.PluginHooks = new Handsontable.PluginHookClass();