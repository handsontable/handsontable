import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { clipRemovalRange } from '../../../utils/removalRange';
import { settleOnRemoveHook, type SettleCallback } from '../utils';
import { BaseAction } from './_base';
import { FIXED_ROW_COUNTS, removeAndKeepFixedCounts } from './fixedCounts';

/**
 * Resolves the visual index the undo removes the created rows from.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} index The recorded visual index of the created rows.
 * @returns {number} The visual index to remove the rows from.
 */
function getUndoIndex(hot: HotInstance, index: number): number {
  const rowCount = hot.countRows();
  const minSpareRows = hot.getSettings().minSpareRows ?? 0;

  // Work around the situation where the needed row was removed due to an 'undo' of a made change.
  if (index >= rowCount && index - minSpareRows < rowCount) {
    return index - minSpareRows;
  }

  return index;
}

/**
 * Action that tracks row creation.
 *
 * @class CreateRowAction
 * @private
 */
export class CreateRowAction extends BaseAction {
  /**
   * @param {number} index The visual row index.
   */
  index;
  /**
   * @param {number} amount The number of created rows.
   */
  amount;

  /**
   * Initializes the create row action with the visual insertion index and the number of rows created.
   */
  constructor({ index, amount }: { index: number, amount: number }) {
    super('insert_row');
    this.index = index;
    this.amount = amount;
  }

  /**
   * Registers the `afterCreateRow` hook listener that records a new CreateRowAction after rows are inserted.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('afterCreateRow', (index: number, amount: number, source: string) => {
      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new CreateRowAction({ index, amount }), source
      );
    });
  }

  /**
   * Reports whether undoing the insertion would remove any row.
   *
   * UndoRedo must call this before `beforeUndo`. Formulas always calls `engine.undo()` in `beforeUndo`,
   * so an undo whose removal names no row any more - the grid changed shape outside the stack since the
   * rows were created - would otherwise step HyperFormula while Handsontable stays unchanged.
   *
   * @param {Core} hot The Handsontable instance.
   * @returns {boolean} `true` when undo can proceed.
   */
  canUndo(hot: HotInstance): boolean {
    return clipRemovalRange(getUndoIndex(hot, this.index), this.amount, hot.countRows()) !== null;
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: SettleCallback) {
    this.index = getUndoIndex(hot, this.index);

    settleOnRemoveHook(hot, 'afterRemoveRow', undoneCallback, { wasUndone: false }, () => {
      removeAndKeepFixedCounts(hot, FIXED_ROW_COUNTS, () => {
        hot.alter('remove_row', this.index, this.amount, 'UndoRedo.undo');
      });
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    hot.addHookOnce('afterCreateRow', redoneCallback);
    hot.alter('insert_row_above', this.index, this.amount, 'UndoRedo.redo');
  }
}
