/*
*
* Plugin enables saving table state
*
* */


function Storage(prefix){

  var savedKeys = [];

  this.saveValue = function(key, value){
    window.localStorage[prefix+'_'+key] = JSON.stringify(value);
    if(savedKeys.indexOf(key) == -1){
      savedKeys.push(key);
    }

  }

  this.loadValue = function(key, defaultValue){

    key = typeof key != 'undefined' ? key : defaultValue;

    var value = window.localStorage[prefix+'_'+key];

    return typeof value == "undefined" ? void 0 : JSON.parse(value);

  }

  this.reset = function(){
    for (var index in savedKeys){
      window.localStorage.removeItem(prefix+'_'+savedKeys[index]);
    }
    savedKeys = [];
  }

}




function HandsontablePersistentState(){
  var plugin = this;


  this.afterInit = function(){
    var instance = this,
        pluginSettings = instance.getSettings()['persistentState'];

    if(!instance.storage){
      instance.storage = new Storage(instance.rootElement[0].id);
    }

    if(!pluginSettings) {
      return;
    }

    instance.resetState = function(){
       instance.storage.reset();
    };

    plugin.attachPersistentRules.call(instance);

    plugin.loadState.call(instance);

  };

  this.attachPersistentRules = function(){
    var instance = this,
      pluginSettings = instance.getSettings()['persistentState'];

    for (var ruleName in pluginSettings){
      var persistentRule = pluginSettings[ruleName];
      if(!persistentRule.hook){
        throw new Error('No hook specified for persistent rule: \"' + ruleName + '\"');
      }

      Handsontable.PluginHooks.add(persistentRule.hook, function () {
        persistentRule.save.call(instance, instance.storage);
      });

    }
  };

  this.loadState = function(){
    var instance = this,
      pluginSettings = instance.getSettings()['persistentState'];

    for (var key in pluginSettings){
      pluginSettings[key].load.call(instance, instance.storage);
    }
  }
}

var htPersistentState = new HandsontablePersistentState();

Handsontable.PluginHooks.add('afterInit', htPersistentState.afterInit);