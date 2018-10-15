'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pluginHooks = require('./../../pluginHooks');

var _pluginHooks2 = _interopRequireDefault(_pluginHooks);

var _array = require('./../../helpers/array');

var _number = require('./../../helpers/number');

var _object = require('./../../helpers/object');

var _event = require('./../../helpers/dom/event');

var _utils = require('./../contextMenu/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Handsontable UndoRedo class
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * @description
 * Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.
 *
 * __Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.
 *
 * @example
 * ```js
 * undo: true
 * ```
 * @class UndoRedo
 * @plugin UndoRedo
 */
function UndoRedo(instance) {
  var plugin = this;
  this.instance = instance;
  this.doneActions = [];
  this.undoneActions = [];
  this.ignoreNewActions = false;

  instance.addHook('afterChange', function (changes, source) {
    if (changes && source !== 'UndoRedo.undo' && source !== 'UndoRedo.redo' && source !== 'MergeCells') {
      plugin.done(new UndoRedo.ChangeAction(changes));
    }
  });

  instance.addHook('afterCreateRow', function (index, amount, source) {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.undo' || source === 'auto') {
      return;
    }

    var action = new UndoRedo.CreateRowAction(index, amount);
    plugin.done(action);
  });

  instance.addHook('beforeRemoveRow', function (index, amount, logicRows, source) {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto') {
      return;
    }

    var originalData = plugin.instance.getSourceDataArray();
    var rowIndex = (originalData.length + index) % originalData.length;
    var removedData = (0, _object.deepClone)(originalData.slice(rowIndex, rowIndex + amount));

    plugin.done(new UndoRedo.RemoveRowAction(rowIndex, removedData));
  });

  instance.addHook('afterCreateCol', function (index, amount, source) {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto') {
      return;
    }

    plugin.done(new UndoRedo.CreateColumnAction(index, amount));
  });

  instance.addHook('beforeRemoveCol', function (index, amount, logicColumns, source) {
    if (source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto') {
      return;
    }

    var originalData = plugin.instance.getSourceDataArray();
    var columnIndex = (plugin.instance.countCols() + index) % plugin.instance.countCols();
    var removedData = [];
    var headers = [];
    var indexes = [];

    (0, _number.rangeEach)(originalData.length - 1, function (i) {
      var column = [];
      var origRow = originalData[i];

      (0, _number.rangeEach)(columnIndex, columnIndex + (amount - 1), function (j) {
        column.push(origRow[instance.runHooks('modifyCol', j)]);
      });
      removedData.push(column);
    });

    (0, _number.rangeEach)(amount - 1, function (i) {
      indexes.push(instance.runHooks('modifyCol', columnIndex + i));
    });

    if (Array.isArray(instance.getSettings().colHeaders)) {
      (0, _number.rangeEach)(amount - 1, function (i) {
        headers.push(instance.getSettings().colHeaders[instance.runHooks('modifyCol', columnIndex + i)] || null);
      });
    }

    var manualColumnMovePlugin = plugin.instance.getPlugin('manualColumnMove');
    var columnsMap = manualColumnMovePlugin.isEnabled() ? manualColumnMovePlugin.columnsMapper.__arrayMap : [];
    var action = new UndoRedo.RemoveColumnAction(columnIndex, indexes, removedData, headers, columnsMap);

    plugin.done(action);
  });

  instance.addHook('beforeCellAlignment', function (stateBefore, range, type, alignment) {
    var action = new UndoRedo.CellAlignmentAction(stateBefore, range, type, alignment);
    plugin.done(action);
  });

  instance.addHook('beforeFilter', function (conditionsStack) {
    plugin.done(new UndoRedo.FiltersAction(conditionsStack));
  });

  instance.addHook('beforeRowMove', function (movedRows, target) {
    if (movedRows === false) {
      return;
    }

    plugin.done(new UndoRedo.RowMoveAction(movedRows, target));
  });

  instance.addHook('beforeMergeCells', function (cellRange, auto) {
    if (auto) {
      return;
    }

    plugin.done(new UndoRedo.MergeCellsAction(instance, cellRange));
  });

  instance.addHook('afterUnmergeCells', function (cellRange, auto) {
    if (auto) {
      return;
    }

    plugin.done(new UndoRedo.UnmergeCellsAction(instance, cellRange));
  });
}

UndoRedo.prototype.done = function (action) {
  if (!this.ignoreNewActions) {
    this.doneActions.push(action);
    this.undoneActions.length = 0;
  }
};

/**
 * Undo the last action performed to the table.
 *
 * @function undo
 * @memberof UndoRedo#
 * @fires Hooks#beforeUndo
 * @fires Hooks#afterUndo
 */
UndoRedo.prototype.undo = function () {
  if (this.isUndoAvailable()) {
    var action = this.doneActions.pop();
    var actionClone = (0, _object.deepClone)(action);
    var instance = this.instance;

    var continueAction = instance.runHooks('beforeUndo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;
    var that = this;
    action.undo(this.instance, function () {
      that.ignoreNewActions = false;
      that.undoneActions.push(action);
    });

    instance.runHooks('afterUndo', actionClone);
  }
};

/**
 * Redo the previous action performed to the table (used to reverse an undo).
 *
 * @function redo
 * @memberof UndoRedo#
 * @fires Hooks#beforeRedo
 * @fires Hooks#afterRedo
 */
UndoRedo.prototype.redo = function () {
  if (this.isRedoAvailable()) {
    var action = this.undoneActions.pop();
    var actionClone = (0, _object.deepClone)(action);
    var instance = this.instance;

    var continueAction = instance.runHooks('beforeRedo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;
    var that = this;
    action.redo(this.instance, function () {
      that.ignoreNewActions = false;
      that.doneActions.push(action);
    });

    instance.runHooks('afterRedo', actionClone);
  }
};

/**
 * Checks if undo action is available.
 *
 * @function isUndoAvailable
 * @memberof UndoRedo#
 * @return {Boolean} Return `true` if undo can be performed, `false` otherwise.
 */
UndoRedo.prototype.isUndoAvailable = function () {
  return this.doneActions.length > 0;
};

/**
 * Checks if redo action is available.
 *
 * @function isRedoAvailable
 * @memberof UndoRedo#
 * @return {Boolean} Return `true` if redo can be performed, `false` otherwise.
 */
UndoRedo.prototype.isRedoAvailable = function () {
  return this.undoneActions.length > 0;
};

/**
 * Clears undo history.
 *
 * @function clear
 * @memberof UndoRedo#
 */
UndoRedo.prototype.clear = function () {
  this.doneActions.length = 0;
  this.undoneActions.length = 0;
};

UndoRedo.Action = function () {};
UndoRedo.Action.prototype.undo = function () {};
UndoRedo.Action.prototype.redo = function () {};

/**
 * Change action.
 *
 * @private
 */
UndoRedo.ChangeAction = function (changes) {
  this.changes = changes;
  this.actionType = 'change';
};
(0, _object.inherit)(UndoRedo.ChangeAction, UndoRedo.Action);

UndoRedo.ChangeAction.prototype.undo = function (instance, undoneCallback) {
  var data = (0, _object.deepClone)(this.changes);
  var emptyRowsAtTheEnd = instance.countEmptyRows(true);
  var emptyColsAtTheEnd = instance.countEmptyCols(true);

  for (var i = 0, len = data.length; i < len; i++) {
    data[i].splice(3, 1);
  }

  instance.addHookOnce('afterChange', undoneCallback);

  instance.setDataAtRowProp(data, null, null, 'UndoRedo.undo');

  for (var _i = 0, _len = data.length; _i < _len; _i++) {
    if (instance.getSettings().minSpareRows && data[_i][0] + 1 + instance.getSettings().minSpareRows === instance.countRows() && emptyRowsAtTheEnd === instance.getSettings().minSpareRows) {

      instance.alter('remove_row', parseInt(data[_i][0] + 1, 10), instance.getSettings().minSpareRows);
      instance.undoRedo.doneActions.pop();
    }

    if (instance.getSettings().minSpareCols && data[_i][1] + 1 + instance.getSettings().minSpareCols === instance.countCols() && emptyColsAtTheEnd === instance.getSettings().minSpareCols) {

      instance.alter('remove_col', parseInt(data[_i][1] + 1, 10), instance.getSettings().minSpareCols);
      instance.undoRedo.doneActions.pop();
    }
  }
};
UndoRedo.ChangeAction.prototype.redo = function (instance, onFinishCallback) {
  var data = (0, _object.deepClone)(this.changes);

  for (var i = 0, len = data.length; i < len; i++) {
    data[i].splice(2, 1);
  }

  instance.addHookOnce('afterChange', onFinishCallback);
  instance.setDataAtRowProp(data, null, null, 'UndoRedo.redo');
};

/**
 * Create row action.
 *
 * @private
 */
UndoRedo.CreateRowAction = function (index, amount) {
  this.index = index;
  this.amount = amount;
  this.actionType = 'insert_row';
};
(0, _object.inherit)(UndoRedo.CreateRowAction, UndoRedo.Action);

UndoRedo.CreateRowAction.prototype.undo = function (instance, undoneCallback) {
  var rowCount = instance.countRows();
  var minSpareRows = instance.getSettings().minSpareRows;

  if (this.index >= rowCount && this.index - minSpareRows < rowCount) {
    this.index -= minSpareRows; // work around the situation where the needed row was removed due to an 'undo' of a made change
  }

  instance.addHookOnce('afterRemoveRow', undoneCallback);
  instance.alter('remove_row', this.index, this.amount, 'UndoRedo.undo');
};
UndoRedo.CreateRowAction.prototype.redo = function (instance, redoneCallback) {
  instance.addHookOnce('afterCreateRow', redoneCallback);
  instance.alter('insert_row', this.index, this.amount, 'UndoRedo.redo');
};

/**
 * Remove row action.
 *
 * @private
 */
UndoRedo.RemoveRowAction = function (index, data) {
  this.index = index;
  this.data = data;
  this.actionType = 'remove_row';
};
(0, _object.inherit)(UndoRedo.RemoveRowAction, UndoRedo.Action);

UndoRedo.RemoveRowAction.prototype.undo = function (instance, undoneCallback) {
  instance.alter('insert_row', this.index, this.data.length, 'UndoRedo.undo');
  instance.addHookOnce('afterRender', undoneCallback);
  instance.populateFromArray(this.index, 0, this.data, void 0, void 0, 'UndoRedo.undo');
};
UndoRedo.RemoveRowAction.prototype.redo = function (instance, redoneCallback) {
  instance.addHookOnce('afterRemoveRow', redoneCallback);
  instance.alter('remove_row', this.index, this.data.length, 'UndoRedo.redo');
};

/**
 * Create column action.
 *
 * @private
 */
UndoRedo.CreateColumnAction = function (index, amount) {
  this.index = index;
  this.amount = amount;
  this.actionType = 'insert_col';
};
(0, _object.inherit)(UndoRedo.CreateColumnAction, UndoRedo.Action);

UndoRedo.CreateColumnAction.prototype.undo = function (instance, undoneCallback) {
  instance.addHookOnce('afterRemoveCol', undoneCallback);
  instance.alter('remove_col', this.index, this.amount, 'UndoRedo.undo');
};
UndoRedo.CreateColumnAction.prototype.redo = function (instance, redoneCallback) {
  instance.addHookOnce('afterCreateCol', redoneCallback);
  instance.alter('insert_col', this.index, this.amount, 'UndoRedo.redo');
};

/**
 * Remove column action.
 *
 * @private
 */
UndoRedo.RemoveColumnAction = function (index, indexes, data, headers, columnPositions) {
  this.index = index;
  this.indexes = indexes;
  this.data = data;
  this.amount = this.data[0].length;
  this.headers = headers;
  this.columnPositions = columnPositions.slice(0);
  this.actionType = 'remove_col';
};
(0, _object.inherit)(UndoRedo.RemoveColumnAction, UndoRedo.Action);

UndoRedo.RemoveColumnAction.prototype.undo = function (instance, undoneCallback) {
  var _this = this;

  var row = void 0;
  var ascendingIndexes = this.indexes.slice(0).sort();
  var sortByIndexes = function sortByIndexes(elem, j, arr) {
    return arr[_this.indexes.indexOf(ascendingIndexes[j])];
  };

  var sortedData = [];
  (0, _number.rangeEach)(this.data.length - 1, function (i) {
    sortedData[i] = (0, _array.arrayMap)(_this.data[i], sortByIndexes);
  });

  var sortedHeaders = [];
  sortedHeaders = (0, _array.arrayMap)(this.headers, sortByIndexes);

  var changes = [];

  // TODO: Temporary hook for undo/redo mess
  instance.runHooks('beforeCreateCol', this.indexes[0], this.indexes.length, 'UndoRedo.undo');

  (0, _number.rangeEach)(this.data.length - 1, function (i) {
    row = instance.getSourceDataAtRow(i);

    (0, _number.rangeEach)(ascendingIndexes.length - 1, function (j) {
      row.splice(ascendingIndexes[j], 0, sortedData[i][j]);
      changes.push([i, ascendingIndexes[j], null, sortedData[i][j]]);
    });
  });

  // TODO: Temporary hook for undo/redo mess
  if (instance.getPlugin('formulas')) {
    instance.getPlugin('formulas').onAfterSetDataAtCell(changes);
  }

  if (typeof this.headers !== 'undefined') {
    (0, _number.rangeEach)(sortedHeaders.length - 1, function (j) {
      instance.getSettings().colHeaders.splice(ascendingIndexes[j], 0, sortedHeaders[j]);
    });
  }

  if (instance.getPlugin('manualColumnMove')) {
    instance.getPlugin('manualColumnMove').columnsMapper.__arrayMap = this.columnPositions;
  }

  instance.addHookOnce('afterRender', undoneCallback);

  // TODO: Temporary hook for undo/redo mess
  instance.runHooks('afterCreateCol', this.indexes[0], this.indexes.length, 'UndoRedo.undo');

  if (instance.getPlugin('formulas')) {
    instance.getPlugin('formulas').recalculateFull();
  }

  instance.render();
};

UndoRedo.RemoveColumnAction.prototype.redo = function (instance, redoneCallback) {
  instance.addHookOnce('afterRemoveCol', redoneCallback);
  instance.alter('remove_col', this.index, this.amount, 'UndoRedo.redo');
};

/**
 * Cell alignment action.
 *
 * @private
 */
UndoRedo.CellAlignmentAction = function (stateBefore, range, type, alignment) {
  this.stateBefore = stateBefore;
  this.range = range;
  this.type = type;
  this.alignment = alignment;
};
UndoRedo.CellAlignmentAction.prototype.undo = function (instance, undoneCallback) {
  var _this2 = this;

  (0, _array.arrayEach)(this.range, function (_ref) {
    var from = _ref.from,
        to = _ref.to;

    for (var row = from.row; row <= to.row; row += 1) {
      for (var col = from.col; col <= to.col; col += 1) {
        instance.setCellMeta(row, col, 'className', _this2.stateBefore[row][col] || ' htLeft');
      }
    }
  });

  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};
UndoRedo.CellAlignmentAction.prototype.redo = function (instance, undoneCallback) {
  (0, _utils.align)(this.range, this.type, this.alignment, function (row, col) {
    return instance.getCellMeta(row, col);
  }, function (row, col, key, value) {
    return instance.setCellMeta(row, col, key, value);
  });

  instance.addHookOnce('afterRender', undoneCallback);
  instance.render();
};

/**
 * Filters action.
 *
 * @private
 */
UndoRedo.FiltersAction = function (conditionsStack) {
  this.conditionsStack = conditionsStack;
  this.actionType = 'filter';
};
(0, _object.inherit)(UndoRedo.FiltersAction, UndoRedo.Action);

UndoRedo.FiltersAction.prototype.undo = function (instance, undoneCallback) {
  var filters = instance.getPlugin('filters');

  instance.addHookOnce('afterRender', undoneCallback);

  filters.conditionCollection.importAllConditions(this.conditionsStack.slice(0, this.conditionsStack.length - 1));
  filters.filter();
};
UndoRedo.FiltersAction.prototype.redo = function (instance, redoneCallback) {
  var filters = instance.getPlugin('filters');

  instance.addHookOnce('afterRender', redoneCallback);

  filters.conditionCollection.importAllConditions(this.conditionsStack);
  filters.filter();
};

/**
 * Merge Cells action.
 * @util
 */

var MergeCellsAction = function (_UndoRedo$Action) {
  _inherits(MergeCellsAction, _UndoRedo$Action);

  function MergeCellsAction(instance, cellRange) {
    _classCallCheck(this, MergeCellsAction);

    var _this3 = _possibleConstructorReturn(this, (MergeCellsAction.__proto__ || Object.getPrototypeOf(MergeCellsAction)).call(this));

    _this3.cellRange = cellRange;
    _this3.rangeData = instance.getData(cellRange.from.row, cellRange.from.col, cellRange.to.row, cellRange.to.col);
    return _this3;
  }

  _createClass(MergeCellsAction, [{
    key: 'undo',
    value: function undo(instance, undoneCallback) {
      var mergeCellsPlugin = instance.getPlugin('mergeCells');
      instance.addHookOnce('afterRender', undoneCallback);

      mergeCellsPlugin.unmergeRange(this.cellRange, true);
      instance.populateFromArray(this.cellRange.from.row, this.cellRange.from.col, this.rangeData, void 0, void 0, 'MergeCells');
    }
  }, {
    key: 'redo',
    value: function redo(instance, redoneCallback) {
      var mergeCellsPlugin = instance.getPlugin('mergeCells');
      instance.addHookOnce('afterRender', redoneCallback);

      mergeCellsPlugin.mergeRange(this.cellRange);
    }
  }]);

  return MergeCellsAction;
}(UndoRedo.Action);

UndoRedo.MergeCellsAction = MergeCellsAction;

/**
 * Unmerge Cells action.
 * @util
 */

var UnmergeCellsAction = function (_UndoRedo$Action2) {
  _inherits(UnmergeCellsAction, _UndoRedo$Action2);

  function UnmergeCellsAction(instance, cellRange) {
    _classCallCheck(this, UnmergeCellsAction);

    var _this4 = _possibleConstructorReturn(this, (UnmergeCellsAction.__proto__ || Object.getPrototypeOf(UnmergeCellsAction)).call(this));

    _this4.cellRange = cellRange;
    return _this4;
  }

  _createClass(UnmergeCellsAction, [{
    key: 'undo',
    value: function undo(instance, undoneCallback) {
      var mergeCellsPlugin = instance.getPlugin('mergeCells');
      instance.addHookOnce('afterRender', undoneCallback);

      mergeCellsPlugin.mergeRange(this.cellRange, true);
    }
  }, {
    key: 'redo',
    value: function redo(instance, redoneCallback) {
      var mergeCellsPlugin = instance.getPlugin('mergeCells');
      instance.addHookOnce('afterRender', redoneCallback);

      mergeCellsPlugin.unmergeRange(this.cellRange, true);
      instance.render();
    }
  }]);

  return UnmergeCellsAction;
}(UndoRedo.Action);

UndoRedo.UnmergeCellsAction = UnmergeCellsAction;

/**
 * ManualRowMove action.
 *
 * @private
 * @TODO: removeRow undo should works on logical index
 */
UndoRedo.RowMoveAction = function (movedRows, target) {
  this.rows = movedRows.slice();
  this.target = target;
};
(0, _object.inherit)(UndoRedo.RowMoveAction, UndoRedo.Action);

UndoRedo.RowMoveAction.prototype.undo = function (instance, undoneCallback) {
  var manualRowMove = instance.getPlugin('manualRowMove');

  instance.addHookOnce('afterRender', undoneCallback);

  var mod = this.rows[0] < this.target ? -1 * this.rows.length : 0;
  var newTarget = this.rows[0] > this.target ? this.rows[0] + this.rows.length : this.rows[0];
  var newRows = [];
  var rowsLen = this.rows.length + mod;

  for (var i = mod; i < rowsLen; i += 1) {
    newRows.push(this.target + i);
  }

  manualRowMove.moveRows(newRows.slice(), newTarget);
  instance.render();

  instance.selectCell(this.rows[0], 0, this.rows[this.rows.length - 1], instance.countCols() - 1, false, false);
};
UndoRedo.RowMoveAction.prototype.redo = function (instance, redoneCallback) {
  var manualRowMove = instance.getPlugin('manualRowMove');

  instance.addHookOnce('afterRender', redoneCallback);
  manualRowMove.moveRows(this.rows.slice(), this.target);
  instance.render();
  var startSelection = this.rows[0] < this.target ? this.target - this.rows.length : this.target;

  instance.selectCell(startSelection, 0, startSelection + this.rows.length - 1, instance.countCols() - 1, false, false);
};

function init() {
  var instance = this;
  var pluginEnabled = typeof instance.getSettings().undo === 'undefined' || instance.getSettings().undo;

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
  var instance = this;

  var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

  if (ctrlDown) {
    if (event.keyCode === 89 || event.shiftKey && event.keyCode === 90) {
      // CTRL + Y or CTRL + SHIFT + Z
      instance.undoRedo.redo();
      (0, _event.stopImmediatePropagation)(event);
    } else if (event.keyCode === 90) {
      // CTRL + Z
      instance.undoRedo.undo();
      (0, _event.stopImmediatePropagation)(event);
    }
  }
}

function onAfterChange(changes, source) {
  var instance = this;
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
  instance.undo = function () {
    return instance.undoRedo.undo();
  };

  /**
   * {@link UndoRedo#redo}
   * @alias redo
   * @memberof! Handsontable.Core#
   */
  instance.redo = function () {
    return instance.undoRedo.redo();
  };

  /**
   * {@link UndoRedo#isUndoAvailable}
   * @alias isUndoAvailable
   * @memberof! Handsontable.Core#
   */
  instance.isUndoAvailable = function () {
    return instance.undoRedo.isUndoAvailable();
  };

  /**
   * {@link UndoRedo#isRedoAvailable}
   * @alias isRedoAvailable
   * @memberof! Handsontable.Core#
   */
  instance.isRedoAvailable = function () {
    return instance.undoRedo.isRedoAvailable();
  };

  /**
   * {@link UndoRedo#clear}
   * @alias clearUndo
   * @memberof! Handsontable.Core#
   */
  instance.clearUndo = function () {
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

var hook = _pluginHooks2.default.getSingleton();

hook.add('afterInit', init);
hook.add('afterUpdateSettings', init);

hook.register('beforeUndo');
hook.register('afterUndo');
hook.register('beforeRedo');
hook.register('afterRedo');

exports.default = UndoRedo;