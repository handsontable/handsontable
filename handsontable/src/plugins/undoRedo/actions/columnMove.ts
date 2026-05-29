import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
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

  constructor({ columns, finalIndex }: { columns: number[], finalIndex: number }) {
    super('col_move');
    this.columns = columns.slice();
    this.finalColumnIndex = finalIndex;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeColumnMove', (columns: unknown, finalIndex: unknown) => {
      if (columns === false) {
        return;
      }

      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new ColumnMoveAction({ columns: columns as number[], finalIndex: finalIndex as number })
      );
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
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
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const manualColumnMove = hot.getPlugin('manualColumnMove');

    hot.addHookOnce('afterViewRender', redoneCallback);
    manualColumnMove.moveColumns(this.columns.slice(), this.finalColumnIndex);
    hot.render();

    hot.deselectCell();
    hot.selectColumns(this.finalColumnIndex, this.finalColumnIndex + this.columns.length - 1);
  }
}
