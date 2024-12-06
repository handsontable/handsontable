import { BaseAction } from './_base';
import { getMoves } from '../../../helpers/moves';

/**
 * Action that tracks column move changes.
 *
 * @class ColumnMoveAction
 * @private
 */
export class ColumnMoveAction extends BaseAction {
  /**
   * @param {number[]} columns An array with moved columns.
   */
  columns;
  /**
   * @param {number} finalIndex The destination index.
   */
  finalColumnIndex;

  constructor({ columns, finalIndex }) {
    super();
    this.columns = columns.slice();
    this.finalColumnIndex = finalIndex;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeColumnMove', (columns, finalIndex) => {
      if (columns === false) {
        return;
      }

      undoRedoPlugin.done(() => new ColumnMoveAction({ columns, finalIndex }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const manualColumnMove = hot.getPlugin('manualColumnMove');

    hot.addHookOnce('afterViewRender', undoneCallback);

    const columnMoves = getMoves(this.columns, this.finalColumnIndex, hot.columnIndexMapper.getNumberOfIndexes());

    columnMoves.reverse().forEach(({ from, to }) => {
      if (from < to) {
        to -= 1;
      }

      manualColumnMove.moveColumn(to, from);
    });

    hot.render();
    hot.deselectCell();
    hot.selectColumns(this.columns[0], this.columns[0] + this.columns.length - 1);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    const manualColumnMove = hot.getPlugin('manualColumnMove');

    hot.addHookOnce('afterViewRender', redoneCallback);
    manualColumnMove.moveColumns(this.columns.slice(), this.finalColumnIndex);
    hot.render();

    hot.deselectCell();
    hot.selectColumns(this.finalColumnIndex, this.finalColumnIndex + this.columns.length - 1);
  }
}
