import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';

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
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const rowCount = hot.countRows();
    const settings = hot.getSettings();
    const minSpareRows = settings.minSpareRows;

    if (this.index >= rowCount && this.index - (minSpareRows ?? 0) < rowCount) {
      this.index -= (minSpareRows ?? 0); // work around the situation where the needed row was removed due to an 'undo' of a made change
    }

    // Read before the removal - `alter` decreases these when it removes a fixed row.
    const fixedRowsBottom = settings.fixedRowsBottom ?? 0;
    const fixedRowsTop = settings.fixedRowsTop ?? 0;

    hot.addHookOnce('afterRemoveRow', undoneCallback);
    hot.alter('remove_row', this.index, this.amount, 'UndoRedo.undo');

    // Rows inserted into the fixed area belong to that area when the undo removes them, so `alter`
    // decreases the counters. The rows are back to the state from before the insertion, so the counters
    // have to go back as well (DEV-2551). Only a decrease is reverted - a value raised in the meantime
    // by `updateSettings` stays as the user set it.
    if ((settings.fixedRowsBottom ?? 0) < fixedRowsBottom || (settings.fixedRowsTop ?? 0) < fixedRowsTop) {
      // Changing by the reference as `updateSettings` doesn't work the best.
      settings.fixedRowsBottom = fixedRowsBottom;
      settings.fixedRowsTop = fixedRowsTop;

      hot.render();
    }
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
