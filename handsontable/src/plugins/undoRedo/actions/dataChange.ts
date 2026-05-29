import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';
import { deepClone } from '../../../helpers/object';

/**
 * Minimal interface for the UndoRedo plugin used by action classes.
 */
interface UndoRedoPluginLike {
  // eslint-disable-next-line no-use-before-define
  done(wrappedAction: () => DataChangeAction, source: string): void;
}

/**
 * Action that tracks data changes.
 *
 * @class DataChangeAction
 * @private
 */
export class DataChangeAction extends BaseAction {
  /**
   * @param {Array} changes 2D array containing information about each of the edited cells.
   */
  declare changes: unknown[][];
  /**
   * @param {number[]} selected The cell selection.
   */
  declare selected: unknown[];
  /**
   * @param {number} countCols The number of columns before data change.
   */
  declare countCols: number;
  /**
   * @param {number} countRows The number of rows before data change.
   */
  declare countRows: number;

  constructor({ changes, selected, countCols, countRows }: {
    changes: unknown[][], selected: unknown[], countCols: number, countRows: number
  }) {
    super('change');
    this.changes = changes;
    this.selected = selected;
    this.countCols = countCols;
    this.countRows = countRows;
  }

  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    const plugin = undoRedoPlugin as UndoRedoPluginLike;

    // Run after other beforeChange hooks (e.g. user's) so we see nullified entries and only record effective changes.
    hot.addHook('beforeChange', function(this: HotInstance, changes: unknown[], source: string) {
      const changesLen = changes && changes.length;

      if (!changesLen) {
        return;
      }

      // Only record changes that were not nullified by other beforeChange hooks (e.g. user setting changes[i] = null).
      const effectiveChanges = (changes as (unknown[] | null)[]).filter(
        (change): change is unknown[] => change !== null && change !== undefined && Array.isArray(change)
      );

      if (effectiveChanges.length === 0) {
        return;
      }

      const hasDifferences = effectiveChanges.find((change: unknown[]) => {
        const [, , oldValue, newValue] = change;

        return oldValue !== newValue;
      });

      const effectiveLen = effectiveChanges.length;

      const wrappedAction = () => {
        const clonedChanges = effectiveChanges.map(
          (change: unknown[]) => [...change]
        );

        clonedChanges.forEach((change: unknown[]) => {
          change[1] = hot.propToCol(change[1] as string | number);
        });

        const selected = effectiveLen > 1
          ? (this.getSelected() as unknown[])
          : [[clonedChanges[0][0], clonedChanges[0][1]]];

        return new DataChangeAction({
          changes: clonedChanges,
          selected,
          countCols: hot.countCols(),
          countRows: hot.countRows(),
        });
      };

      plugin.done(wrappedAction, source);
    }, 1000);
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const data = deepClone(this.changes) as unknown[][];

    for (let i = 0, len = data.length; i < len; i++) {
      data[i].splice(3, 1);
    }

    hot.addHookOnce('afterChange', () => {
      const rowsToRemove = hot.countRows() - this.countRows;

      if (rowsToRemove > 0) {
        hot.alter('remove_row', undefined, rowsToRemove, 'UndoRedo.undo');
      }

      const columnsToRemove = hot.countCols() - this.countCols;

      if (columnsToRemove > 0 && hot.isColumnModificationAllowed()) {
        hot.alter('remove_col', undefined, columnsToRemove, 'UndoRedo.undo');
      }

      hot.scrollToFocusedCell();
      hot.selectCells(this.selected, false, false);

      undoneCallback();
    });
    hot.setDataAtCell(data, null, null, 'UndoRedo.undo');
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const data = deepClone(this.changes) as unknown[][];

    for (let i = 0, len = data.length; i < len; i++) {
      data[i].splice(2, 1);
    }

    hot.addHookOnce('afterChange', () => {
      hot.selectCells(this.selected, false, false);

      redoneCallback();
    });
    hot.setDataAtCell(data, null, null, 'UndoRedo.redo');
  }
}
