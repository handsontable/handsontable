import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import type { default as CellRange } from '../../../3rdparty/walkontable/src/cell/range';
import { BaseAction } from './_base';

/**
 * Action that tracks changes in merged cells.
 *
 * @class MergeCellsAction
 * @private
 */
export class MergeCellsAction extends BaseAction {
  /**
   * @param {CellRange} cellRange The merged cell range.
   */
  cellRange;
  declare data: unknown;

  constructor({ data, cellRange }: { data: unknown, cellRange: CellRange }) {
    super('merge_cells');
    this.cellRange = cellRange;
    this.data = data;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeMergeCells', (cellRange: unknown, auto: unknown) => {
      if (auto) {
        return;
      }

      const typedCellRange = cellRange as CellRange;
      const topStartCorner = typedCellRange.getTopStartCorner();
      const bottomEndCorner = typedCellRange.getBottomEndCorner();
      const data = hot.getData(
        topStartCorner.row,
        topStartCorner.col,
        bottomEndCorner.row,
        bottomEndCorner.col
      );

      (undoRedoPlugin as { done: (callback: () => MergeCellsAction) => void }).done(
        () => new MergeCellsAction({ data, cellRange: typedCellRange })
      );
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const mergeCellsPlugin = hot.getPlugin('mergeCells');

    hot.addHookOnce('afterViewRender', undoneCallback);

    mergeCellsPlugin.unmergeRange(this.cellRange, true);

    const topStartCorner = this.cellRange.getTopStartCorner();

    hot.populateFromArray(
      topStartCorner.row,
      topStartCorner.col,
      this.data as unknown[][],
      undefined,
      undefined,
      'MergeCells'
    );
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const mergeCellsPlugin = hot.getPlugin('mergeCells');

    hot.addHookOnce('afterViewRender', redoneCallback);

    mergeCellsPlugin.mergeRange(this.cellRange);
  }
}
