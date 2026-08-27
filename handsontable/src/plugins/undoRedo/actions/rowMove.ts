import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
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

  /**
   * Initializes the row move action with the array of moved row indexes and their destination index.
   */
  constructor({ rows, finalIndex }: { rows: number[], finalIndex: number }) {
    super('row_move');
    this.rows = rows.slice();
    this.finalRowIndex = finalIndex;
  }

  /**
   * Registers the `afterRowMove` hook listener that records a new RowMoveAction whenever rows are moved.
   *
   * Recording runs on `afterRowMove`, not `beforeRowMove`. UndoRedo registers its actions from its own
   * constructor, while plugins register in `enablePlugin` (via `beforeInit`) and settings hooks are
   * attached later still, so this is always the first instance listener on the hook. `Hooks.run` threads
   * a listener's return value into the next listener's first argument, so every veto is raised after this
   * listener has already run: the old `rows === false` guard caught no plugin or settings veto at all, and
   * a cancelled move always reached the stack. `afterRowMove` never fires for a vetoed move, and its
   * `orderChanged` argument is `false` when the move was impossible or left the order intact, so gating on
   * it also keeps no-op moves off the stack.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('afterRowMove', (movedRows, finalIndex, _dropIndex, _movePossible, orderChanged) => {
      // Only a global `Handsontable.hooks.add` listener runs ahead of this one, and its return value
      // would replace `movedRows` — guard the shape before `RowMoveAction` calls `.slice()` on it.
      if (!orderChanged || !Array.isArray(movedRows)) {
        return;
      }

      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new RowMoveAction({ rows: movedRows, finalIndex })
      );
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
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
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const manualRowMove = hot.getPlugin('manualRowMove');

    hot.addHookOnce('afterViewRender', redoneCallback);
    manualRowMove.moveRows(this.rows.slice(), this.finalRowIndex);
    hot.render();

    hot.deselectCell();
    hot.selectRows(this.finalRowIndex, this.finalRowIndex + this.rows.length - 1);
  }
}
