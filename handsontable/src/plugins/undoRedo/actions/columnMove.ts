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

  /**
   * Initializes the column move action with the array of moved column indexes and their destination index.
   */
  constructor({ columns, finalIndex }: { columns: number[], finalIndex: number }) {
    super('col_move');
    this.columns = columns.slice();
    this.finalColumnIndex = finalIndex;
  }

  /**
   * Registers the `afterColumnMove` hook listener that records a new ColumnMoveAction whenever columns are moved.
   *
   * Recording runs on `afterColumnMove`, not `beforeColumnMove`. UndoRedo registers its actions from its
   * own constructor, while plugins register in `enablePlugin` (via `beforeInit`) and settings hooks are
   * attached later still, so this is always the first instance listener on the hook. `Hooks.run` threads
   * a listener's return value into the next listener's first argument, so every veto is raised after this
   * listener has already run: the old `columns === false` guard caught no plugin or settings veto at all,
   * and a cancelled move always reached the stack. `afterColumnMove` never fires for a vetoed move, and its
   * `orderChanged` argument is `false` when the move was impossible or left the order intact, so gating on
   * it also keeps no-op moves off the stack.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('afterColumnMove', (movedColumns, finalIndex, _dropIndex, _movePossible, orderChanged) => {
      // Only a global `Handsontable.hooks.add` listener runs ahead of this one, and its return value
      // would replace `movedColumns` — guard the shape before `ColumnMoveAction` calls `.slice()` on it.
      if (!orderChanged || !Array.isArray(movedColumns)) {
        return;
      }

      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new ColumnMoveAction({ columns: movedColumns, finalIndex })
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
