/*
 *
 * Plugin enables saving table state
 *
 * */


function Storage(prefix) {

  var savedKeys;

  var saveSavedKeys = function () {
    window.localStorage[prefix + '__' + 'persistentStateKeys'] = JSON.stringify(savedKeys);
  };

  var loadSavedKeys = function () {
    var keysJSON = window.localStorage[prefix + '__' + 'persistentStateKeys'];
    var keys = typeof keysJSON == 'string' ? JSON.parse(keysJSON) : void 0;
    savedKeys = keys ? keys : [];
  };

  var clearSavedKeys = function () {
    savedKeys = [];
    saveSavedKeys();
  };

  loadSavedKeys();

  this.saveValue = function (key, value) {
    window.localStorage[prefix + '_' + key] = JSON.stringify(value);
    if (savedKeys.indexOf(key) == -1) {
      savedKeys.push(key);
      saveSavedKeys();
    }

  };

  this.loadValue = function (key, defaultValue) {

    key = typeof key != 'undefined' ? key : defaultValue;

    var value = window.localStorage[prefix + '_' + key];

    return typeof value == "undefined" ? void 0 : JSON.parse(value);

  };

  this.reset = function (key) {
    window.localStorage.removeItem(prefix + '_' + key);
  };

  this.resetAll = function () {
    for (var index = 0; index < savedKeys.length; index++) {
      window.localStorage.removeItem(prefix + '_' + savedKeys[index]);
    }

    clearSavedKeys();
  };

}


(function (StorageClass) {
  function HandsontablePersistentState() {
    var plugin = this;


    this.init = function () {
      var instance = this,
        pluginSettings = instance.getSettings()['persistentState'];

      plugin.enabled = !!(pluginSettings);

      if (!plugin.enabled) {
        removeHooks.call(instance);
        return;
      }

      if (!instance.storage) {
        instance.storage = new StorageClass(instance.rootElement[0].id);
      }

      instance.resetState = plugin.resetValue;

      addHooks.call(instance);

    };

    this.saveValue = function (key, value) {
      var instance = this;

      instance.storage.saveValue(key, value);
    };

    this.loadValue = function (key, saveTo) {
      var instance = this;

      saveTo.value = instance.storage.loadValue(key);
    };

    this.resetValue = function (key) {
      var instance = this;

      if (typeof  key != 'undefined') {
        instance.storage.reset(key);
      } else {
        instance.storage.resetAll();
      }

    };

    var hooks = {
      'persistentStateSave': plugin.saveValue,
      'persistentStateLoad': plugin.loadValue,
      'persistentStateReset': plugin.resetValue
    };

    function addHooks() {
      var instance = this;

      for (var hookName in hooks) {
        if (hooks.hasOwnProperty(hookName) && !hookExists.call(instance, hookName)) {
          instance.PluginHooks.add(hookName, hooks[hookName]);
        }
      }
    }

    function removeHooks() {
      var instance = this;

      for (var hookName in hooks) {
        if (hooks.hasOwnProperty(hookName) && hookExists.call(instance, hookName)) {
          instance.PluginHooks.remove(hookName, hooks[hookName]);
        }
      }
    }

    function hookExists(hookName) {
      var instance = this;
      return instance.PluginHooks.hooks['persistent'].hasOwnProperty(hookName);
    }
  }

  var htPersistentState = new HandsontablePersistentState();
  Handsontable.PluginHooks.add('beforeInit', htPersistentState.init);
  Handsontable.PluginHooks.add('afterUpdateSettings', htPersistentState.init);
})(Storage);
