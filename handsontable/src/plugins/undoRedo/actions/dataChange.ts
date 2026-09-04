import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import { BaseAction } from './_base';
import { deepClone } from '../../../helpers/object';
import {
  collectMergedCellsDestroyedByChange,
  remergeCellsGeometryOnly,
  unmergeCellsGeometryOnly,
} from '../utils';
import type { MergeAreaGeometry } from '../../../utils/mergeAreas';

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
  /**
   * @param {Array} mergedCells Merge areas this change destroyed, as `{ row, col, rowspan, colspan }`
   *   objects captured before the change landed. Empty for every change that destroys no merge.
   */
  declare mergedCells: MergeAreaGeometry[];

  /**
   * Initializes the data change action with the recorded cell changes, selection state, and grid dimensions at the time of the change.
   */
  constructor({ changes, selected, countCols, countRows, mergedCells = [] }: {
    changes: unknown[][], selected: unknown[], countCols: number, countRows: number,
    mergedCells?: MergeAreaGeometry[]
  }) {
    super('change');
    this.changes = changes;
    this.selected = selected;
    this.countCols = countCols;
    this.countRows = countRows;
    this.mergedCells = mergedCells;
  }

  /**
   * Registers the `beforeChange` hook listener that captures effective cell value changes and records them as DataChangeActions.
   */
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
          // Merge areas this change is about to destroy. Carried inside this action so a single
          // undo step puts back both the data and the geometry - see the MergeCells plugin, which
          // records them from its own `beforeChange` listener at an earlier priority than this one.
          // `source` decides ownership: a paste's validation window can carry other changes, and
          // none of them may inherit this geometry.
          mergedCells: collectMergedCellsDestroyedByChange(hot, source),
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

      // After the data restore, never before it: re-merging first would clear the very cells the
      // restore has just refilled.
      remergeCellsGeometryOnly(hot, this.mergedCells);

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
      // The redo write carries the `UndoRedo.redo` source, so the MergeCells plugin's own paste
      // path does not run - the merges it dropped have to be dropped again from here.
      unmergeCellsGeometryOnly(hot, this.mergedCells);

      hot.selectCells(this.selected, false, false);

      redoneCallback();
    });
    hot.setDataAtCell(data, null, null, 'UndoRedo.redo');
  }
}
