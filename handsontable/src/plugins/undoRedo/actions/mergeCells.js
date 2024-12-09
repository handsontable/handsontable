import { BaseAction } from './_base';

/**
 * Action that tracks changes in merged cells.
 *
 * @class MergeCellsAction
 * @private
 */
export class MergeCellsAction extends BaseAction {
  cellRange;

  constructor({ data, cellRange }) {
    super();
    this.cellRange = cellRange;
    this.data = data;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeMergeCells', (cellRange, auto) => {
      if (auto) {
        return;
      }

      const topStartCorner = cellRange.getTopStartCorner();
      const bottomEndCorner = cellRange.getBottomEndCorner();
      const data = hot.getData(
        topStartCorner.row,
        topStartCorner.col,
        bottomEndCorner.row,
        bottomEndCorner.col
      );

      undoRedoPlugin.done(() => new MergeCellsAction({ data, cellRange }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const mergeCellsPlugin = hot.getPlugin('mergeCells');

    hot.addHookOnce('afterViewRender', undoneCallback);

    mergeCellsPlugin.unmergeRange(this.cellRange, true);

    const topStartCorner = this.cellRange.getTopStartCorner();

    hot.populateFromArray(
      topStartCorner.row,
      topStartCorner.col,
      this.data,
      undefined,
      undefined,
      'MergeCells'
    );
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    const mergeCellsPlugin = hot.getPlugin('mergeCells');

    hot.addHookOnce('afterViewRender', redoneCallback);

    mergeCellsPlugin.mergeRange(this.cellRange);
  }
}
