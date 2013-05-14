Handsontable.PluginHooks = (function () {
  var hooks = {
    beforeInitWalkontable: [],

    beforeInit: [],
    beforeRender: [],
    beforeChange: [],
    beforeGet: [],
    beforeSet: [],
    beforeGetCellMeta: [],
    beforeAutofill : [],

    afterInit: [],
    afterLoadData: [],
    afterRender: [],
    afterChange: [],
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
    afterDeselect: [],
    afterSelection: [],
    afterSelectionByProp: [],
    afterSelectionEnd: [],
    afterSelectionEndByProp: [],
    afterCopyLimit: []
  };

  var eventMap = {
    onBeforeChange : "beforeChange",
    onChange       : "afterChange",
    onCreateRow    : "afterCreateRow",
    onCreateCol    : "afterCreateCol",
    onSelection    : "afterSelection",
    onCopyLimit    : "afterCopyLimit",
    onSelectionEnd : "afterSelectionEnd",
    onSelectionByProp: "afterSelectionByProp",
    onSelectionEndByProp: "afterSelectionEndByProp"
  };

  return {
    add: function (key, fn) {
      // provide support for old versions of HOT
      if (key in eventMap) {
        key = eventMap[key];
      }

      hooks[key].push(fn);
    },
    remove: function (key, fn) {
      // provide support for old versions of HOT
      if (key in eventMap) {
        key = eventMap[key];
      }

      for(var i = 0, len = hooks[key].length; i < len; i++) {
        if (hooks[key][i] == fn) {
          hooks[key].splice(i, 1);
          return true;
        }
      }
      return false;
    },
    run: function (instance, key, p1, p2, p3, p4, p5) {
      // provide support for old versions of HOT
      if (key in eventMap) {
        key = eventMap[key];
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