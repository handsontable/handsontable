import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import type { default as CellRange } from '../../../3rdparty/walkontable/src/cell/range';
import { BaseAction } from './_base';
import { arrayEach } from '../../../helpers/array';

/**
 * Action that tracks read-only toggles made through the context menu / column menu "Read only" item.
 *
 * @class ReadOnlyToggleAction
 * @private
 */
export class ReadOnlyToggleAction extends BaseAction {
  /**
   * @param {object} stateBefore The previous state.
   */
  stateBefore;
  /**
   * @param {Array} ranges The cell ranges the toggle was applied to.
   */
  ranges;
  /**
   * @param {boolean} readOnly The read-only state applied by the toggle.
   */
  readOnly;

  /**
   * Initializes the read-only toggle action with the previous per-cell state, the affected cell ranges,
   * and the new read-only state.
   */
  constructor({ stateBefore, ranges, readOnly }: {
    stateBefore: Record<number, boolean[]>, ranges: CellRange[], readOnly: boolean
  }) {
    super('read_only_toggle');
    this.stateBefore = stateBefore;
    this.ranges = ranges;
    this.readOnly = readOnly;
  }

  /**
   * Registers the `beforeReadOnlyToggle` hook listener that records a new ReadOnlyToggleAction whenever
   * the read-only state changes.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    const plugin = undoRedoPlugin as { done: (callback: () => ReadOnlyToggleAction) => void };

    hot.addHook('beforeReadOnlyToggle',
      (stateBefore: unknown, ranges: CellRange[], readOnly: boolean) => {
        plugin.done(() => new ReadOnlyToggleAction({
          stateBefore: stateBefore as Record<number, boolean[]>, ranges, readOnly
        }));
      });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    arrayEach(this.ranges, (range: CellRange) => {
      range.forAll((row: number, col: number) => {
        // Read-only states are only collected within cell ranges. We skip header coordinates.
        if (row >= 0 && col >= 0) {
          // `readOnly` defaults to `false` (unlike alignment's `className`), so the captured state is
          // always the coerced boolean the cell actually had - restoring it puts a mixed-state
          // selection back exactly as it was, not to one uniform value.
          hot.setCellMeta(row, col, 'readOnly', Boolean(this.stateBefore[row]?.[col]));
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
    arrayEach(this.ranges, (range: CellRange) => {
      range.forAll((row: number, col: number) => {
        // Read-only states are only collected within cell ranges. We skip header coordinates.
        if (row >= 0 && col >= 0) {
          hot.setCellMeta(row, col, 'readOnly', this.readOnly);
        }

        return true;
      });
    });

    hot.addHookOnce('afterViewRender', redoneCallback);
    hot.render();
  }
}
