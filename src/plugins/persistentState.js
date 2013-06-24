/*
*
* Plugin enables saving table state
*
* */


function Storage(prefix){

  $.cookie.json = true;

  var savedKeys = [];

  this.saveValue = function(key, value){
    //TODO: Add ability to save to LocalStorage
    $.cookie(prefix+'_'+key, value);

    if(savedKeys.indexOf(key) == -1){
      savedKeys.push(key);
    }

  }

  this.loadValue = function(key, defaultValue){

    key = typeof key != 'undefined' ? key : defaultValue;

    //TODO: Add ability to load from LocalStorage
    return $.cookie(prefix+'_'+key);

  }

  this.reset = function(){
    for (var index in savedKeys){
      $.removeCookie(prefix+'_'+savedKeys[index]);
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