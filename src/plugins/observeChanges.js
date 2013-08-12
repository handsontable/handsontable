(function HandsontableObserveChanges() {

  Handsontable.PluginHooks.add('afterLoadData', init);
  Handsontable.PluginHooks.add('afterUpdateSettings', init);

  function init() {
    var instance = this;
    var pluginEnabled = instance.getSettings().observeChanges;

    if (!instance.observer && pluginEnabled) {
      createObserver.call(instance);
      bindEvents.call(instance);

    } else if (!pluginEnabled){
      destroy.call(instance);
    }
  }

  function createObserver(){
    var instance = this;

    instance.observeChangesActive = true;

    instance.pauseObservingChanges = function(){
      instance.observeChangesActive = false;
    };

    instance.resumeObservingChanges = function(){
      instance.observeChangesActive = true;
    };

    instance.observer = jsonpatch.observe(instance.getData(), function () {
      if(instance.observeChangesActive){
        instance.render();
      }

      instance.runHooks('afterChangesObserved');
    });
  }

  function destroy(){
    var instance = this;

    if (instance.observer){
      destroyObserver.call(instance);
      unbindEvents.call(instance);
    }
  }

  function destroyObserver(){
    var instance = this;

    jsonpatch.unobserve(instance.getData(), instance.observer);
    delete instance.observeChangesActive;
    delete instance.pauseObservingChanges;
    delete instance.resumeObservingChanges;
  }

  function bindEvents(){
    var instance = this;
    instance.addHook('afterDestroy', destroy);

    instance.addHook('afterCreateRow', afterTableAlter);
    instance.addHook('afterRemoveRow', afterTableAlter);

    instance.addHook('afterCreateCol', afterTableAlter);
    instance.addHook('afterRemoveCol', afterTableAlter);

    instance.addHook('afterChange', function(changes, source){
      if(source != 'loadData'){
        afterTableAlter.call(this);
      }
    });
  }

  function unbindEvents(){
    var instance = this;
    instance.removeHook('afterDestroy', destroy);

    instance.removeHook('afterCreateRow', afterTableAlter);
    instance.removeHook('afterRemoveRow', afterTableAlter);

    instance.removeHook('afterCreateCol', afterTableAlter);
    instance.removeHook('afterRemoveCol', afterTableAlter);

    instance.removeHook('afterChange', afterTableAlter);
  }

  function afterTableAlter(){
    var instance = this;

    instance.pauseObservingChanges();

    instance.addHookOnce('afterChangesObserved', function(){
      instance.resumeObservingChanges();
    });

  }
})();

