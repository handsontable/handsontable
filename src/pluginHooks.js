Handsontable.PluginHooks = {
  hooks: {
    beforeInit: [],
    afterInit: [],
    afterLoadData: [],
    beforeRender: [],
    afterRender: [],
    beforeGet: [],
    beforeSet: [],
    afterGetCellMeta: [],
    afterGetColHeader: [],
    afterGetColWidth: [],
    walkontableConfig: []
  },

  push: function (hook, fn) {
    this.hooks[hook].push(fn);
  },

  unshift: function (hook, fn) {
    this.hooks[hook].unshift(fn);
  },

  run: function (instance, hook, p1, p2, p3, p4, p5) {
    //performance considerations - http://jsperf.com/call-vs-apply-for-a-plugin-architecture
    for (var i = 0, ilen = this.hooks[hook].length; i < ilen; i++) {
      this.hooks[hook][i].call(instance, p1, p2, p3, p4, p5);
    }
  }
};