import { BaseAction } from './_base';
import { deepClone } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';

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

  constructor({ changes, selected }) {
    super();
    this.changes = changes;
    this.selected = selected;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('afterChange', function(changes, source) {
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
          change[1] = hot.propToCol(change[1]);
        });

        const selected = changesLen > 1 ? this.getSelected() : [[clonedChanges[0][0], clonedChanges[0][1]]];

        return new DataChangeAction({
          changes: clonedChanges,
          selected,
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
    const emptyRowsAtTheEnd = hot.countEmptyRows(true);
    const emptyColsAtTheEnd = hot.countEmptyCols(true);

    for (let i = 0, len = data.length; i < len; i++) {
      data[i].splice(3, 1);
    }

    hot.addHookOnce('afterChange', undoneCallback);

    hot.setDataAtCell(data, null, null, 'UndoRedo.undo');

    for (let i = 0, len = data.length; i < len; i++) {
      const [row, column] = data[i];

      if (hot.getSettings().minSpareRows &&
          row + 1 + hot.getSettings().minSpareRows === hot.countRows() &&
          emptyRowsAtTheEnd === hot.getSettings().minSpareRows) {

        hot.alter('remove_row', parseInt(row + 1, 10), hot.getSettings().minSpareRows);
        hot.undoRedo.doneActions.pop();
      }

      if (hot.getSettings().minSpareCols &&
          column + 1 + hot.getSettings().minSpareCols === hot.countCols() &&
          emptyColsAtTheEnd === hot.getSettings().minSpareCols) {

        hot.alter('remove_col', parseInt(column + 1, 10), hot.getSettings().minSpareCols);
        hot.undoRedo.doneActions.pop();
      }
    }

    const selectedLast = hot.getSelectedLast();

    if (selectedLast !== undefined) {
      const [changedRow, changedColumn] = data[0];
      const [selectedRow, selectedColumn] = selectedLast;
      const firstFullyVisibleRow = hot.getFirstFullyVisibleRow();
      const firstFullyVisibleColumn = hot.getFirstFullyVisibleColumn();
      const isInVerticalViewPort = changedRow >= firstFullyVisibleRow;
      const isInHorizontalViewPort = changedColumn >= firstFullyVisibleColumn;
      const isInViewport = isInVerticalViewPort && isInHorizontalViewPort;
      const isChangedSelection = selectedRow !== changedRow || selectedColumn !== changedColumn;

      // Performing scroll only when selection has been changed right after editing a cell.
      if (isInViewport === false && isChangedSelection === true) {
        const scrollConfig = {
          row: changedRow,
          col: changedColumn,
        };

        if (isInVerticalViewPort === false) {
          scrollConfig.verticalSnap = 'top';
        }

        if (isInHorizontalViewPort === false) {
          scrollConfig.horizontalSnap = 'start';
        }

        hot.scrollViewportTo(scrollConfig);
      }
    }

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
