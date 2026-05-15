import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';

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

  constructor({ index, amount }: { index: number, amount: number }) {
    super('insert_col');
    this.index = index;
    this.amount = amount;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('afterCreateCol', (index: number, amount: number, source: string) => {
      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new CreateColumnAction({ index, amount }), source
      );
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    hot.addHookOnce('afterRemoveCol', undoneCallback);
    hot.alter('remove_col', this.index, this.amount, 'UndoRedo.undo');
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
