function HandsontableObserveChanges() {
  this.init = function () {
    var instance = this;
    var pluginEnabled = instance.getSettings().observeChanges;

    if (!instance.observer && pluginEnabled) {
      instance.observer = jsonpatch.observe(instance.getData(), function () {
          instance.render();
      });
    } else if (instance.observer && !pluginEnabled){
      jsonpatch.unobserve(instance.getData(), instance.observer);
    }
  };
}
var htObserveChanges = new HandsontableObserveChanges();

Handsontable.PluginHooks.add('afterLoadData', htObserveChanges.init);
Handsontable.PluginHooks.add('afterUpdateSettings', htObserveChanges.init);