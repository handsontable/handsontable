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
  /**
   * Stores the cell data captured before the merge, used to restore values when the action is undone.
   */
  declare data: unknown;

  /**
   * Initializes the merge cells action with the affected cell range and the original cell data.
   */
  constructor({ data, cellRange }: { data: unknown, cellRange: CellRange }) {
    super('merge_cells');
    this.cellRange = cellRange;
    this.data = data;
  }

  /**
   * Registers the hooks needed to capture merge and unmerge events so they can be tracked for undo and redo.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeMergeCells', (cellRange: unknown, auto: unknown) => {
      if (auto) {
        return;
      }

      const typedCellRange = cellRange as CellRange;
      const topStartCorner = typedCellRange.getTopStartCorner();
      const bottomEndCorner = typedCellRange.getBottomEndCorner();
      const data = hot.getData(
        topStartCorner.row ?? undefined,
        topStartCorner.col ?? undefined,
        bottomEndCorner.row ?? undefined,
        bottomEndCorner.col ?? undefined
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
      topStartCorner.row ?? 0,
      topStartCorner.col ?? 0,
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
