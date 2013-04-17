Handsontable.PluginHooks = (function () {
  var hooks = {
    beforeInit: [],
    afterInit: [],
    afterLoadData: [],
    beforeRender: [],
    afterRender: [],
    beforeGet: [],
    beforeSet: [],
    beforeGetCellMeta: [],
    afterGetCellMeta: [],
    afterGetColHeader: [],
    afterGetColWidth: [],
    walkontableConfig: [],
    afterDestroy: []
  };

  return {
    add: function (key, fn) {
      hooks[key].push(fn);
    },
    remove: function (key, fn) {
      for(var i = 0, len = hooks[key].length; i < len; i++) {
        if (hooks[key][i] == fn) {
          hooks[key].splice(i, 1);
          return true;
        }
      }
      return false;
    },
    run: function (instance, key, p1, p2, p3, p4, p5) {
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