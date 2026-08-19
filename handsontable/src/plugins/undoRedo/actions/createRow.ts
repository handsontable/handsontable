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
   * @param {number} fixedRowsBottom Number of fixed rows on the bottom, taken from before the insertion.
   *   Undoing the insertion removes rows, and removing a bottom fixed row decreases that setting.
   */
  fixedRowsBottom;
  /**
   * @param {number} fixedRowsTop Number of fixed rows on the top, taken from before the insertion.
   *   Undoing the insertion removes rows, and removing a top fixed row decreases that setting.
   */
  fixedRowsTop;

  /**
   * Initializes the create row action with the visual insertion index, the number of rows created, and the
   * fixed-row counts to restore on undo.
   */
  constructor({ index, amount, fixedRowsBottom, fixedRowsTop }: {
    index: number, amount: number, fixedRowsBottom: number, fixedRowsTop: number
  }) {
    super('insert_row');
    this.index = index;
    this.amount = amount;
    this.fixedRowsBottom = fixedRowsBottom;
    this.fixedRowsTop = fixedRowsTop;
  }

  /**
   * Registers the `afterCreateRow` hook listener that records a new CreateRowAction after rows are inserted.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('afterCreateRow', (index: number, amount: number, source: string) => {
      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new CreateRowAction({
          index,
          amount,
          // Inserting rows never changes these, so the values read here are the ones from before the insertion.
          fixedRowsBottom: hot.getSettings().fixedRowsBottom ?? 0,
          fixedRowsTop: hot.getSettings().fixedRowsTop ?? 0,
        }), source
      );
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const rowCount = hot.countRows();
    const minSpareRows = hot.getSettings().minSpareRows;

    if (this.index >= rowCount && this.index - (minSpareRows ?? 0) < rowCount) {
      this.index -= (minSpareRows ?? 0); // work around the situation where the needed row was removed due to an 'undo' of a made change
    }

    hot.addHookOnce('afterRemoveRow', undoneCallback);
    hot.alter('remove_row', this.index, this.amount, 'UndoRedo.undo');

    const settings = hot.getSettings();

    // Rows inserted into the fixed area belong to that area when the undo removes them, so `alter`
    // legitimately decreases the counters. Restore the values captured before the insertion so the undo
    // brings back the whole previous state, including the pinned rows.
    if (settings.fixedRowsBottom !== this.fixedRowsBottom || settings.fixedRowsTop !== this.fixedRowsTop) {
      // Changing by the reference as `updateSettings` doesn't work the best.
      settings.fixedRowsBottom = this.fixedRowsBottom;
      settings.fixedRowsTop = this.fixedRowsTop;

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
