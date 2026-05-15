import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import type { default as CellRange } from '../../../3rdparty/walkontable/src/cell/range';
import { BaseAction } from './_base';
import { align } from '../../contextMenu/utils';
import { arrayEach } from '../../../helpers/array';
/**
 * Action that tracks cell alignment changes.
 *
 * @class CellAlignmentAction
 * @private
 */
export class CellAlignmentAction extends BaseAction {
  /**
   * @param {Array} stateBefore The previous state.
   */
  stateBefore;
  /**
   * @param {object} range The cell range.
   */
  range;
  /**
   * @param {string} type The type of the alignment ("top", "left", "bottom" or "right").
   */
  type;
  /**
   * @param {string} alignment The alignment CSS class.
   */
  alignment;

  constructor({ stateBefore, range, type, alignment }: {
    stateBefore: unknown[], range: CellRange[], type: string, alignment: string
  }) {
    super('cell_alignment');
    this.stateBefore = stateBefore;
    this.range = range;
    this.type = type;
    this.alignment = alignment;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeCellAlignment', (stateBefore: unknown, range: CellRange[], type: string, alignment: unknown) => {
      (undoRedoPlugin as { done: (callback: () => CellAlignmentAction) => void }).done(() => new CellAlignmentAction({
        stateBefore: stateBefore as unknown[], range, type, alignment: alignment as string
      }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    arrayEach(this.range, (range: CellRange) => {
      range.forAll((row: number, col: number) => {
        // Alignment classes should only collected within cell ranges. We skip header coordinates.
        if (row >= 0 && col >= 0) {
          hot.setCellMeta(row, col, 'className', (this.stateBefore as string[][])[row][col] || ' htLeft');
        }

        return true;
      });
    });

    hot.addHookOnce('afterViewRender', undoneCallback);
    hot.render();
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    align(this.range, this.type, this.alignment, (row: number, col: number) => hot.getCellMeta(row, col),
      (row: number, col: number, key: string, value: unknown) => hot.setCellMeta(row, col, key, value));

    hot.addHookOnce('afterViewRender', redoneCallback);
    hot.render();
  }
}
