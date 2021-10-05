import Hooks from '../../pluginHooks';
import { arrayMap, arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { inherit, deepClone } from '../../helpers/object';
import { stopImmediatePropagation, isImmediatePropagationStopped } from '../../helpers/dom/event';
import { align } from '../contextMenu/utils';

export const PLUGIN_KEY = 'undoRedo';

/**
 * @description
 * Handsontable UndoRedo plugin allows to undo and redo certain actions done in the table.
 *
 * __Note__, that not all actions are currently undo-able. The UndoRedo plugin is enabled by default.
 * @example
 * ```js
 * undo: true
 * ```
 * @class UndoRedo
 * @plugin UndoRedo
 * @param {Core} instance The Handsontable instance.
 */
function UndoRedo(instance) {
  const plugin = this;

  this.instance = instance;
  this.doneActions = [];
  this.undoneActions = [];
  this.ignoreNewActions = false;
  this.enabled = false;

  instance.addHook('afterChange', function(changes, source) {
    const changesLen = changes && changes.length;

    if (!changesLen) {
      return;
    }

    const hasDifferences = changes.find((change) => {
      const [, , oldValue, newValue] = change;

      return oldValue !== newValue;
    });

    if (!hasDifferences) {
      return;
    }

    const wrappedAction = () => {
      const clonedChanges = changes.reduce((arr, change) => {
        arr.push([...change]);

        return arr;
      }, []);

      arrayEach(clonedChanges, (change) => {
        change[1] = instance.propToCol(change[1]);
      });

      const selected = changesLen > 1 ? this.getSelected() : [[clonedChanges[0][0], clonedChanges[0][1]]];

      return new UndoRedo.ChangeAction(clonedChanges, selected);
    };

    plugin.done(wrappedAction, source);
  });

  instance.addHook('afterCreateRow', (index, amount, source) => {
    plugin.done(() => new UndoRedo.CreateRowAction(index, amount), source);
  });

  instance.addHook('beforeRemoveRow', (index, amount, logicRows, source) => {
    const wrappedAction = () => {
      const originalData = plugin.instance.getSourceDataArray();
      const rowIndex = (originalData.length + index) % originalData.length;
      const physicalRowIndex = instance.toPhysicalRow(rowIndex);
      const removedData = deepClone(originalData.slice(physicalRowIndex, physicalRowIndex + amount));

      return new UndoRedo.RemoveRowAction(
        rowIndex, removedData, instance.getSettings().fixedRowsBottom, instance.getSettings().fixedRowsTop);
    };

    plugin.done(wrappedAction, source);
  });

  instance.addHook('afterCreateCol', (index, amount, source) => {
    plugin.done(() => new UndoRedo.CreateColumnAction(index, amount), source);
  });

  instance.addHook('beforeRemoveCol', (index, amount, logicColumns, source) => {
    const wrappedAction = () => {
      const originalData = plugin.instance.getSourceDataArray();
      const columnIndex = (plugin.instance.countCols() + index) % plugin.instance.countCols();
      const removedData = [];
      const headers = [];
      const indexes = [];

      rangeEach(originalData.length - 1, (i) => {
        const column = [];
        const origRow = originalData[i];

        rangeEach(columnIndex, columnIndex + (amount - 1), (j) => {
          column.push(origRow[instance.toPhysicalColumn(j)]);
        });

        removedData.push(column);
      });

      rangeEach(amount - 1, (i) => {
        indexes.push(instance.toPhysicalColumn(columnIndex + i));
      });

      if (Array.isArray(instance.getSettings().colHeaders)) {
        rangeEach(amount - 1, (i) => {
          headers.push(instance.getSettings().colHeaders[instance.toPhysicalColumn(columnIndex + i)] || null);
        });
      }

      const columnsMap = instance.columnIndexMapper.getIndexesSequence();
      const rowsMap = instance.rowIndexMapper.getIndexesSequence();

      return new UndoRedo.RemoveColumnAction(
        columnIndex, indexes, removedData, headers, columnsMap, rowsMap, instance.getSettings().fixedColumnsLeft);
    };

    plugin.done(wrappedAction, source);
  });

  instance.addHook('beforeCellAlignment', (stateBefore, range, type, alignment) => {
    plugin.done(() => new UndoRedo.CellAlignmentAction(stateBefore, range, type, alignment));
  });

  instance.addHook('beforeFilter', (conditionsStack) => {
    plugin.done(() => new UndoRedo.FiltersAction(conditionsStack));
  });

  instance.addHook('beforeRowMove', (rows, finalIndex) => {
    if (rows === false) {
      return;
    }

    plugin.done(() => new UndoRedo.RowMoveAction(rows, finalIndex));
  });

  instance.addHook('beforeMergeCells', (cellRange, auto) => {
    if (auto) {
      return;
    }

    plugin.done(() => new UndoRedo.MergeCellsAction(instance, cellRange));
  });

  instance.addHook('afterUnmergeCells', (cellRange, auto) => {
    if (auto) {
      return;
    }

    plugin.done(() => new UndoRedo.UnmergeCellsAction(instance, cellRange));
  });

  // TODO: Why this callback is needed? One test doesn't pass after calling method right after plugin creation (outside the callback).
  instance.addHook('afterInit', () => {
    plugin.init();
  });
}

/**
 * Stash information about performed actions.
 *
 * @function done
 * @memberof UndoRedo#
 * @fires Hooks#beforeUndoStackChange
 * @fires Hooks#afterUndoStackChange
 * @fires Hooks#beforeRedoStackChange
 * @fires Hooks#afterRedoStackChange
 * @param {Function} wrappedAction The action descriptor wrapped in a closure.
 * @param {string} [source] Source of the action. It is defined just for more general actions (not related to plugins).
 */
UndoRedo.prototype.done = function(wrappedAction, source) {
  if (this.ignoreNewActions) {
    return;
  }

  const isBlockedByDefault = source === 'UndoRedo.undo' || source === 'UndoRedo.redo' || source === 'auto';

  if (isBlockedByDefault) {
    return;
  }

  const doneActionsCopy = this.doneActions.slice();
  const continueAction = this.instance.runHooks('beforeUndoStackChange', doneActionsCopy, source);

  if (continueAction === false) {
    return;
  }

  const newAction = wrappedAction();
  const undoneActionsCopy = this.undoneActions.slice();

  this.doneActions.push(newAction);

  this.instance.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
  this.instance.runHooks('beforeRedoStackChange', undoneActionsCopy);

  this.undoneActions.length = 0;

  this.instance.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());
};

/**
 * Undo the last action performed to the table.
 *
 * @function undo
 * @memberof UndoRedo#
 * @fires Hooks#beforeUndoStackChange
 * @fires Hooks#afterUndoStackChange
 * @fires Hooks#beforeRedoStackChange
 * @fires Hooks#afterRedoStackChange
 * @fires Hooks#beforeUndo
 * @fires Hooks#afterUndo
 */
UndoRedo.prototype.undo = function() {
  if (this.isUndoAvailable()) {
    const doneActionsCopy = this.doneActions.slice();

    this.instance.runHooks('beforeUndoStackChange', doneActionsCopy);

    const action = this.doneActions.pop();

    this.instance.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());

    const actionClone = deepClone(action);

    const continueAction = this.instance.runHooks('beforeUndo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;

    const that = this;
    const undoneActionsCopy = this.undoneActions.slice();

    this.instance.runHooks('beforeRedoStackChange', undoneActionsCopy);

    action.undo(this.instance, () => {
      that.ignoreNewActions = false;
      that.undoneActions.push(action);
    });

    this.instance.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());
    this.instance.runHooks('afterUndo', actionClone);
  }
};

/**
 * Redo the previous action performed to the table (used to reverse an undo).
 *
 * @function redo
 * @memberof UndoRedo#
 * @fires Hooks#beforeUndoStackChange
 * @fires Hooks#afterUndoStackChange
 * @fires Hooks#beforeRedoStackChange
 * @fires Hooks#afterRedoStackChange
 * @fires Hooks#beforeRedo
 * @fires Hooks#afterRedo
 */
UndoRedo.prototype.redo = function() {
  if (this.isRedoAvailable()) {
    const undoneActionsCopy = this.undoneActions.slice();

    this.instance.runHooks('beforeRedoStackChange', undoneActionsCopy);

    const action = this.undoneActions.pop();

    this.instance.runHooks('afterRedoStackChange', undoneActionsCopy, this.undoneActions.slice());

    const actionClone = deepClone(action);

    const continueAction = this.instance.runHooks('beforeRedo', actionClone);

    if (continueAction === false) {
      return;
    }

    this.ignoreNewActions = true;

    const that = this;
    const doneActionsCopy = this.doneActions.slice();

    this.instance.runHooks('beforeUndoStackChange', doneActionsCopy);

    action.redo(this.instance, () => {
      that.ignoreNewActions = false;
      that.doneActions.push(action);
    });

    this.instance.runHooks('afterUndoStackChange', doneActionsCopy, this.doneActions.slice());
    this.instance.runHooks('afterRedo', actionClone);
  }
};

/**
 * Checks if undo action is available.
 *
 * @function isUndoAvailable
 * @memberof UndoRedo#
 * @returns {boolean} Return `true` if undo can be performed, `false` otherwise.
 */
UndoRedo.prototype.isUndoAvailable = function() {
  return this.doneActions.length > 0;
};

/**
 * Checks if redo action is available.
 *
 * @function isRedoAvailable
 * @memberof UndoRedo#
 * @returns {boolean} Return `true` if redo can be performed, `false` otherwise.
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

/**
 * Checks if the plugin is enabled.
 *
 * @function isEnabled
 * @memberof UndoRedo#
 * @returns {boolean}
 */
UndoRedo.prototype.isEnabled = function() {
  return this.enabled;
};

/**
 * Enables the plugin.
 *
 * @function enable
 * @memberof UndoRedo#
 */
UndoRedo.prototype.enable = function() {
  if (this.isEnabled()) {
    return;
  }

  const hot = this.instance;

  this.enabled = true;
  exposeUndoRedoMethods(hot);

  hot.addHook('beforeKeyDown', onBeforeKeyDown);
  hot.addHook('afterChange', onAfterChange);
};

/**
 * Disables the plugin.
 *
 * @function disable
 * @memberof UndoRedo#
 */
UndoRedo.prototype.disable = function() {
  if (!this.isEnabled()) {
    return;
  }

  const hot = this.instance;

  this.enabled = false;
  removeExposedUndoRedoMethods(hot);

  hot.removeHook('beforeKeyDown', onBeforeKeyDown);
  hot.removeHook('afterChange', onAfterChange);
};

/**
 * Destroys the instance.
 *
 * @function destroy
 * @memberof UndoRedo#
 */
UndoRedo.prototype.destroy = function() {
  this.clear();
  this.instance = null;
  this.doneActions = null;
  this.undoneActions = null;
};

UndoRedo.Action = function() {};
UndoRedo.Action.prototype.undo = function() {};
UndoRedo.Action.prototype.redo = function() {};

/**
 * Change action.
 *
 * @private
 * @param {Array} changes 2D array containing information about each of the edited cells.
 * @param {number[]} selected The cell selection.
 */
UndoRedo.ChangeAction = function(changes, selected) {
  this.changes = changes;
  this.selected = selected;
  this.actionType = 'change';
};
inherit(UndoRedo.ChangeAction, UndoRedo.Action);

UndoRedo.ChangeAction.prototype.undo = function(instance, undoneCallback) {
  const data = deepClone(this.changes);
  const emptyRowsAtTheEnd = instance.countEmptyRows(true);
  const emptyColsAtTheEnd = instance.countEmptyCols(true);

  for (let i = 0, len = data.length; i < len; i++) {
    data[i].splice(3, 1);
  }

  instance.addHookOnce('afterChange', undoneCallback);

  instance.setDataAtCell(data, null, null, 'UndoRedo.undo');

  for (let i = 0, len = data.length; i < len; i++) {
    const [row, column] = data[i];

    if (instance.getSettings().minSpareRows &&
        row + 1 + instance.getSettings().minSpareRows === instance.countRows() &&
        emptyRowsAtTheEnd === instance.getSettings().minSpareRows) {

      instance.alter('remove_row', parseInt(row + 1, 10), instance.getSettings().minSpareRows);
      instance.undoRedo.doneActions.pop();
    }

    if (instance.getSettings().minSpareCols &&
        column + 1 + instance.getSettings().minSpareCols === instance.countCols() &&
        emptyColsAtTheEnd === instance.getSettings().minSpareCols) {

      instance.alter('remove_col', parseInt(column + 1, 10), instance.getSettings().minSpareCols);
      instance.undoRedo.doneActions.pop();
    }
  }

  instance.selectCells(this.selected, false, false);
};
UndoRedo.ChangeAction.prototype.redo = function(instance, onFinishCallback) {
  const data = deepClone(this.changes);

  for (let i = 0, len = data.length; i < len; i++) {
    data[i].splice(2, 1);
  }

  instance.addHookOnce('afterChange', onFinishCallback);
  instance.setDataAtCell(data, null, null, 'UndoRedo.redo');

  if (this.selected) {
    instance.selectCells(this.selected, false, false);
  }
};

/**
 * Create row action.
 *
 * @private
 * @param {number} index The visual row index.
 * @param {number} amount The number of created rows.
 */
UndoRedo.CreateRowAction = function(index, amount) {
  this.index = index;
  this.amount = amount;
  this.actionType = 'insert_row';
};
inherit(UndoRedo.CreateRowAction, UndoRedo.Action);

UndoRedo.CreateRowAction.prototype.undo = function(instance, undoneCallback) {
  const rowCount = instance.countRows();
  const minSpareRows = instance.getSettings().minSpareRows;

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
 *
 * @private
 * @param {number} index The visual row index.
 * @param {Array} data The removed data.
 * @param {number} fixedRowsBottom Number of fixed rows on the bottom. Remove row action change it sometimes.
 * @param {number} fixedRowsTop Number of fixed rows on the top. Remove row action change it sometimes.
 */
UndoRedo.RemoveRowAction = function(index, data, fixedRowsBottom, fixedRowsTop) {
  this.index = index;
  this.data = data;
  this.actionType = 'remove_row';
  this.fixedRowsBottom = fixedRowsBottom;
  this.fixedRowsTop = fixedRowsTop;
};
inherit(UndoRedo.RemoveRowAction, UndoRedo.Action);

UndoRedo.RemoveRowAction.prototype.undo = function(instance, undoneCallback) {
  const settings = instance.getSettings();

  // Changing by the reference as `updateSettings` doesn't work the best.
  settings.fixedRowsBottom = this.fixedRowsBottom;
  settings.fixedRowsTop = this.fixedRowsTop;

  instance.alter('insert_row', this.index, this.data.length, 'UndoRedo.undo');
  instance.addHookOnce('afterViewRender', undoneCallback);
  instance.populateFromArray(this.index, 0, this.data, void 0, void 0, 'UndoRedo.undo');
};
UndoRedo.RemoveRowAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveRow', redoneCallback);
  instance.alter('remove_row', this.index, this.data.length, 'UndoRedo.redo');
};

/**
 * Create column action.
 *
 * @private
 * @param {number} index The visual column index.
 * @param {number} amount The number of created columns.
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
 *
 * @private
 * @param {number} index The visual column index.
 * @param {number[]} indexes The visual column indexes.
 * @param {Array} data The removed data.
 * @param {Array} headers The header values.
 * @param {number[]} columnPositions The column position.
 * @param {number[]} rowPositions The row position.
 * @param {number} fixedColumnsLeft Number of fixed columns on the left. Remove column action change it sometimes.
 */
UndoRedo.RemoveColumnAction = function(index, indexes, data, headers, columnPositions, rowPositions, fixedColumnsLeft) {
  this.index = index;
  this.indexes = indexes;
  this.data = data;
  this.amount = this.data[0].length;
  this.headers = headers;
  this.columnPositions = columnPositions.slice(0);
  this.rowPositions = rowPositions.slice(0);
  this.actionType = 'remove_col';
  this.fixedColumnsLeft = fixedColumnsLeft;
};
inherit(UndoRedo.RemoveColumnAction, UndoRedo.Action);

UndoRedo.RemoveColumnAction.prototype.undo = function(instance, undoneCallback) {
  const settings = instance.getSettings();

  // Changing by the reference as `updateSettings` doesn't work the best.
  settings.fixedColumnsLeft = this.fixedColumnsLeft;

  const ascendingIndexes = this.indexes.slice(0).sort();
  const sortByIndexes = (elem, j, arr) => arr[this.indexes.indexOf(ascendingIndexes[j])];

  const removedDataLength = this.data.length;
  const sortedData = [];

  for (let rowIndex = 0; rowIndex < removedDataLength; rowIndex++) {
    sortedData.push(arrayMap(this.data[rowIndex], sortByIndexes));
  }

  const sortedHeaders = arrayMap(this.headers, sortByIndexes);
  const changes = [];

  instance.alter('insert_col', this.indexes[0], this.indexes.length, 'UndoRedo.undo');

  arrayEach(instance.getSourceDataArray(), (rowData, rowIndex) => {
    arrayEach(ascendingIndexes, (changedIndex, contiquesIndex) => {
      rowData[changedIndex] = sortedData[rowIndex][contiquesIndex];

      changes.push([rowIndex, changedIndex, rowData[changedIndex]]);
    });
  });

  instance.setSourceDataAtCell(changes, void 0, void 0, 'UndoRedo.undo');
  instance.columnIndexMapper.insertIndexes(ascendingIndexes[0], ascendingIndexes.length);

  if (typeof this.headers !== 'undefined') {
    arrayEach(sortedHeaders, (headerData, columnIndex) => {
      instance.getSettings().colHeaders[ascendingIndexes[columnIndex]] = headerData;
    });
  }

  instance.batchExecution(() => {
    // Restore row sequence in a case when all columns are removed. the original
    // row sequence is lost in that case.
    instance.rowIndexMapper.setIndexesSequence(this.rowPositions);
    instance.columnIndexMapper.setIndexesSequence(this.columnPositions);
  }, true);

  instance.addHookOnce('afterViewRender', undoneCallback);

  instance.render();
};

UndoRedo.RemoveColumnAction.prototype.redo = function(instance, redoneCallback) {
  instance.addHookOnce('afterRemoveCol', redoneCallback);
  instance.alter('remove_col', this.index, this.amount, 'UndoRedo.redo');
};

/**
 * Cell alignment action.
 *
 * @private
 * @param {Array} stateBefore The previous state.
 * @param {object} range The cell range.
 * @param {string} type The type of the alignment ("top", "left", "bottom" or "right").
 * @param {string} alignment The alignment CSS class.
 */
UndoRedo.CellAlignmentAction = function(stateBefore, range, type, alignment) {
  this.stateBefore = stateBefore;
  this.range = range;
  this.type = type;
  this.alignment = alignment;
};
UndoRedo.CellAlignmentAction.prototype.undo = function(instance, undoneCallback) {
  arrayEach(this.range, (range) => {
    range.forAll((row, col) => {
      // Alignment classes should only collected within cell ranges. We skip header coordinates.
      if (row >= 0 && col >= 0) {
        instance.setCellMeta(row, col, 'className', this.stateBefore[row][col] || ' htLeft');
      }
    });
  });

  instance.addHookOnce('afterViewRender', undoneCallback);
  instance.render();
};
UndoRedo.CellAlignmentAction.prototype.redo = function(instance, undoneCallback) {
  align(this.range, this.type, this.alignment, (row, col) => instance.getCellMeta(row, col),
    (row, col, key, value) => instance.setCellMeta(row, col, key, value));

  instance.addHookOnce('afterViewRender', undoneCallback);
  instance.render();
};

/**
 * Filters action.
 *
 * @private
 * @param {Array} conditionsStack An array of the filter condition.
 */
UndoRedo.FiltersAction = function(conditionsStack) {
  this.conditionsStack = conditionsStack;
  this.actionType = 'filter';
};
inherit(UndoRedo.FiltersAction, UndoRedo.Action);

UndoRedo.FiltersAction.prototype.undo = function(instance, undoneCallback) {
  const filters = instance.getPlugin('filters');

  instance.addHookOnce('afterViewRender', undoneCallback);

  filters.conditionCollection.importAllConditions(this.conditionsStack.slice(0, this.conditionsStack.length - 1));
  filters.filter();
};
UndoRedo.FiltersAction.prototype.redo = function(instance, redoneCallback) {
  const filters = instance.getPlugin('filters');

  instance.addHookOnce('afterViewRender', redoneCallback);

  filters.conditionCollection.importAllConditions(this.conditionsStack);
  filters.filter();
};

/**
 * Merge Cells action.
 *
 * @util
 */
class MergeCellsAction extends UndoRedo.Action {
  constructor(instance, cellRange) {
    super();
    this.cellRange = cellRange;

    const topLeftCorner = this.cellRange.getTopLeftCorner();
    const bottomRightCorner = this.cellRange.getBottomRightCorner();

    this.rangeData = instance.getData(
      topLeftCorner.row,
      topLeftCorner.col,
      bottomRightCorner.row,
      bottomRightCorner.col
    );
  }

  undo(instance, undoneCallback) {
    const mergeCellsPlugin = instance.getPlugin('mergeCells');

    instance.addHookOnce('afterViewRender', undoneCallback);

    mergeCellsPlugin.unmergeRange(this.cellRange, true);

    const topLeftCorner = this.cellRange.getTopLeftCorner();

    instance.populateFromArray(
      topLeftCorner.row,
      topLeftCorner.col,
      this.rangeData,
      void 0,
      void 0,
      'MergeCells'
    );
  }

  redo(instance, redoneCallback) {
    const mergeCellsPlugin = instance.getPlugin('mergeCells');

    instance.addHookOnce('afterViewRender', redoneCallback);

    mergeCellsPlugin.mergeRange(this.cellRange);
  }
}
UndoRedo.MergeCellsAction = MergeCellsAction;

/**
 * Unmerge Cells action.
 *
 * @util
 */
class UnmergeCellsAction extends UndoRedo.Action {
  constructor(instance, cellRange) {
    super();
    this.cellRange = cellRange;
  }

  undo(instance, undoneCallback) {
    const mergeCellsPlugin = instance.getPlugin('mergeCells');

    instance.addHookOnce('afterViewRender', undoneCallback);

    mergeCellsPlugin.mergeRange(this.cellRange, true);
  }

  redo(instance, redoneCallback) {
    const mergeCellsPlugin = instance.getPlugin('mergeCells');

    instance.addHookOnce('afterViewRender', redoneCallback);

    mergeCellsPlugin.unmergeRange(this.cellRange, true);
    instance.render();
  }
}
UndoRedo.UnmergeCellsAction = UnmergeCellsAction;

/**
 * ManualRowMove action.
 *
 * @TODO removeRow undo should works on logical index
 * @private
 * @param {number[]} rows An array with moved rows.
 * @param {number} finalIndex The destination index.
 */
UndoRedo.RowMoveAction = function(rows, finalIndex) {
  this.rows = rows.slice();
  this.finalIndex = finalIndex;
  this.actionType = 'row_move';
};
inherit(UndoRedo.RowMoveAction, UndoRedo.Action);

UndoRedo.RowMoveAction.prototype.undo = function(instance, undoneCallback) {
  const manualRowMove = instance.getPlugin('manualRowMove');
  const copyOfRows = [].concat(this.rows);
  const rowsMovedUp = copyOfRows.filter(a => a > this.finalIndex);
  const rowsMovedDown = copyOfRows.filter(a => a <= this.finalIndex);
  const allMovedRows = rowsMovedUp.sort((a, b) => b - a).concat(rowsMovedDown.sort((a, b) => a - b));

  instance.addHookOnce('afterViewRender', undoneCallback);

  // Moving rows from those with higher indexes to those with lower indexes when action was performed from bottom to top
  // Moving rows from those with lower indexes to those with higher indexes when action was performed from top to bottom
  for (let i = 0; i < allMovedRows.length; i += 1) {
    const newPhysicalRow = instance.toVisualRow(allMovedRows[i]);

    manualRowMove.moveRow(newPhysicalRow, allMovedRows[i]);
  }

  instance.render();

  instance.deselectCell();
  instance.selectRows(this.rows[0], this.rows[0] + this.rows.length - 1);
};
UndoRedo.RowMoveAction.prototype.redo = function(instance, redoneCallback) {
  const manualRowMove = instance.getPlugin('manualRowMove');

  instance.addHookOnce('afterViewRender', redoneCallback);
  manualRowMove.moveRows(this.rows.slice(), this.finalIndex);
  instance.render();

  instance.deselectCell();
  instance.selectRows(this.finalIndex, this.finalIndex + this.rows.length - 1);
};

/**
 * Enabling and disabling plugin and attaching its to an instance.
 *
 * @private
 */
UndoRedo.prototype.init = function() {
  const settings = this.instance.getSettings().undo;
  const pluginEnabled = typeof settings === 'undefined' || settings;

  if (!this.instance.undoRedo) {
    /**
     * Instance of Handsontable.UndoRedo Plugin {@link Handsontable.UndoRedo}.
     *
     * @alias undoRedo
     * @memberof! Handsontable.Core#
     * @type {UndoRedo}
     */
    this.instance.undoRedo = this;
  }

  if (pluginEnabled) {
    this.instance.undoRedo.enable();

  } else {
    this.instance.undoRedo.disable();
  }
};

/**
 * @param {Event} event The keyboard event object.
 */
function onBeforeKeyDown(event) {
  if (isImmediatePropagationStopped(event)) {
    return;
  }

  const instance = this;
  const editor = instance.getActiveEditor();

  if (editor && editor.isOpened()) {
    return;
  }

  const {
    altKey,
    ctrlKey,
    keyCode,
    metaKey,
    shiftKey,
  } = event;
  const isCtrlDown = (ctrlKey || metaKey) && !altKey;

  if (!isCtrlDown) {
    return;
  }

  const isRedoHotkey = keyCode === 89 || (shiftKey && keyCode === 90);

  if (isRedoHotkey) { // CTRL + Y or CTRL + SHIFT + Z
    instance.undoRedo.redo();
    stopImmediatePropagation(event);

  } else if (keyCode === 90) { // CTRL + Z
    instance.undoRedo.undo();
    stopImmediatePropagation(event);
  }
}

/**
 * @param {Array} changes 2D array containing information about each of the edited cells.
 * @param {string} source String that identifies source of hook call.
 * @returns {boolean}
 */
function onAfterChange(changes, source) {
  const instance = this;

  if (source === 'loadData') {
    return instance.undoRedo.clear();
  }
}

/**
 * @param {Core} instance The Handsontable instance.
 */
function exposeUndoRedoMethods(instance) {
  /**
   * {@link UndoRedo#undo}.
   *
   * @alias undo
   * @memberof! Handsontable.Core#
   * @returns {boolean}
   */
  instance.undo = function() {
    return instance.undoRedo.undo();
  };

  /**
   * {@link UndoRedo#redo}.
   *
   * @alias redo
   * @memberof! Handsontable.Core#
   * @returns {boolean}
   */
  instance.redo = function() {
    return instance.undoRedo.redo();
  };

  /**
   * {@link UndoRedo#isUndoAvailable}.
   *
   * @alias isUndoAvailable
   * @memberof! Handsontable.Core#
   * @returns {boolean}
   */
  instance.isUndoAvailable = function() {
    return instance.undoRedo.isUndoAvailable();
  };

  /**
   * {@link UndoRedo#isRedoAvailable}.
   *
   * @alias isRedoAvailable
   * @memberof! Handsontable.Core#
   * @returns {boolean}
   */
  instance.isRedoAvailable = function() {
    return instance.undoRedo.isRedoAvailable();
  };

  /**
   * {@link UndoRedo#clear}.
   *
   * @alias clearUndo
   * @memberof! Handsontable.Core#
   * @returns {boolean}
   */
  instance.clearUndo = function() {
    return instance.undoRedo.clear();
  };
}

/**
 * @param {Core} instance The Handsontable instance.
 */
function removeExposedUndoRedoMethods(instance) {
  delete instance.undo;
  delete instance.redo;
  delete instance.isUndoAvailable;
  delete instance.isRedoAvailable;
  delete instance.clearUndo;
}

const hook = Hooks.getSingleton();

hook.add('afterUpdateSettings', function() {
  this.getPlugin('undoRedo').init();
});

hook.register('beforeUndo');
hook.register('afterUndo');
hook.register('beforeRedo');
hook.register('afterRedo');

UndoRedo.PLUGIN_KEY = PLUGIN_KEY;

export default UndoRedo;
