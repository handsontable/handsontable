/**
 * Handsontable UndoRedo class
 */
import Hooks from './../../pluginHooks';
import {arrayMap} from './../../helpers/array';
import {rangeEach} from './../../helpers/number';
import {inherit, deepClone} from './../../helpers/object';
import {stopImmediatePropagation} from './../../helpers/dom/event';
import {CellCoords} from './../../3rdparty/walkontable/src';

/**
 * @description
 * Handsontable UndoRedo plugin. It allows to undo and redo certain actions done in the table.
 * Please note, that not all actions are currently undo-able.
 *
 * @example
 * ```js
 * ...
 * undo: true
 * ...
 * ```
 * @class UndoRedo
 * @plugin UndoRedo
 */
function UndoRedo(instance) {
  let plugin = this;
  this.instance = instance;
  this.doneActions = [];
  this.undoneActions = [];
  this.ignoreNewActions = false;

  instance.addHook('afterChange', (changes, source) => {
    if (changes && source !== 'UndoRedo.undo' && source !== 'UndoRedo.redo') {
      plugin.done(new UndoRedo.ChangeAction(changes));
    }
  });

  instance.addHook('afterCreateRow', (index, amount, source) => {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.undo' || source === 'auto') {
      return;
    }

    let action = new UndoRedo.CreateRowAction(index, amount);
    plugin.done(action);
  });

  instance.addHook('beforeRemoveRow', (index, amount, logicRows, source) => {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto') {
      return;
    }

    var originalData = plugin.instance.getSourceDataArray();

    index = (originalData.length + index) % originalData.length;

    var removedData = deepClone(originalData.slice(index, index + amount));

    plugin.done(new UndoRedo.RemoveRowAction(index, removedData));
  });

  instance.addHook('afterCreateCol', (index, amount, source) => {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto') {
      return;
    }

    plugin.done(new UndoRedo.CreateColumnAction(index, amount));
  });

  instance.addHook('beforeRemoveCol', (index, amount, logicColumns, source) => {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto') {
      return;
    }

    let originalData = plugin.instance.getSourceDataArray();

    index = (plugin.instance.countCols() + index) % plugin.instance.countCols();

    let removedData = [];
    let headers = [];
    let indexes = [];

    rangeEach(originalData.length - 1, (i) => {
      let column = [];
      let origRow = originalData[i];

      rangeEach(index, index + (amount - 1), (j) => {
        column.push(origRow[instance.runHooks('modifyCol', j)]);
      });
      removedData.push(column);
    });

    rangeEach(amount - 1, (i) => {
      indexes.push(instance.runHooks('modifyCol', index + i));
    });

    if (Array.isArray(instance.getSettings().colHeaders)) {
      rangeEach(amount - 1, (i) => {
        headers.push(instance.getSettings().colHeaders[instance.runHooks('modifyCol', index + i)] || null);
      });
    }

    let manualColumnMovePlugin = plugin.instance.getPlugin('manualColumnMove');

    let columnsMap = manualColumnMovePlugin.isEnabled() ? manualColumnMovePlugin.columnsMapper.__arrayMap : [];
    let action = new UndoRedo.RemoveColumnAction(index, indexes, removedData, headers, columnsMap);

    plugin.done(action);
  });

  instance.addHook('beforeCellAlignment', (stateBefore, range, type, alignment) => {
    let action = new UndoRedo.CellAlignmentAction(stateBefore, range, type, alignment);
    plugin.done(action);
  });

  instance.addHook('beforeFilter', (conditionsStack) => {
    plugin.done(new UndoRedo.FiltersAction(conditionsStack));
  });

  instance.addHook('beforeRowMove', (movedRows, target) => {
    if (movedRows === false) {
      return;
    }

    plugin.done(new UndoRedo.RowMoveAction(movedRows, target));
  });
};

UndoRedo.prototype.done = function(action) {
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
UndoRedo.prototype.undo = function() {
  if (this.isUndoAvailable()) {
    let action = this.doneActions.pop();
    let actionClone = deepClone(action);
    let instance = this.instance;

    let continueAction = instance.runHooks('beforeUndo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;
    let that = this;
    action.undo(this.instance, () => {
      that.ignoreNewActions = false;
      that.undoneActions.push(action);
    });

    instance.runHooks('afterUndo', actionClone);
  }
};

/**
 * Redo edit (used to reverse an undo).
 *
 * @function redo
 * @memberof UndoRedo#
 */
UndoRedo.prototype.redo = function() {
  if (this.isRedoAvailable()) {
    let action = this.undoneActions.pop();
    let actionClone = deepClone(action);
    let instance = this.instance;

    let continueAction = instance.runHooks('beforeRedo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;
    let that = this;
    action.redo(this.instance, () => {
      that.ignoreNewActions = false;
      that.doneActions.push(action);
    });

    instance.runHooks('afterRedo', actionClone);
  }
};

/**
 * Check if undo action is available.
 *
 * @function isUndoAvailable
 * @memberof UndoRedo#
 * @return {Boolean} Return `true` if undo can be performed, `false` otherwise
 */
UndoRedo.prototype.isUndoAvailable = function() {
  return this.doneActions.length > 0;
};

/**
 * Check if redo action is available.
 *
 * @function isRedoAvailable
 * @memberof UndoRedo#
 * @return {Boolean} Return `true` if redo can be performed, `false` otherwise.
 */
UndoRedo.prototype.isRedoAvailable = function() {
  return this.undoneActions.length > 0;
};

/**
 * Clears undo history.
 *
 * @function clear
 * @memberof UndoRedo#
 */
UndoRedo.prototype.clear = function() {
  this.doneActions.length = 0;
  this.undoneActions.length = 0;
};

UndoRedo.Action = function() {};
UndoRedo.Action.prototype.undo = function() {};
UndoRedo.Action.prototype.redo = function() {};

/**
 * Change action.
 */
UndoRedo.ChangeAction = function(changes) {
  this.changes = changes;
  this.actionType = 'change';
};
inherit(UndoRedo.ChangeAction, UndoRedo.Action);

UndoRedo.ChangeAction.prototype.undo = function(instance, undoneCallback) {
  let data = deepClone(this.changes),
    emptyRowsAtTheEnd = instance.countEmptyRows(true),
    emptyColsAtTheEnd = instance.countEmptyCols(true);

  for (let i = 0, len = data.length; i < len; i++) {
    data[i].splice(3, 1);
  }

  instance.addHookOnce('afterChange', undoneCallback);

  instance.setDataAtRowProp(data, null, null, 'UndoRedo.undo');

  for (let i = 0, len = data.length; i < len; i++) {
    if (instance.getSettings().minSpareRows && data[i][0] + 1 + instance.getSettings().minSpareRows === instance.countRows() &&
        emptyRowsAtTheEnd == instance.getSettings().minSpareRows) {

      instance.alter('remove_row', parseInt(data[i][0] + 1, 10), instance.getSettings().minSpareRows);
      instance.undoRedo.doneActions.pop();

    }

    if (instance.getSettings().minSpareCols && data[i][1] + 1 + instance.getSettings().minSpareCols === instance.countCols() &&
        emptyColsAtTheEnd == instance.getSettings().minSpareCols) {

      instance.alter('remove_col', parseInt(data[i][1] + 1, 10), instance.getSettings().minSpareCols);
      instance.undoRedo.doneActions.pop();
    }
  }

};
UndoRedo.ChangeAction.prototype.redo = function(instance, onFinishCallback) {
  let data = deepClone(this.changes);

  for (let i = 0, len = data.length; i < len; i++) {
    data[i].splice(2, 1);
  }

  instance.addHookOnce('afterChange', onFinishCallback);
  instance.setDataAtRowProp(data, null, null, 'UndoRedo.redo');
};

/**
 * Create row action.
 */
UndoRedo.CreateRowAction = function(index, amount) {
  this.index = index;
  this.amount = amount;
  this.actionType = 'insert_row';
};
inherit(UndoRedo.CreateRowAction, UndoRedo.Action);

UndoRedo.CreateRowAction.prototype.undo = function(instance, undoneCallback) {
  let rowCount = instance.countRows(),
    minSpareRows = instance.getSettings().minSpareRows;

  if (this.index >= rowCount && this.index - minSpareRows < rowCount) {
    this.index -= minSpareRows; // work around the situation where the needed row was removed due to an 'undo' of a made change
  }

  instance.addHookOnce('afterRemoveRow', undoneCallback);
  instance.alter('remove_row', this.index, this.amount, 'UndoRedo.undo');
};
UndoRedo.CreateRowAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterCreateRow', redoneCallback);
  instance.alter('insert_row', this.index, this.amount, 'UndoRedo.redo');
};

/**
 * Remove row action.
 */
UndoRedo.RemoveRowAction = function(index, data) {
  this.index = index;
  this.data = data;
  this.actionType = 'remove_row';
};
inherit(UndoRedo.RemoveRowAction, UndoRedo.Action);

UndoRedo.RemoveRowAction.prototype.undo = function(instance, undoneCallback) {
  instance.alter('insert_row', this.index, this.data.length, 'UndoRedo.undo');
  instance.addHookOnce('afterRender', undoneCallback);
  instance.populateFromArray(this.index, 0, this.data, void 0, void 0, 'UndoRedo.undo');
};
UndoRedo.RemoveRowAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveRow', redoneCallback);
  instance.alter('remove_row', this.index, this.data.length, 'UndoRedo.redo');
};

/**
 * Create column action.
 */
UndoRedo.CreateColumnAction = function(index, amount) {
  this.index = index;
  this.amount = amount;
  this.actionType = 'insert_col';
};
inherit(UndoRedo.CreateColumnAction, UndoRedo.Action);

UndoRedo.CreateColumnAction.prototype.undo = function(instance, undoneCallback) {
  instance.addHookOnce('afterRemoveCol', undoneCallback);
  instance.alter('remove_col', this.index, this.amount, 'UndoRedo.undo');
};
UndoRedo.CreateColumnAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterCreateCol', redoneCallback);
  instance.alter('insert_col', this.index, this.amount, 'UndoRedo.redo');
};

/**
 * Remove column action.
 */
UndoRedo.RemoveColumnAction = function(index, indexes, data, headers, columnPositions) {
  this.index = index;
  this.indexes = indexes;
  this.data = data;
  this.amount = this.data[0].length;
  this.headers = headers;
  this.columnPositions = columnPositions.slice(0);
  this.actionType = 'remove_col';
};
inherit(UndoRedo.RemoveColumnAction, UndoRedo.Action);

UndoRedo.RemoveColumnAction.prototype.undo = function(instance, undoneCallback) {
  let row;
  let ascendingIndexes = this.indexes.slice(0).sort();
  let sortByIndexes = (elem, j, arr) => arr[this.indexes.indexOf(ascendingIndexes[j])];

  let sortedData = [];
  rangeEach(this.data.length - 1, (i) => {
    sortedData[i] = arrayMap(this.data[i], sortByIndexes);
  });

  let sortedHeaders = [];
  sortedHeaders = arrayMap(this.headers, sortByIndexes);

  var changes = [];

  // TODO: Temporary hook for undo/redo mess
  instance.runHooks('beforeCreateCol', this.indexes[0], this.indexes[this.indexes.length - 1], 'UndoRedo.undo');

  rangeEach(this.data.length - 1, (i) => {
    row = instance.getSourceDataAtRow(i);

    rangeEach(ascendingIndexes.length - 1, (j) => {
      row.splice(ascendingIndexes[j], 0, sortedData[i][j]);
      changes.push([i, ascendingIndexes[j], null, sortedData[i][j]]);
    });
  });

  // TODO: Temporary hook for undo/redo mess
  if (instance.getPlugin('formulas')) {
    instance.getPlugin('formulas').onAfterSetDataAtCell(changes);
  }

  if (typeof this.headers !== 'undefined') {
    rangeEach(sortedHeaders.length - 1, (j) => {
      instance.getSettings().colHeaders.splice(ascendingIndexes[j], 0, sortedHeaders[j]);
    });
  }

  if (instance.getPlugin('manualColumnMove')) {
    instance.getPlugin('manualColumnMove').columnsMapper.__arrayMap = this.columnPositions;
  }

  instance.addHookOnce('afterRender', undoneCallback);

  // TODO: Temporary hook for undo/redo mess
  instance.runHooks('afterCreateCol', this.indexes[0], this.indexes[this.indexes.length - 1], 'UndoRedo.undo');

  if (instance.getPlugin('formulas')) {
    instance.getPlugin('formulas').recalculateFull();
  }

  instance.render();
};

UndoRedo.RemoveColumnAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveCol', redoneCallback);
  instance.alter('remove_col', this.index, this.amount, 'UndoRedo.redo');
};

/**
 * Cell alignment action.
 */
UndoRedo.CellAlignmentAction = function(stateBefore, range, type, alignment) {
  this.stateBefore = stateBefore;
  this.range = range;
  this.type = type;
  this.alignment = alignment;
};
UndoRedo.CellAlignmentAction.prototype.undo = function(instance, undoneCallback) {
  if (!instance.getPlugin('contextMenu').isEnabled()) {
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
UndoRedo.CellAlignmentAction.prototype.redo = function(instance, undoneCallback) {
  if (!instance.getPlugin('contextMenu').isEnabled()) {
    return;
  }
  instance.selectCell(this.range.from.row, this.range.from.col, this.range.to.row, this.range.to.col);
  instance.getPlugin('contextMenu').executeCommand(`alignment:${this.alignment.replace('ht', '').toLowerCase()}`);

  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};

/**
 * Filters action.
 */
UndoRedo.FiltersAction = function(conditionsStack) {
  this.conditionsStack = conditionsStack;
  this.actionType = 'filter';
};
inherit(UndoRedo.FiltersAction, UndoRedo.Action);

UndoRedo.FiltersAction.prototype.undo = function(instance, undoneCallback) {
  let filters = instance.getPlugin('filters');

  instance.addHookOnce('afterRender', undoneCallback);

  filters.conditionCollection.importAllConditions(this.conditionsStack.slice(0, this.conditionsStack.length - 1));
  filters.filter();
};
UndoRedo.FiltersAction.prototype.redo = function(instance, redoneCallback) {
  let filters = instance.getPlugin('filters');

  instance.addHookOnce('afterRender', redoneCallback);

  filters.conditionCollection.importAllConditions(this.conditionsStack);
  filters.filter();
};

/**
 * ManualRowMove action.
 * @TODO: removeRow undo should works on logical index
 */
UndoRedo.RowMoveAction = function(movedRows, target) {
  this.rows = movedRows.slice();
  this.target = target;
};
inherit(UndoRedo.RowMoveAction, UndoRedo.Action);

UndoRedo.RowMoveAction.prototype.undo = function(instance, undoneCallback) {
  let manualRowMove = instance.getPlugin('manualRowMove');

  instance.addHookOnce('afterRender', undoneCallback);
  let mod = this.rows[0] < this.target ? -1 * this.rows.length : 0;
  let newTarget = this.rows[0] > this.target ? this.rows[0] + this.rows.length : this.rows[0];
  let newRows = [];
  let rowsLen = this.rows.length + mod;

  for (let i = mod; i < rowsLen; i++) {
    newRows.push(this.target + i);
  }
  manualRowMove.moveRows(newRows.slice(), newTarget);
  instance.render();

  instance.selection.setRangeStartOnly(new CellCoords(this.rows[0], 0));
  instance.selection.setRangeEnd(new CellCoords(this.rows[this.rows.length - 1], instance.countCols() - 1));
};
UndoRedo.RowMoveAction.prototype.redo = function(instance, redoneCallback) {
  let manualRowMove = instance.getPlugin('manualRowMove');

  instance.addHookOnce('afterRender', redoneCallback);
  manualRowMove.moveRows(this.rows.slice(), this.target);
  instance.render();
  let startSelection = this.rows[0] < this.target ? this.target - this.rows.length : this.target;
  instance.selection.setRangeStartOnly(new CellCoords(startSelection, 0));
  instance.selection.setRangeEnd(new CellCoords(startSelection + this.rows.length - 1, instance.countCols() - 1));
};

function init() {
  let instance = this;
  let pluginEnabled = typeof instance.getSettings().undo == 'undefined' || instance.getSettings().undo;

  if (pluginEnabled) {
    if (!instance.undoRedo) {
      /**
       * Instance of Handsontable.UndoRedo Plugin {@link Handsontable.UndoRedo}
       *
       * @alias undoRedo
       * @memberof! Handsontable.Core#
       * @type {UndoRedo}
       */
      instance.undoRedo = new UndoRedo(instance);

      exposeUndoRedoMethods(instance);

      instance.addHook('beforeKeyDown', onBeforeKeyDown);
      instance.addHook('afterChange', onAfterChange);
    }
  } else if (instance.undoRedo) {
    delete instance.undoRedo;

    removeExposedUndoRedoMethods(instance);

    instance.removeHook('beforeKeyDown', onBeforeKeyDown);
    instance.removeHook('afterChange', onAfterChange);
  }
}

function onBeforeKeyDown(event) {
  let instance = this;

  let ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

  if (ctrlDown) {
    if (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90)) { // CTRL + Y or CTRL + SHIFT + Z
      instance.undoRedo.redo();
      stopImmediatePropagation(event);
    } else if (event.keyCode === 90) { // CTRL + Z
      instance.undoRedo.undo();
      stopImmediatePropagation(event);
    }
  }
}

function onAfterChange(changes, source) {
  let instance = this;
  if (source === 'loadData') {
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

function removeExposedUndoRedoMethods(instance) {
  delete instance.undo;
  delete instance.redo;
  delete instance.isUndoAvailable;
  delete instance.isRedoAvailable;
  delete instance.clearUndo;
}

const hook = Hooks.getSingleton();

hook.add('afterInit', init);
hook.add('afterUpdateSettings', init);

hook.register('beforeUndo');
hook.register('afterUndo');
hook.register('beforeRedo');
hook.register('afterRedo');
