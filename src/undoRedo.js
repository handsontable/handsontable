/**
 * Handsontable UndoRedo class
 */
Handsontable.UndoRedo = function (instance) {
  var plugin = this;
  this.instance = instance;
  this.doneActions = [];
  this.undoneActions = [];
  this.ignoreNewActions = false;
  instance.addHook("afterChange", function (changes, origin) {
    var action = new Handsontable.UndoRedo.ChangeAction(changes);
    plugin.do(action);
  });

  instance.addHook("afterCreateRow", function (index, amount) {
    var action = new Handsontable.UndoRedo.CreateRowAction(index, amount);
    plugin.do(action);
  });

  instance.addHook("beforeRemoveRow", function (index, amount) {
    var originalData = plugin.instance.getData();
    index = ( originalData.length + index ) % originalData.length;
    var removedData = originalData.slice(index, index + amount);
    var action = new Handsontable.UndoRedo.RemoveRowAction(index, removedData);
    plugin.do(action);
  });
};

Handsontable.UndoRedo.prototype.do = function (action) {
  if (!this.ignoreNewActions) {
    this.doneActions.push(action);
    this.undoneActions.length = 0;
  }
};

/**
 * Undo operation from current revision
 */
Handsontable.UndoRedo.prototype.undo = function () {
  if (this.isUndoAvailable()) {
    var action = this.doneActions.pop();

    this.ignoreNewActions = true;
    action.undo(this.instance);
    this.ignoreNewActions = false;

    this.undoneActions.push(action);
  }
};

/**
 * Redo operation from current revision
 */
Handsontable.UndoRedo.prototype.redo = function () {
  if (this.isRedoAvailable()) {
    var action = this.undoneActions.pop();

    this.ignoreNewActions = true;
    action.redo(this.instance);
    this.ignoreNewActions = true;

    this.doneActions.push(action);
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
Handsontable.UndoRedo.ChangeAction.prototype.undo = function (instance) {
  var data = $.extend(true, [], this.changes);
  for (var i = 0, len = data.length; i < len; i++) {
    data[i].splice(3, 1);
  }
  instance.setDataAtRowProp(data, null, null, 'undo');

};
Handsontable.UndoRedo.ChangeAction.prototype.redo = function (instance) {
  var data = $.extend(true, [], this.changes);
  for (var i = 0, len = data.length; i < len; i++) {
    data[i].splice(2, 1);
  }
  instance.setDataAtRowProp(data, null, null, 'redo');

};

Handsontable.UndoRedo.CreateRowAction = function (index, amount) {
  this.index = index;
  this.amount = amount;
};
Handsontable.helper.inherit(Handsontable.UndoRedo.CreateRowAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.CreateRowAction.prototype.undo = function (instance) {
  instance.alter('remove_row', this.index, this.amount);
};
Handsontable.UndoRedo.CreateRowAction.prototype.redo = function (instance) {
  instance.alter('insert_row', this.index + 1, this.amount);
};

Handsontable.UndoRedo.RemoveRowAction = function (index, data) {
  this.index = index;
  this.data = data;
};
Handsontable.helper.inherit(Handsontable.UndoRedo.RemoveRowAction, Handsontable.UndoRedo.Action);
Handsontable.UndoRedo.RemoveRowAction.prototype.undo = function (instance) {
  instance.alter('insert_row', this.index, this.data.length);
  instance.populateFromArray(this.index, 0, this.data);
};
Handsontable.UndoRedo.RemoveRowAction.prototype.redo = function (instance) {
  instance.alter('remove_row', this.index, this.amount);
};