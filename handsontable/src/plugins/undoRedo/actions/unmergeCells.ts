import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import type { default as CellRange } from '../../../3rdparty/walkontable/src/cell/range';
import { BaseAction } from './_base';

/**
 * Action that tracks changes in merged cells.
 *
 * @class UnmergeCellsAction
 * @private
 */
export class UnmergeCellsAction extends BaseAction {
  /**
   * @param {CellRange} cellRange The merged cell range.
   */
  cellRange;

  /**
   * Initializes the unmerge cells action with the cell range that was unmerged.
   */
  constructor({ cellRange }: { cellRange: CellRange }) {
    super('unmerge_cells');
    this.cellRange = cellRange;
  }

  /**
   * Registers the `afterUnmergeCells` hook listener that records a new UnmergeCellsAction after cells are manually unmerged.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('afterUnmergeCells', (cellRange: unknown, auto: unknown) => {
      if (auto) {
        return;
      }

      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(
        () => new UnmergeCellsAction({ cellRange: cellRange as CellRange })
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

    mergeCellsPlugin.mergeRange(this.cellRange, true);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const mergeCellsPlugin = hot.getPlugin('mergeCells');

    hot.addHookOnce('afterViewRender', redoneCallback);

    mergeCellsPlugin.unmergeRange(this.cellRange, true);
    hot.render();
  }
}
