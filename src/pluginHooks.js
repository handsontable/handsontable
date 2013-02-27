Handsontable.PluginHooks = {
  hooks: {
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
    walkontableConfig: []
  },

  push: function (key, fn) {
    this.hooks[key].push(fn);
  },

  unshift: function (key, fn) {
    this.hooks[key].unshift(fn);
  },

  run: function (instance, key, p1, p2, p3, p4, p5) {
    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    for (var i = 0, ilen = this.hooks[key].length; i < ilen; i++) {
      this.hooks[key][i].call(instance, p1, p2, p3, p4, p5);
    }
  }
};

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