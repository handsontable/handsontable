/**
 * Handsontable UndoRedo class
 */

import * as helper from './../../helpers.js';

/**
 * Handsontable UndoRedo class
 *
 * @class UndoRedo
 * @plugin UndoRedo
 */
Handsontable.UndoRedo = function(instance) {
  var plugin = this;
  this.instance = instance;
  this.doneActions = [];
  this.undoneActions = [];
  this.ignoreNewActions = false;
  instance.addHook("afterChange", function(changes, origin) {
    if (changes) {
      var action = new Handsontable.UndoRedo.ChangeAction(changes);
      plugin.done(action);
    }
  });

  instance.addHook("afterCreateRow", function(index, amount, createdAutomatically) {

    if (createdAutomatically) {
      return;
    }

    var action = new Handsontable.UndoRedo.CreateRowAction(index, amount);
    plugin.done(action);
  });

  instance.addHook("beforeRemoveRow", function(index, amount) {
    var originalData = plugin.instance.getData();
    index = (originalData.length + index) % originalData.length;
    var removedData = originalData.slice(index, index + amount);
    var action = new Handsontable.UndoRedo.RemoveRowAction(index, removedData);
    plugin.done(action);
  });

  instance.addHook("afterCreateCol", function(index, amount, createdAutomatically) {

    if (createdAutomatically) {
      return;
    }

    var action = new Handsontable.UndoRedo.CreateColumnAction(index, amount);
    plugin.done(action);
  });

  instance.addHook("beforeRemoveCol", function(index, amount) {
    var originalData = plugin.instance.getData();
    index = (plugin.instance.countCols() + index) % plugin.instance.countCols();
    var removedData = [];

    for (var i = 0, len = originalData.length; i < len; i++) {
      removedData[i] = originalData[i].slice(index, index + amount);
    }

    var headers;
    if (Array.isArray(instance.getSettings().colHeaders)) {
      headers = instance.getSettings().colHeaders.slice(index, index + removedData.length);
    }

    var action = new Handsontable.UndoRedo.RemoveColumnAction(index, removedData, headers);
    plugin.done(action);
  });

  instance.addHook("beforeCellAlignment", function(stateBefore, range, type, alignment) {
    var action = new Handsontable.UndoRedo.CellAlignmentAction(stateBefore, range, type, alignment);
    plugin.done(action);
  });
};

Handsontable.UndoRedo.prototype.done = function(action) {
  if (!this.ignoreNewActions) {
    this.doneActions.push(action);
    this.undoneActions.length = 0;
  }
};

/**
 * Undo last edit.
 *
 * @function undo
 * @memberof UndoRedo#
 */
Handsontable.UndoRedo.prototype.undo = function() {
  if (this.isUndoAvailable()) {
    var action = this.doneActions.pop();

    this.ignoreNewActions = true;
    var that = this;
    action.undo(this.instance, function() {
      that.ignoreNewActions = false;
      that.undoneActions.push(action);
    });



  }
};

/**
 * Redo edit (used to reverse an undo).
 *
 * @function redo
 * @memberof UndoRedo#
 */
Handsontable.UndoRedo.prototype.redo = function() {
  if (this.isRedoAvailable()) {
    var action = this.undoneActions.pop();

    this.ignoreNewActions = true;
    var that = this;
    action.redo(this.instance, function() {
      that.ignoreNewActions = false;
      that.doneActions.push(action);
    });



  }
};

/**
 * Check if undo action is available.
 *
 * @function isUndoAvailable
 * @memberof UndoRedo#
 * @return {Boolean} Return `true` if undo can be performed, `false` otherwise
 */
Handsontable.UndoRedo.prototype.isUndoAvailable = function() {
  return this.doneActions.length > 0;
};

/**
 * Check if redo action is available.
 *
 * @function isRedoAvailable
 * @memberof UndoRedo#
 * @return {Boolean} Return `true` if redo can be performed, `false` otherwise.
 */
Handsontable.UndoRedo.prototype.isRedoAvailable = function() {
  return this.undoneActions.length > 0;
};

/**
 * Clears undo history.
 *
 * @function clear
 * @memberof UndoRedo#
 */
Handsontable.UndoRedo.prototype.clear = function() {
  this.doneActions.length = 0;
  this.undoneActions.length = 0;
};

Handsontable.UndoRedo.Action = function() {};
Handsontable.UndoRedo.Action.prototype.undo = function() {};
Handsontable.UndoRedo.Action.prototype.redo = function() {};

Handsontable.UndoRedo.ChangeAction = function(changes) {
  this.changes = changes;
};
helper.inherit(Handsontable.UndoRedo.ChangeAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.ChangeAction.prototype.undo = function(instance, undoneCallback) {
  var data = helper.deepClone(this.changes),
    emptyRowsAtTheEnd = instance.countEmptyRows(true),
    emptyColsAtTheEnd = instance.countEmptyCols(true);

  for (var i = 0, len = data.length; i < len; i++) {
    data[i].splice(3, 1);
  }

  instance.addHookOnce('afterChange', undoneCallback);

  instance.setDataAtRowProp(data, null, null, 'undo');

  for (var i = 0, len = data.length; i < len; i++) {
    if (instance.getSettings().minSpareRows && data[i][0] + 1 + instance.getSettings().minSpareRows === instance.countRows() && emptyRowsAtTheEnd == instance.getSettings().minSpareRows) {

      instance.alter('remove_row', parseInt(data[i][0] + 1, 10), instance.getSettings().minSpareRows);
      instance.undoRedo.doneActions.pop();

    }

    if (instance.getSettings().minSpareCols && data[i][1] + 1 + instance.getSettings().minSpareCols === instance.countCols() && emptyColsAtTheEnd == instance.getSettings().minSpareCols) {

      instance.alter('remove_col', parseInt(data[i][1] + 1, 10), instance.getSettings().minSpareCols);
      instance.undoRedo.doneActions.pop();
    }
  }

};
Handsontable.UndoRedo.ChangeAction.prototype.redo = function(instance, onFinishCallback) {
  var data = helper.deepClone(this.changes);

  for (var i = 0, len = data.length; i < len; i++) {
    data[i].splice(2, 1);
  }

  instance.addHookOnce('afterChange', onFinishCallback);

  instance.setDataAtRowProp(data, null, null, 'redo');

};

Handsontable.UndoRedo.CreateRowAction = function(index, amount) {
  this.index = index;
  this.amount = amount;
};
helper.inherit(Handsontable.UndoRedo.CreateRowAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.CreateRowAction.prototype.undo = function(instance, undoneCallback) {
  var rowCount = instance.countRows(),
    minSpareRows = instance.getSettings().minSpareRows;
  if (this.index >= rowCount && this.index - minSpareRows < rowCount) {
    this.index -= minSpareRows; // work around the situation where the needed row was removed due to an 'undo' of a made change
  }

  instance.addHookOnce('afterRemoveRow', undoneCallback);
  instance.alter('remove_row', this.index, this.amount);
};
Handsontable.UndoRedo.CreateRowAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterCreateRow', redoneCallback);
  instance.alter('insert_row', this.index + 1, this.amount);
};

Handsontable.UndoRedo.RemoveRowAction = function(index, data) {
  this.index = index;
  this.data = data;
};
helper.inherit(Handsontable.UndoRedo.RemoveRowAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.RemoveRowAction.prototype.undo = function(instance, undoneCallback) {
  var spliceArgs = [this.index, 0];
  Array.prototype.push.apply(spliceArgs, this.data);

  Array.prototype.splice.apply(instance.getData(), spliceArgs);

  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
Handsontable.UndoRedo.RemoveRowAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveRow', redoneCallback);
  instance.alter('remove_row', this.index, this.data.length);
};

Handsontable.UndoRedo.CreateColumnAction = function(index, amount) {
  this.index = index;
  this.amount = amount;
};
helper.inherit(Handsontable.UndoRedo.CreateColumnAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.CreateColumnAction.prototype.undo = function(instance, undoneCallback) {
  instance.addHookOnce('afterRemoveCol', undoneCallback);
  instance.alter('remove_col', this.index, this.amount);
};
Handsontable.UndoRedo.CreateColumnAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterCreateCol', redoneCallback);
  instance.alter('insert_col', this.index + 1, this.amount);
};

Handsontable.UndoRedo.CellAlignmentAction = function(stateBefore, range, type, alignment) {
  this.stateBefore = stateBefore;
  this.range = range;
  this.type = type;
  this.alignment = alignment;
};
Handsontable.UndoRedo.CellAlignmentAction.prototype.undo = function(instance, undoneCallback) {
  if (!instance.contextMenu) {
    return;
  }

  for (var row = this.range.from.row; row <= this.range.to.row; row++) {
    for (var col = this.range.from.col; col <= this.range.to.col; col++) {
      instance.setCellMeta(row, col, 'className', this.stateBefore[row][col] || ' htLeft');
    }
  }

  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
Handsontable.UndoRedo.CellAlignmentAction.prototype.redo = function(instance, undoneCallback) {
  if (!instance.contextMenu) {
    return;
  }

  for (var row = this.range.from.row; row <= this.range.to.row; row++) {
    for (var col = this.range.from.col; col <= this.range.to.col; col++) {
      instance.contextMenu.align.call(instance, this.range, this.type, this.alignment);
    }
  }

  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};

Handsontable.UndoRedo.RemoveColumnAction = function(index, data, headers) {
  this.index = index;
  this.data = data;
  this.amount = this.data[0].length;
  this.headers = headers;
};
helper.inherit(Handsontable.UndoRedo.RemoveColumnAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.RemoveColumnAction.prototype.undo = function(instance, undoneCallback) {
  var row, spliceArgs;
  for (var i = 0, len = instance.getData().length; i < len; i++) {
    row = instance.getSourceDataAtRow(i);

    spliceArgs = [this.index, 0];
    Array.prototype.push.apply(spliceArgs, this.data[i]);

    Array.prototype.splice.apply(row, spliceArgs);

  }

  if (typeof this.headers != 'undefined') {
    spliceArgs = [this.index, 0];
    Array.prototype.push.apply(spliceArgs, this.headers);
    Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArgs);
  }

  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
Handsontable.UndoRedo.RemoveColumnAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveCol', redoneCallback);
  instance.alter('remove_col', this.index, this.amount);
};

function init(){
  var instance = this;
  var pluginEnabled = typeof instance.getSettings().undo == 'undefined' || instance.getSettings().undo;

  if (pluginEnabled) {
    if (!instance.undoRedo) {
      /**
       * Instance of Handsontable.UndoRedo Plugin {@link Handsontable.UndoRedo}
       *
       * @alias undoRedo
       * @memberof! Handsontable.Core#
       * @type {UndoRedo}
       */
      instance.undoRedo = new Handsontable.UndoRedo(instance);

      exposeUndoRedoMethods(instance);

      instance.addHook('beforeKeyDown', onBeforeKeyDown);
      instance.addHook('afterChange', onAfterChange);
    }
  } else {
    if (instance.undoRedo) {
      delete instance.undoRedo;

      removeExposedUndoRedoMethods(instance);

      instance.removeHook('beforeKeyDown', onBeforeKeyDown);
      instance.removeHook('afterChange', onAfterChange);
    }
  }
}

function onBeforeKeyDown(event) {
  var instance = this;

  var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

  if (ctrlDown) {
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

function onAfterChange(changes, source) {
  var instance = this;
  if (source == 'loadData') {
    return instance.undoRedo.clear();
  }
}

function exposeUndoRedoMethods(instance) {
  /**
   * {@link UndoRedo#undo}
   * @alias undo
   * @memberof! Handsontable.Core#
   */
  instance.undo = function() {
    return instance.undoRedo.undo();
  };

  /**
   * {@link UndoRedo#redo}
   * @alias redo
   * @memberof! Handsontable.Core#
   */
  instance.redo = function() {
    return instance.undoRedo.redo();
  };

  /**
   * {@link UndoRedo#isUndoAvailable}
   * @alias isUndoAvailable
   * @memberof! Handsontable.Core#
   */
  instance.isUndoAvailable = function() {
    return instance.undoRedo.isUndoAvailable();
  };

  /**
   * {@link UndoRedo#isRedoAvailable}
   * @alias isRedoAvailable
   * @memberof! Handsontable.Core#
   */
  instance.isRedoAvailable = function() {
    return instance.undoRedo.isRedoAvailable();
  };

  /**
   * {@link UndoRedo#clear}
   * @alias clearUndo
   * @memberof! Handsontable.Core#
   */
  instance.clearUndo = function() {
    return instance.undoRedo.clear();
  };
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
