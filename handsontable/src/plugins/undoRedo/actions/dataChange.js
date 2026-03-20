import { BaseAction } from './_base';
import { deepClone } from '../../../helpers/object';
import { DATA_PROVIDER_BATCH_UPDATE_SOURCES } from '../../dataProvider/constants';

/**
 * @param {object} settings Handsontable grid settings.
 * @returns {boolean} True when a server row-update callback is configured.
 */
function hasDataProviderRowsUpdate(settings) {
  const dp = settings.dataProvider;

  return !!(dp && typeof dp === 'object' && typeof dp.onRowsUpdate === 'function');
}

/**
 * Action that tracks data changes.
 *
 * Omits the undo stack for edits that DataProvider sends to the server via `onRowsUpdate` (sources in
 * `DATA_PROVIDER_BATCH_UPDATE_SOURCES` on the DataProvider module), so undo does not fight server-backed state.
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
    super('change');
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

      const settings = hot.getSettings();
      const skipUndoForServerUpdate = hasDataProviderRowsUpdate(settings)
        && DATA_PROVIDER_BATCH_UPDATE_SOURCES.has(source);

      if (skipUndoForServerUpdate) {
        return;
      }

      changes.find((change) => {
        if (change === null) {
          return false;
        }

        const [, , oldValue, newValue] = change;

        return oldValue !== newValue;
      });

      const wrappedAction = () => {
        const clonedChanges = changes.reduce((arr, change) => {
          if (change !== null) {
            arr.push([...change]);
          }

          return arr;
        }, []);

        if (clonedChanges.length === 0) {
          return null;
        }

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
    }, undoRedoPlugin.constructor.PLUGIN_PRIORITY);
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

    hot.addHookOnce('afterChange', () => {
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

      undoneCallback();
    });
    hot.setDataAtCell(data, null, null, 'UndoRedo.undo');
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

    hot.addHookOnce('afterChange', () => {
      hot.selectCells(this.selected, false, false);

      redoneCallback();
    });
    hot.setDataAtCell(data, null, null, 'UndoRedo.redo');
  }
}
