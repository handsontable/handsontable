/**
 * Handsontable UndoRedo class
 */
(function(Handsontable){
  Handsontable.UndoRedo = function (instance) {
    var plugin = this;
    this.instance = instance;
    this.doneActions = [];
    this.undoneActions = [];
    this.ignoreNewActions = false;
    this.collectActions = false;
    this.collectedActions = [];
    instance.addHook("afterChange", function (changes, origin) {
      if(changes){
        var action = new Handsontable.UndoRedo.ChangeAction(changes);
        plugin.done(action);
      }
    });

    instance.addHook("afterCreateRow", function (index, amount, createdAutomatically) {

      if (createdAutomatically) {
        return;
      }

      var action = new Handsontable.UndoRedo.CreateRowAction(index, amount);
      plugin.done(action);
    });

    instance.addHook("beforeRemoveRow", function (index, amount) {
      var originalData = plugin.instance.getData();
      index = ( originalData.length + index ) % originalData.length;
      var removedData = [];
      for(var i = index; i < index + amount; i++) {
            var row = Handsontable.hooks.execute(instance, 'modifyRow', index);
            removedData.push(originalData[row]);
      }
      
      var action = new Handsontable.UndoRedo.RemoveRowAction(index, removedData);
      plugin.done(action);
    });

    instance.addHook("afterCreateCol", function (index, amount, createdAutomatically) {

      if (createdAutomatically) {
        return;
      }

      var action = new Handsontable.UndoRedo.CreateColumnAction(index, amount);
      plugin.done(action);
    });

    instance.addHook("beforeRemoveCol", function (index, amount) {
      var originalData = plugin.instance.getData();
      index = ( plugin.instance.countCols() + index ) % plugin.instance.countCols();
      var removedData = [];

      for (var i = 0, len = originalData.length; i < len; i++) {
        removedData[i] = originalData[i].slice(index, index + amount);
      }

      var headers;
      if(Handsontable.helper.isArray(instance.getSettings().colHeaders)){
        headers = instance.getSettings().colHeaders.slice(index, index + removedData.length);
      }

      var action = new Handsontable.UndoRedo.RemoveColumnAction(index, removedData, headers);
      plugin.done(action);
    });

    instance.addHook('afterFilter', function(currentFilterColumns, previousFilterColumns) {
      var action = new Handsontable.UndoRedo.RevertFilterAction(currentFilterColumns, previousFilterColumns);
      plugin.done(action);
    });

    instance.addHook('afterColumnSort', function(currentSortColumns, previousSortColumns) {
      var action = new Handsontable.UndoRedo.RevertSortAction(currentSortColumns, previousSortColumns);
      plugin.done(action);
    });
  };

  Handsontable.UndoRedo.prototype.collectUndo = function(enableCollection) {    
    this.collectActions = enableCollection;

    if(!this.collectActions && this.collectedActions.length > 0) {
      this.done(new Handsontable.UndoRedo.CollectionAction(this.collectedActions));
      this.collectedActions = [];
    }  
  };

  Handsontable.UndoRedo.prototype.done = function (action) {
    if (!this.ignoreNewActions) {
      if(!this.collectActions) {
        this.doneActions.push(action);
        this.undoneActions.length = 0;
      }
      else {
        this.collectedActions.push(action);
      }

      Handsontable.hooks.run(this.instance, 'undoRedoState', 'undo', this.isUndoAvailable());
      Handsontable.hooks.run(this.instance, 'undoRedoState', 'redo', this.isRedoAvailable());
    }
  };

  /**
   * Undo operation from current revision
   */
  Handsontable.UndoRedo.prototype.undo = function () {
    if (this.isUndoAvailable()) {
      var action = this.doneActions.pop();

      this.ignoreNewActions = true;
      var that = this;

      Handsontable.hooks.run(this.instance, 'undoRedoState', 'undo', this.isUndoAvailable());

      action.undo(this.instance, function () {
        that.ignoreNewActions = false;
        that.undoneActions.push(action);
        Handsontable.hooks.run(that.instance, 'undoRedoState', 'redo', that.isRedoAvailable());
      });
    }
  };

  /**
   * Redo operation from current revision
   */
  Handsontable.UndoRedo.prototype.redo = function () {
    if (this.isRedoAvailable()) {
      var action = this.undoneActions.pop();

      this.ignoreNewActions = true;
      var that = this;

      Handsontable.hooks.run(this.instance, 'undoRedoState', 'redo', this.isRedoAvailable());

      action.redo(this.instance, function () {
        that.ignoreNewActions = false;
        that.doneActions.push(action);
        Handsontable.hooks.run(that.instance, 'undoRedoState', 'undo', that.isUndoAvailable());
      });



    }
  };

  /**
   * Returns true if undo point is available
   * @return {Boolean}
   */
  Handsontable.UndoRedo.prototype.isUndoAvailable = function () {
    return this.doneActions.length > 0;
  };

  /**
   * Returns true if redo point is available
   * @return {Boolean}
   */
  Handsontable.UndoRedo.prototype.isRedoAvailable = function () {
    return this.undoneActions.length > 0;
  };

  /**
   * Clears undo history
   */
  Handsontable.UndoRedo.prototype.clear = function () {
    this.doneActions.length = 0;
    this.undoneActions.length = 0;

    Handsontable.hooks.run(this.instance, 'undoRedoState', 'undo', false);
    Handsontable.hooks.run(this.instance, 'undoRedoState', 'redo', false);
  };

  Handsontable.UndoRedo.Action = function () {
  };
  Handsontable.UndoRedo.Action.prototype.undo = function () {
  };
  Handsontable.UndoRedo.Action.prototype.redo = function () {
  };

  Handsontable.UndoRedo.ChangeAction = function (changes) {
    this.changes = changes;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.ChangeAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.ChangeAction.prototype.undo = function (instance, undoneCallback) {
    var data = $.extend(true, [], this.changes),
        emptyRowsAtTheEnd = instance.countEmptyRows(true),
        emptyColsAtTheEnd = instance.countEmptyCols(true);

    for (var i = 0, len = data.length; i < len; i++) {
      data[i].splice(3, 1);
    }

    instance.addHookOnce('afterChange', undoneCallback);

    instance.setDataAtRowProp(data, null, null, 'undo');

    for (var i = 0, len = data.length; i < len; i++) {
     if(instance.getSettings().minSpareRows &&
      data[i][0] + 1 === instance.countRows()
      && emptyRowsAtTheEnd == instance.getSettings().minSpareRows) {
        instance.alter('remove_row', parseInt(data[i][0]+1,10), instance.getSettings().minSpareRows);

        instance.undoRedo.doneActions.pop();

      }

      if (instance.getSettings().minSpareCols &&
      data[i][1] + 1 === instance.countCols()
      && emptyColsAtTheEnd == instance.getSettings().minSpareCols) {
        instance.alter('remove_col', parseInt(data[i][1]+1,10), instance.getSettings().minSpareCols);

        instance.undoRedo.doneActions.pop();
      }
    }

  };
  Handsontable.UndoRedo.ChangeAction.prototype.redo = function (instance, onFinishCallback) {
    var data = $.extend(true, [], this.changes);
    for (var i = 0, len = data.length; i < len; i++) {
      data[i].splice(2, 1);
    }

    instance.addHookOnce('afterChange', onFinishCallback);

    instance.setDataAtRowProp(data, null, null, 'redo');

  };

  Handsontable.UndoRedo.CreateRowAction = function (index, amount) {
    this.index = index;
    this.amount = amount;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.CreateRowAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.CreateRowAction.prototype.undo = function (instance, undoneCallback) {
    instance.addHookOnce('afterRemoveRow', undoneCallback);
    instance.alter('remove_row', this.index, this.amount);
  };
  Handsontable.UndoRedo.CreateRowAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterCreateRow', redoneCallback);
    instance.alter('insert_row', this.index + 1, this.amount);
  };

  Handsontable.UndoRedo.RemoveRowAction = function (index, data) {
    this.index = index;
    this.data = data;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.RemoveRowAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.RemoveRowAction.prototype.undo = function (instance, undoneCallback) {
    var spliceArgs = [this.index, 0];
    Array.prototype.push.apply(spliceArgs, this.data);

    Array.prototype.splice.apply(instance.getData(), spliceArgs);

    instance.addHookOnce('afterRender', undoneCallback);
    Handsontable.hooks.run(instance, 'afterCreateRow', this.index, this.data.length, false);
    instance.render();    
  };
  Handsontable.UndoRedo.RemoveRowAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterRemoveRow', redoneCallback);
    instance.alter('remove_row', this.index, this.data.length);
  };

  Handsontable.UndoRedo.CreateDataRowAction = function (index, data) {
    this.index = index;
    this.data = data;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.CreateDataRowAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.CreateDataRowAction.prototype.redo = function (instance, undoneCallback) {
    var spliceArgs = [this.index, 0];
    Array.prototype.push.apply(spliceArgs, this.data);

    Array.prototype.splice.apply(instance.getData(), spliceArgs);

    instance.addHookOnce('afterRender', undoneCallback);
    Handsontable.hooks.run(instance, 'afterCreateRow', this.index, this.data.length, false);
    instance.render();    
  };
  Handsontable.UndoRedo.CreateDataRowAction.prototype.undo = function (instance, redoneCallback) {
    instance.addHookOnce('afterRemoveRow', redoneCallback);
    instance.alter('remove_row', this.index, this.data.length);
  };

  Handsontable.UndoRedo.CreateColumnAction = function (index, amount) {
    this.index = index;
    this.amount = amount;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.CreateColumnAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.CreateColumnAction.prototype.undo = function (instance, undoneCallback) {
    instance.addHookOnce('afterRemoveCol', undoneCallback);
    instance.alter('remove_col', this.index, this.amount);
  };
  Handsontable.UndoRedo.CreateColumnAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterCreateCol', redoneCallback);
    instance.alter('insert_col', this.index + 1, this.amount);
  };

  Handsontable.UndoRedo.RemoveColumnAction = function (index, data, headers) {
    this.index = index;
    this.data = data;
    this.amount = this.data[0].length;
    this.headers = headers;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.RemoveColumnAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.RemoveColumnAction.prototype.undo = function (instance, undoneCallback) {
    var row, spliceArgs;
    for (var i = 0, len = instance.getData().length; i < len; i++) {
      row = instance.getSourceDataAtRow(i);

      spliceArgs = [this.index, 0];
      Array.prototype.push.apply(spliceArgs, this.data[i]);

      Array.prototype.splice.apply(row, spliceArgs);

    }

    if(typeof this.headers != 'undefined'){
      spliceArgs = [this.index, 0];
      Array.prototype.push.apply(spliceArgs, this.headers);
      Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArgs);
    }

    instance.addHookOnce('afterRender', undoneCallback);
    instance.render();
  };
  Handsontable.UndoRedo.RemoveColumnAction.prototype.redo = function (instance, redoneCallback) {
    instance.addHookOnce('afterRemoveCol', redoneCallback);
    instance.alter('remove_col', this.index, this.amount);
  };

  Handsontable.UndoRedo.CollectionAction = function(collection) {
    this.collection = collection;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.CollectionAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.CollectionAction.prototype.undo = function(instance, undoneCallback) {
    var callbackStub = function() {};
    for(var i = 0; i < this.collection.length; i++) {
      this.collection[i].undo(instance, callbackStub);
    }

    instance.addHookOnce('afterRender', undoneCallback);
    instance.render();
  };
  Handsontable.UndoRedo.CollectionAction.prototype.redo = function(instance, redoneCallback) {
    var callbackStub = function() {};
    for(var i = 0; i < this.collection.length; i++) {
      this.collection[i].redo(instance, callbackStub);
    }

    instance.addHookOnce('afterRender', redoneCallback);
    instance.render();
  };

  Handsontable.UndoRedo.RevertFilterAction = function(currentFilterColumns, previousFilterColumns) {
      this.currentFilterColumns = currentFilterColumns;
      this.previousFilterColumns = previousFilterColumns;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.RevertFilterAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.RevertFilterAction.prototype.undo = function(instance, doneCallback) {      
      instance.filter(this.previousFilterColumns);
      doneCallback();
  };
  Handsontable.UndoRedo.RevertFilterAction.prototype.redo = function(instance, redoneCallback) {      
      instance.filter(this.currentFilterColumns);
      redoneCallback();
  };

  Handsontable.UndoRedo.RevertSortAction = function(currentSortColumns, previousSortColumns) {
      this.currentSortColumns = currentSortColumns;
      this.previousSortColumns = previousSortColumns;
  };
  Handsontable.helper.inherit(Handsontable.UndoRedo.RevertSortAction, Handsontable.UndoRedo.Action);
  Handsontable.UndoRedo.RevertSortAction.prototype.undo = function(instance, doneCallback) {      
      instance.sort(this.previousSortColumns);
      doneCallback();
  };
  Handsontable.UndoRedo.RevertSortAction.prototype.redo = function(instance, redoneCallback) {      
      instance.sort(this.currentSortColumns);
      redoneCallback();
  };

})(Handsontable);

(function(Handsontable){

  function init(){
    var instance = this;
    var pluginEnabled = typeof instance.getSettings().undo == 'undefined' || instance.getSettings().undo;

    if(pluginEnabled){
      if(!instance.undoRedo){
        instance.undoRedo = new Handsontable.UndoRedo(instance);
        instance.undoRedo.paused = false;

        exposeUndoRedoMethods(instance);

        instance.pauseUndo = function(pause) {
          var instance = this;
          var newState = (pause === undefined ? true : pause);

          if(!newState && instance.undoRedo.paused) {
            exposeUndoRedoMethods(instance);
            instance.addHook('beforeKeyDown', onBeforeKeyDown);
            instance.addHook('afterChange', onAfterChange);
            Handsontable.hooks.run(instance, 'undoRedoState', 'undo', this.isUndoAvailable());
            Handsontable.hooks.run(instance, 'undoRedoState', 'redo', this.isRedoAvailable());
          }
          else if(newState && !instance.undoRedo.paused) {
            removeExposedUndoRedoMethods(instance);
            instance.removeHook('beforeKeyDown', onBeforeKeyDown);
            instance.removeHook('afterChange', onAfterChange);
            Handsontable.hooks.run(instance, 'undoRedoState', 'undo', false);
            Handsontable.hooks.run(instance, 'undoRedoState', 'redo', false);
          }

          instance.undoRedo.paused = newState;
        };

        instance.addHook('beforeKeyDown', onBeforeKeyDown);
        instance.addHook('afterChange', onAfterChange);
      }
    } else {
      if(instance.undoRedo){
        delete instance.undoRedo;

        removeExposedUndoRedoMethods(instance);

        instance.removeHook('beforeKeyDown', onBeforeKeyDown);
        instance.removeHook('afterChange', onAfterChange);
      }
    }
  }

  function onBeforeKeyDown(event){
    var instance = this;

    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if(ctrlDown){
      if (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90)) { //CTRL + Y or CTRL + SHIFT + Z
        instance.undoRedo.redo();
        event.stopImmediatePropagation();
      }
      else if (event.keyCode === 90) { //CTRL + Z
        instance.undoRedo.undo();
        event.stopImmediatePropagation();
      }
    }
  }

  function onAfterChange(changes, source){
    var instance = this;
    if (source == 'loadData'){
      return instance.undoRedo.clear();
    }
  }

  function exposeUndoRedoMethods(instance){
    instance.undo = function(){
      return instance.undoRedo.undo();
    };

    instance.redo = function(){
      return instance.undoRedo.redo();
    };

    instance.isUndoAvailable = function(){
      return instance.undoRedo.isUndoAvailable();
    };

    instance.isRedoAvailable = function(){
      return instance.undoRedo.isRedoAvailable();
    };

    instance.clearUndo = function(){
      return instance.undoRedo.clear();
    };

    instance.collectUndo = function(enabledCollection) {
      return instance.undoRedo.collectUndo(enabledCollection);
    }
  }

  function removeExposedUndoRedoMethods(instance){
    delete instance.undo;
    delete instance.redo;
    delete instance.isUndoAvailable;
    delete instance.isRedoAvailable;
    delete instance.clearUndo;
  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);
  Handsontable.hooks.register('undoRedoState');  

})(Handsontable);
