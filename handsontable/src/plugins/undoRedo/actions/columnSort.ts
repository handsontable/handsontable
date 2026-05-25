import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import type { SortConfig } from '../../columnSorting/columnSorting';
import { BaseAction } from './_base';

/**
 * Action that tracks column sort changes.
 *
 * @class ColumnSortAction
 * @private
 */
export class ColumnSortAction extends BaseAction {
  /**
   * @param {Array} currentSortState The current sort state.
   */
  previousSortState;
  /**
   * @param {Array} newSortState The new sort state.
   */
  nextSortState;

  constructor({ currentSortState, newSortState }: { currentSortState: unknown, newSortState: unknown }) {
    super('col_sort');
    this.previousSortState = currentSortState;
    this.nextSortState = newSortState;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    hot.addHook('beforeColumnSort', (currentSortState: unknown, newSortState: unknown, sortPossible: unknown) => {
      if (!sortPossible) {
        return;
      }

      (undoRedoPlugin as { done: (...args: unknown[]) => void }).done(() => new ColumnSortAction({
        currentSortState,
        newSortState,
      }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const sortPlugin = hot.getPlugin('columnSorting');
    const multiSortPlugin = hot.getPlugin('multiColumnSorting');
    const enabledSortPlugin = multiSortPlugin.isEnabled() ? multiSortPlugin : sortPlugin;

    if ((this.previousSortState as unknown[]).length) {
      enabledSortPlugin.sort(this.previousSortState as SortConfig | SortConfig[]);

    } else {
      enabledSortPlugin.clearSort();
    }

    undoneCallback();
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const sortPlugin = hot.getPlugin('columnSorting');
    const multiSortPlugin = hot.getPlugin('multiColumnSorting');
    const enabledSortPlugin = multiSortPlugin.isEnabled() ? multiSortPlugin : sortPlugin;

    enabledSortPlugin.sort(this.nextSortState as SortConfig | SortConfig[]);

    redoneCallback();
  }
}
