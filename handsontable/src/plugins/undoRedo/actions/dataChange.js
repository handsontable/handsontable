import { BaseAction } from './_base';
import { deepClone } from '../../../helpers/object';

/**
 * Action that tracks data changes.
 *
 * @class DataChangeAction
 * @private
 */
export class DataChangeAction extends BaseAction {
  /**
   * @param {Array} changes 2D array containing information about each of the edited cells.
   */
  changes;
  /**
   * @param {number[]} selected The cell selection.
   */
  selected;
  /**
   * @param {number} countCols The number of columns before data change.
   */
  countCols;
  /**
   * @param {number} countRows The number of rows before data change.
   */
  countRows;

  constructor({ changes, selected, countCols, countRows }) {
    super();
    this.changes = changes;
    this.selected = selected;
    this.countCols = countCols;
    this.countRows = countRows;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeChange', function(changes, source) {
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

        clonedChanges.forEach((change) => {
          change[1] = hot.propToCol(change[1]);
        });

        const selected = changesLen > 1 ? this.getSelected() : [[clonedChanges[0][0], clonedChanges[0][1]]];

        return new DataChangeAction({
          changes: clonedChanges,
          selected,
          countCols: hot.countCols(),
          countRows: hot.countRows(),
        });
      };

      undoRedoPlugin.done(wrappedAction, source);
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const data = deepClone(this.changes);

    for (let i = 0, len = data.length; i < len; i++) {
      data[i].splice(3, 1);
    }

    hot.addHookOnce('afterChange', undoneCallback);
    hot.setDataAtCell(data, null, null, 'UndoRedo.undo');

    const rowsToRemove = hot.countRows() - this.countRows;

    if (rowsToRemove > 0) {
      hot.alter('remove_row', null, rowsToRemove, 'UndoRedo.undo');
    }

    const columnsToRemove = hot.countCols() - this.countCols;

    if (columnsToRemove > 0 && hot.isColumnModificationAllowed()) {
      hot.alter('remove_col', null, columnsToRemove, 'UndoRedo.undo');
    }

    hot.scrollToFocusedCell();
    hot.selectCells(this.selected, false, false);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    const data = deepClone(this.changes);

    for (let i = 0, len = data.length; i < len; i++) {
      data[i].splice(2, 1);
    }

    hot.addHookOnce('afterChange', redoneCallback);
    hot.setDataAtCell(data, null, null, 'UndoRedo.redo');

    if (this.selected) {
      hot.selectCells(this.selected, false, false);
    }
  }
}
