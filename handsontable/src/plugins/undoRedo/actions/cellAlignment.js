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

  constructor({ stateBefore, range, type, alignment }) {
    super();
    this.stateBefore = stateBefore;
    this.range = range;
    this.type = type;
    this.alignment = alignment;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeCellAlignment', (stateBefore, range, type, alignment) => {
      undoRedoPlugin.done(() => new CellAlignmentAction({
        stateBefore, range, type, alignment
      }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    arrayEach(this.range, (range) => {
      range.forAll((row, col) => {
        // Alignment classes should only collected within cell ranges. We skip header coordinates.
        if (row >= 0 && col >= 0) {
          hot.setCellMeta(row, col, 'className', this.stateBefore[row][col] || ' htLeft');
        }
      });
    });

    hot.addHookOnce('afterViewRender', undoneCallback);
    hot.render();
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    align(this.range, this.type, this.alignment, (row, col) => hot.getCellMeta(row, col),
      (row, col, key, value) => hot.setCellMeta(row, col, key, value));

    hot.addHookOnce('afterViewRender', redoneCallback);
    hot.render();
  }
}
