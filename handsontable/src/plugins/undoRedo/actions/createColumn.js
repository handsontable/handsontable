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

  constructor({ index, amount }) {
    super();
    this.index = index;
    this.amount = amount;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('afterCreateCol', (index, amount, source) => {
      undoRedoPlugin.done(() => new CreateColumnAction({ index, amount }), source);
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    hot.addHookOnce('afterRemoveCol', undoneCallback);
    hot.alter('remove_col', this.index, this.amount, 'UndoRedo.undo');
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    hot.addHookOnce('afterCreateCol', redoneCallback);
    hot.alter('insert_col_start', this.index, this.amount, 'UndoRedo.redo');
  }
}
