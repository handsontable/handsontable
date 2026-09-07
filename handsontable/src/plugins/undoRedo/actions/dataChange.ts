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
   * @param {number} countSourceRows The number of source rows before data change. This is what the
   *   undo measures the dataset against, because `countRows` counts only the rows a filter or a
   *   trim leaves visible - see `undo()`. Absent on an action built without it, and the undo then
   *   removes no rows at all rather than measuring against a count of something else.
   */
  declare countSourceRows: number | undefined;
  /**
   * @param {Array} mergedCells Merge areas this change destroyed, as `{ row, col, rowspan, colspan }`
   *   objects captured before the change landed. Empty for every change that destroys no merge.
   */
  declare mergedCells: MergeAreaGeometry[];
  /**
   * @param {Array} physicalRows The physical row of every entry in `changes`, in the same order,
   *   read when the change was recorded. `null` marks a change whose row did not exist yet - this
   *   is recorded from `beforeChange`, which runs before `applyChanges()` creates the rows a write
   *   past the last row needs.
   */
  declare physicalRows: (number | null)[];

  /**
   * Initializes the data change action with the recorded cell changes, selection state, and grid dimensions at the time of the change.
   */
  constructor({
    changes, selected, countCols, countRows, countSourceRows, mergedCells = [], physicalRows = []
  }: {
    changes: unknown[][], selected: unknown[], countCols: number, countRows: number,
    countSourceRows?: number, mergedCells?: MergeAreaGeometry[], physicalRows?: (number | null)[]
  }) {
    super('change');
    this.changes = changes;
    this.selected = selected;
    this.countCols = countCols;
    this.countRows = countRows;
    this.countSourceRows = countSourceRows;
    this.mergedCells = mergedCells;
    this.physicalRows = physicalRows;
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
        // Read now, alongside the visual row, because the visual row only describes the grid state
        // this edit happened in - a filter or a trim applied afterwards puts another row at that
        // index, or no row at all (DEV-2665). A row that does not exist yet has no physical index:
        // this hook runs before `applyChanges()` creates the rows a write past the last row needs,
        // and `null` is what tells the replay to address such a change visually.
        const physicalRows = clonedChanges.map(
          (change: unknown[]) => hot.toPhysicalRow(change[0] as number) as number | null
        );

        clonedChanges.forEach((change: unknown[]) => {
          change[1] = hot.propToCol(change[1] as string | number);
        });

        const selected = effectiveLen > 1
          ? (this.getSelected() as unknown[])
          : [[clonedChanges[0][0], clonedChanges[0][1]]];

        return new DataChangeAction({
          changes: clonedChanges,
          physicalRows,
          selected,
          countCols: hot.countCols(),
          countRows: hot.countRows(),
          countSourceRows: hot.countSourceRows(),
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
   * Routes every recorded change to the write path that can still reach the row it was recorded on.
   *
   * The row is addressed physically, so a change lands back on its own record rather than on
   * whatever row now sits at the recorded visual index. Three cases come out of that:
   *
   * - the row is visible, so it is written through the grid at its **current** visual index. This is
   *   the normal path, and it keeps everything a grid write brings with it: the validators, the
   *   `afterChange` hook the settle callback rides on, and the editor refresh;
   * - the row exists but is trimmed away (a filter, `trimRows`), so it has no visual index at all
   *   and the grid cannot address it. It is written straight to the source data instead;
   * - the row had no physical index when the change was recorded, which means it did not exist yet.
   *   The recorded visual index is all there is, and writing there is what re-creates the row, so
   *   this case keeps addressing the grid visually.
   *
   * A physical row is a **position** in the source array, not a record identity, so a row removal the
   * undo stack never recorded shifts it. Removing a row below the recorded one leaves this correct;
   * removing one above it slides the index onto a neighbouring record, and the write then lands there.
   * LIFO covers the ordinary case, because a recorded removal is undone before this action is reached.
   * The same shift is why `dataSource.setAtCell()` dropping a write past the last source row cannot be
   * read as "a removed row's value is discarded" - that only holds for a removal at the very end.
   *
   * @param {Core} hot The Handsontable instance.
   * @param {number} valueIndex Index of the value to replay within a change entry - `2` for the old
   *   value (undo), `3` for the new one (redo).
   * @returns {{gridChanges: Array, sourceChanges: Array}}
   */
  #collectWrites(hot: HotInstance, valueIndex: number) {
    // Cloned for the reason the whole change set used to be: a replayed object value has to be a
    // copy, so that mutating the cell afterwards cannot reach back into the stack.
    const data = deepClone(this.changes) as unknown[][];
    const gridChanges: unknown[][] = [];
    const sourceChanges: unknown[][] = [];

    data.forEach((change: unknown[], index: number) => {
      const visualColumn = change[1] as number;
      const value = change[valueIndex];
      // An action recorded before this field existed, or one built by hand, carries no entry here.
      // Every change then falls back to its recorded visual row, which is what used to happen.
      const physicalRow = this.physicalRows?.[index] ?? null;

      if (physicalRow === null) {
        gridChanges.push([change[0], visualColumn, value]);

        return;
      }

      const visualRow = hot.toVisualRow(physicalRow) as number | null;

      if (visualRow === null) {
        sourceChanges.push([physicalRow, hot.colToProp(visualColumn), value]);

        return;
      }

      gridChanges.push([visualRow, visualColumn, value]);
    });

    return { gridChanges, sourceChanges };
  }

  /**
   * Names the rows this change appended to the source data, as `alter()`'s `[visualRow, amount]`
   * groups, so each one is removed by its own index instead of by an amount counted from the last
   * visible row.
   *
   * A trailing row that is trimmed away is skipped: it has no visual index, and `alter()` addresses
   * rows visually. Skipping it leaves an empty row behind, which is what happened before the guard
   * could see the source data at all - and far better than the alternative, which is removing
   * whichever record happens to sit at the end of the visible range instead.
   *
   * @param {Core} hot The Handsontable instance.
   * @returns {Array} The `[visualRow, amount]` groups to remove, possibly empty.
   */
  #collectCreatedRows(hot: HotInstance) {
    const recordedSourceRows = this.countSourceRows;
    const createdRows: number[][] = [];

    // An action built by an external `done()` caller carries no source-row baseline. The removal is
    // then skipped rather than measured against `countRows`, which counts a different thing - mixing
    // the two deletes rows purely because a filter is active.
    if (!Number.isInteger(recordedSourceRows)) {
      return createdRows;
    }

    for (let physicalRow = recordedSourceRows!; physicalRow < hot.countSourceRows(); physicalRow++) {
      const visualRow = hot.toVisualRow(physicalRow) as number | null;

      if (visualRow !== null) {
        createdRows.push([visualRow, 1]);
      }
    }

    return createdRows;
  }

  /**
   * Replays both write lists and settles the action exactly once.
   *
   * The source-data writes run first, so the settle callback - which rides on the grid write's
   * `afterChange` - runs once the whole replay has landed. With no grid write to make, that hook
   * would never fire and the action has to settle from here instead. Leaving it armed would settle
   * this action on the next unrelated change, and until then `ignoreNewActions` stays on, dropping
   * every action the user performs in between.
   *
   * @param {Core} hot The Handsontable instance.
   * @param {Array} gridChanges Changes to write through the grid, as `[visualRow, visualColumn, value]`.
   * @param {Array} sourceChanges Changes to write to the source data, as `[physicalRow, prop, value]`.
   * @param {string} source The source string the writes carry.
   * @param {function(): void} settle Runs once the replay has landed.
   */
  #replay(
    hot: HotInstance, gridChanges: unknown[][], sourceChanges: unknown[][], source: string, settle: () => void
  ) {
    if (sourceChanges.length > 0) {
      hot.setSourceDataAtCell(sourceChanges, undefined, undefined, source);
    }

    if (gridChanges.length === 0) {
      settle();

      return;
    }

    hot.addHookOnce('afterChange', settle);

    try {
      hot.setDataAtCell(gridChanges, null, null, source);
    } catch (error) {
      // The write threw, so `afterChange` never fires. An armed hook would settle this half-applied
      // action on the next change to reach the grid - see `RemoveRowAction#undo`.
      hot.removeHook('afterChange', settle);

      throw error;
    }
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback) {
    const { gridChanges, sourceChanges } = this.#collectWrites(hot, 2);

    this.#replay(hot, gridChanges, sourceChanges, 'UndoRedo.undo', () => {
      // Rows the change grew the dataset by - a write past the last row creates the rows it needs,
      // and filling the last spare row makes `minSpareRows` top them up again. They are the trailing
      // *source* rows, not a count of visible ones: `countRows()` counts only what a filter or a trim
      // leaves visible, so measuring against it reads a filter applied or dropped since the change as
      // rows this action added, and then deletes that many rows of the user's data (DEV-2665).
      //
      // Each one is named by its own visual index rather than by an amount, because `alter()` counts
      // an amount from the last VISIBLE row - a different row as soon as anything is trimmed, so an
      // amount measured in source rows would delete a record this change never touched. A trailing
      // row that is trimmed has no visual index at all and cannot be addressed; it is left in place,
      // which is what happened before this guard could see it.
      const createdRows = this.#collectCreatedRows(hot);

      if (createdRows.length > 0) {
        hot.alter('remove_row', createdRows, undefined, 'UndoRedo.undo');
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
  }

  /**
   * @param {Core} hot The Handsontable instance.
   * @param {function(): void} redoneCallback The callback to be called after the action is redone.
   */
  redo(hot: HotInstance, redoneCallback: HookCallback) {
    const { gridChanges, sourceChanges } = this.#collectWrites(hot, 3);

    this.#replay(hot, gridChanges, sourceChanges, 'UndoRedo.redo', () => {
      // The redo write carries the `UndoRedo.redo` source, so the MergeCells plugin's own paste
      // path does not run - the merges it dropped have to be dropped again from here.
      unmergeCellsGeometryOnly(hot, this.mergedCells);

      hot.selectCells(this.selected, false, false);

      redoneCallback();
    });
  }
}
