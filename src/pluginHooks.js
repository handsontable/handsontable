Handsontable.PluginHooks = {
  hooks: {
    afterInit: []
  },

  push: function(hook, fn){
    this.hooks[hook].push(fn);
  },

  unshift: function(hook, fn){
    this.hooks[hook].unshift(fn);
  },

  run: function(instance, hook){
    for(var i = 0, ilen = this.hooks[hook].length; i<ilen; i++) {
      this.hooks[hook][i].apply(instance);
    }
  }
};