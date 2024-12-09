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

  constructor({ index, amount }) {
    super();
    this.index = index;
    this.amount = amount;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('afterCreateRow', (index, amount, source) => {
      undoRedoPlugin.done(() => new CreateRowAction({ index, amount }), source);
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const rowCount = hot.countRows();
    const minSpareRows = hot.getSettings().minSpareRows;

    if (this.index >= rowCount && this.index - minSpareRows < rowCount) {
      this.index -= minSpareRows; // work around the situation where the needed row was removed due to an 'undo' of a made change
    }

    hot.addHookOnce('afterRemoveRow', undoneCallback);
    hot.alter('remove_row', this.index, this.amount, 'UndoRedo.undo');
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    hot.addHookOnce('afterCreateRow', redoneCallback);
    hot.alter('insert_row_above', this.index, this.amount, 'UndoRedo.redo');
  }
}
