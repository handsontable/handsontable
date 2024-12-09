import { BaseAction } from './_base';

/**
 * Action that tracks changes in merged cells.
 *
 * @class UnmergeCellsAction
 * @private
 */
export class UnmergeCellsAction extends BaseAction {
  cellRange;

  constructor({ cellRange }) {
    super();
    this.cellRange = cellRange;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('afterUnmergeCells', (cellRange, auto) => {
      if (auto) {
        return;
      }

      undoRedoPlugin.done(() => new UnmergeCellsAction({ cellRange }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const mergeCellsPlugin = hot.getPlugin('mergeCells');

    hot.addHookOnce('afterViewRender', undoneCallback);

    mergeCellsPlugin.mergeRange(this.cellRange, true);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    const mergeCellsPlugin = hot.getPlugin('mergeCells');

    hot.addHookOnce('afterViewRender', redoneCallback);

    mergeCellsPlugin.unmergeRange(this.cellRange, true);
    hot.render();
  }
}
