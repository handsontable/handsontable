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

  constructor({ currentSortState, newSortState }) {
    super();
    this.previousSortState = currentSortState;
    this.nextSortState = newSortState;
  }

  static startRegisteringEvents(hot, undoRedoPlugin) {
    hot.addHook('beforeColumnSort', (currentSortState, newSortState, sortPossible) => {
      if (!sortPossible) {
        return;
      }

      undoRedoPlugin.done(() => new ColumnSortAction({
        currentSortState,
        newSortState,
      }));
    });
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot, undoneCallback) {
    const sortPlugin = hot.getPlugin('columnSorting');
    const multiSortPlugin = hot.getPlugin('multiColumnSorting');
    const enabledSortPlugin = multiSortPlugin.isEnabled() ? multiSortPlugin : sortPlugin;

    if (this.previousSortState.length) {
      enabledSortPlugin.sort(this.previousSortState);

    } else {
      enabledSortPlugin.clearSort();
    }

    undoneCallback();
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot, redoneCallback) {
    const sortPlugin = hot.getPlugin('columnSorting');
    const multiSortPlugin = hot.getPlugin('multiColumnSorting');
    const enabledSortPlugin = multiSortPlugin.isEnabled() ? multiSortPlugin : sortPlugin;

    enabledSortPlugin.sort(this.nextSortState);

    redoneCallback();
  }
}
