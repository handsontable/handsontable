Handsontable.PluginHookMap = function () {
  this.beforeInitWalkontable = [];

  this.beforeInit = [];
  this.beforeRender = [];
  this.beforeChange = [];
  this.beforeGet = [];
  this.beforeSet = [];
  this.beforeGetCellMeta = [];
  this.beforeAutofill = [];
  this.beforeKeyDown = [];

  this.afterInit = [];
  this.afterLoadData = [];
  this.afterRender = [];
  this.afterChange = [];
  this.afterGetCellMeta = [];
  this.afterGetColHeader = [];
  this.afterGetColWidth = [];
  this.afterDestroy = [];
  this.afterRemoveRow = [];
  this.afterCreateRow = [];
  this.afterRemoveCol = [];
  this.afterCreateCol = [];
  this.afterColumnResize = [];
  this.afterColumnMove = [];
  this.afterDeselect = [];
  this.afterSelection = [];
  this.afterSelectionByProp = [];
  this.afterSelectionEnd = [];
  this.afterSelectionEndByProp = [];
  this.afterCopyLimit = [];
};

/*
Handsontable.PluginHookClass = function () {

  this.hooks = new Handsontable.PluginHookMap();

  this.legacyEventMap = {
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

}

Handsontable.PluginHookClass.prototype.add = function (key, fn) {
  // provide support for old versions of HOT
  if (key in legacyEventMap) {
    key = legacyEventMap[key];
  }

  this.hooks[key].push(fn);

  return this;
}

Handsontable.PluginHookClass.prototype.remove = function (key, fn) {
  // provide support for old versions of HOT
  if (key in legacyEventMap) {
    key = legacyEventMap[key];
  }

  for (var i = 0, len = hooks[key].length; i < len; i++) {
    if (hooks[key][i] == fn) {
      hooks[key].splice(i, 1);
      return true;
    }
  }
  return false;
}

Handsontable.PluginHookClass.prototype.run = function (instance, key, p1, p2, p3, p4, p5) {
  // provide support for old versions of HOT
  if (key in legacyEventMap) {
    key = legacyEventMap[key];
  }

  //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
  if (typeof hooks[key] !== 'undefined') {
    for (var i = 0, len = hooks[key].length; i < len; i++) {
      hooks[key][i].call(instance, p1, p2, p3, p4, p5);
    }
  }
}
*/
////

Handsontable.PluginHooks = (function () {
  var hooks = new Handsontable.PluginHookMap();

  var legacyEventMap = {
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

  return {
    add: function (key, fn) {
      // provide support for old versions of HOT
      if (key in legacyEventMap) {
        key = legacyEventMap[key];
      }

      hooks[key].push(fn);
    },
    remove: function (key, fn) {
      // provide support for old versions of HOT
      if (key in legacyEventMap) {
        key = legacyEventMap[key];
      }

      for (var i = 0, len = hooks[key].length; i < len; i++) {
        if (hooks[key][i] == fn) {
          hooks[key].splice(i, 1);
          return true;
        }
      }
      return false;
    },
    run: function (instance, key, p1, p2, p3, p4, p5) {
      // provide support for old versions of HOT
      if (key in legacyEventMap) {
        key = legacyEventMap[key];
      }

      //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
      if (typeof hooks[key] !== 'undefined') {
        for (var i = 0, len = hooks[key].length; i < len; i++) {
          hooks[key][i].call(instance, p1, p2, p3, p4, p5);
        }
      }
    }
  }
})();

Handsontable.PluginModifiers = {
  modifiers: {
    col: []
  },

  push: function (key, fn) {
    this.modifiers[key].push(fn);
  },

  unshift: function (key, fn) {
    this.modifiers[key].unshift(fn);
  },

  run: function (instance, key, p1, p2, p3, p4, p5) {
    for (var i = 0, ilen = this.modifiers[key].length; i < ilen; i++) {
      p1 = this.modifiers[key][i].call(instance, p1, p2, p3, p4, p5);
    }
    return p1;
  }
};