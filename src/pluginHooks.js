Handsontable.PluginHooks = {
  hooks: {
    beforeInit: [],
    afterInit: [],
    afterLoadData: [],
    beforeRender: [],
    afterRender: [],
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

  run: function (instance, hook, args) {
    for (var i = 0, ilen = this.hooks[hook].length; i < ilen; i++) {
      if (args) {
        this.hooks[hook][i].apply(instance, args);
      }
      else {
        this.hooks[hook][i].call(instance);
      }
    }
  }
};