import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { clipRemovalRange } from '../../../utils/removalRange';
import { settleOnRemoveHook, type SettleCallback } from '../utils';
import { BaseAction } from './_base';
import { FIXED_COLUMN_COUNTS, removeAndKeepFixedCounts } from './fixedCounts';

/**
 * Action that tracks column creation.
 *
 * @class CreateColumnAction
 * @private
 */
export class CreateColumnAction extends BaseAction {
  /**
   * @param {number} index The visual column index.
   */
  index;
  /**
   * @param {number} amount The number of created columns.
   */
  amount;

  /**
   * Initializes the create column action with the visual insertion index and the number of columns created.
   */
  constructor({ index, amount }: { index: number, amount: number }) {
    super('insert_col');
    this.index = index;
    this.amount = amount;
  }

  /**
   * Registers the `afterCreateCol` hook listener that records a new CreateColumnAction after columns are inserted.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('afterCreateCol', (index: number, amount: number, source: string) => {
      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new CreateColumnAction({ index, amount }), source
      );
    });
  }

  /**
   * Reports whether undoing the insertion would remove any column.
   *
   * UndoRedo must call this before `beforeUndo`. Formulas always calls `engine.undo()` in `beforeUndo`,
   * so an undo whose removal names no column any more - the grid changed shape outside the stack since
   * the columns were created - would otherwise step HyperFormula while Handsontable stays unchanged.
   *
   * @param {Core} hot The Handsontable instance.
   * @returns {boolean} `true` when undo can proceed.
   */
  canUndo(hot: HotInstance): boolean {
    return clipRemovalRange(this.index, this.amount, hot.countCols()) !== null;
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: SettleCallback) {
    settleOnRemoveHook(hot, 'afterRemoveCol', undoneCallback, { wasUndone: false }, () => {
      removeAndKeepFixedCounts(hot, FIXED_COLUMN_COUNTS, () => {
        hot.alter('remove_col', this.index, this.amount, 'UndoRedo.undo');
      });
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    hot.addHookOnce('afterCreateCol', redoneCallback);
    hot.alter('insert_col_start', this.index, this.amount, 'UndoRedo.redo');
  }
}
