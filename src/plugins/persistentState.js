/*
*
* Plugin enables saving table state
*
* */


function Storage(prefix){

  var savedKeys;

  var saveSavedKeys = function(){
    window.localStorage[prefix+'__'+'persistentStateKeys'] = JSON.stringify(savedKeys);
  }

  var loadSavedKeys = function(){
    var keysJSON = window.localStorage[prefix+'__'+'persistentStateKeys'];
    var keys = typeof keysJSON == 'string' ? JSON.parse(keysJSON) : void 0;
    savedKeys =  keys ? keys : [];
  };

  loadSavedKeys();

  this.saveValue = function(key, value){
    window.localStorage[prefix+'_'+key] = JSON.stringify(value);
    if(savedKeys.indexOf(key) == -1){
      savedKeys.push(key);
      saveSavedKeys(savedKeys);
    }

  };

  this.loadValue = function(key, defaultValue){

    key = typeof key != 'undefined' ? key : defaultValue;

    var value = window.localStorage[prefix+'_'+key];

    return typeof value == "undefined" ? void 0 : JSON.parse(value);

  };

  this.reset = function(){
    for (var index = 0;  index < savedKeys.length; index++){
      window.localStorage.removeItem(prefix+'_'+savedKeys[index]);
    }
    this.clearSavedKeys()
  };

  this.clearSavedKeys = function(){
    savedKeys = [];
    saveSavedKeys();
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
      (function(persistentRule){
        if(!persistentRule.hook){
          throw new Error('No hook specified for persistent rule: \"' + ruleName + '\"');
        }

        instance.PluginHooks.add(persistentRule.hook, function () {
          persistentRule.save.call(instance, instance.storage);
        });
      })(pluginSettings[ruleName]);

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