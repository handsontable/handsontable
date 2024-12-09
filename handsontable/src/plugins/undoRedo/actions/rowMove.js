import { BaseAction } from './_base';
import { getMoves } from '../../../helpers/moves';

/**
 * Action that tracks row move changes.
 *
 * @class RowMoveAction
 * @private
 */
export class RowMoveAction extends BaseAction {
  /**
   * @param {number[]} rows An array with moved rows.
   */
  rows;
  /**
   * @param {number} finalIndex The destination index.
   */
  finalRowIndex;

  constructor({ rows, finalIndex }) {
    super();
    this.rows = rows.slice();
    this.finalRowIndex = finalIndex;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeRowMove', (rows, finalIndex) => {
      if (rows === false) {
        return;
      }

      undoRedoPlugin.done(() => new RowMoveAction({ rows, finalIndex }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const manualRowMove = hot.getPlugin('manualRowMove');

    hot.addHookOnce('afterViewRender', undoneCallback);

    const rowMoves = getMoves(this.rows, this.finalRowIndex, hot.rowIndexMapper.getNumberOfIndexes());

    rowMoves.reverse().forEach(({ from, to }) => {
      if (from < to) {
        to -= 1;
      }

      manualRowMove.moveRow(to, from);
    });

    hot.render();
    hot.deselectCell();
    hot.selectRows(this.rows[0], this.rows[0] + this.rows.length - 1);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    const manualRowMove = hot.getPlugin('manualRowMove');

    hot.addHookOnce('afterViewRender', redoneCallback);
    manualRowMove.moveRows(this.rows.slice(), this.finalRowIndex);
    hot.render();

    hot.deselectCell();
    hot.selectRows(this.finalRowIndex, this.finalRowIndex + this.rows.length - 1);
  }
}
