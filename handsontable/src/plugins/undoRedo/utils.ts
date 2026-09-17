import type { HotInstance } from '../../core/types';
import { rangeEach } from '../../helpers/number';
import { toMergeAreaRange, type MergeAreaGeometry as MergedCell } from '../../utils/mergeAreas';

/**
 * The callback an action calls once its undo or redo has landed. Called with no argument, the action
 * applied. `{ wasUndone: false }` or `{ wasRedone: false }` tells the stack it did not, and puts the
 * action back on the stack it came from.
 */
export type SettleCallback = (result?: { wasUndone?: boolean, wasRedone?: boolean }) => void;

/**
 * Runs a removal that settles an undo or redo through a remove hook, and settles it anyway when the
 * removal fires no hook.
 *
 * The row and column actions settle on `afterRemoveRow` / `afterRemoveCol`, and a removal that removes
 * nothing fires neither. `canUndo()` / `canRedo()` already keep a removal that would name no row or
 * column from starting, so this is the safety net for the one case they cannot see coming: a
 * `beforeRemoveRow` / `beforeRemoveCol` listener that vetoes the removal. Without it the settle callback
 * would never run, `ignoreNewActions` would stay on, and every later action would be dropped from the
 * stack for the rest of the session. It settles with `notAppliedResult` instead, which puts the action
 * back on the stack it came from.
 *
 * The hook listener settles with no argument rather than forwarding the hook's own arguments: those are
 * the removed index and amount, and a preceding listener's return value can be folded into the first of
 * them, so reading one as a settle result could wrongly report the action as not applied.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {string} hookName The remove hook the removal fires when it runs.
 * @param {Function} settleCallback The undo or redo settle callback.
 * @param {object} notAppliedResult The result that tells the stack the action did not apply.
 * @param {Function} removal The callback that runs the removal.
 */
export function settleOnRemoveHook(
  hot: HotInstance,
  hookName: 'afterRemoveRow' | 'afterRemoveCol',
  settleCallback: SettleCallback,
  notAppliedResult: { wasUndone: false } | { wasRedone: false },
  removal: () => void,
) {
  let hasSettled = false;
  const onRemove = () => {
    hasSettled = true;
    settleCallback();
  };

  hot.addHookOnce(hookName, onRemove);

  try {
    removal();

  } finally {
    // A removal that throws is not settled here: `UndoRedo#undo()` / `#redo()` catch it, reset the flag
    // and discard the action. The listener must still go, or the next real removal would settle that
    // discarded action onto a stack.
    if (!hasSettled) {
      hot.removeHook(hookName, onRemove);
    }
  }

  if (!hasSettled) {
    settleCallback(notAppliedResult);
  }
}

/**
 * Gets all cell metas from the provided range.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} fromRow The starting row index.
 * @param {number} toRow The ending row index.
 * @param {number} fromColumn The starting column index.
 * @param {number} toColumn The ending column index.
 * @returns {Array} Returns an array of cell metas.
 */
export function getCellMetas(hot: HotInstance, fromRow: number, toRow: number, fromColumn: number, toColumn: number) {
  const cellMetas: unknown[] = [];

  rangeEach(fromColumn, toColumn, (columnIndex) => {
    rangeEach(fromRow, toRow, (rowIndex) => {
      const cellMeta = hot.getCellMeta(rowIndex, columnIndex);

      cellMetas.push([cellMeta.visualRow, cellMeta.visualCol, cellMeta]);
    });
  });

  return cellMetas;
}

/**
 * Collects merged cells that overlap the removed visual range along the given axis.
 * The mergeCells plugin's own `shiftCollections` logic mutates surviving merges
 * asymmetrically (a partial removal at the start cannot be reversed on `afterCreateRow`
 * / `afterCreateCol`), so on undo we must restore every overlapping merge from its
 * pre-removal state.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {'row'|'col'} axis The axis being removed — `'row'` or `'col'`.
 * @param {number} start First visual row/column being removed.
 * @param {number} amount Number of rows/columns being removed.
 * @returns {Array} Array of `{ row, col, rowspan, colspan }` objects.
 */
export function collectAffectedMergedCells(hot: HotInstance, axis: 'row' | 'col', start: number, amount: number) {
  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return [];
  }

  const spanProp = axis === 'row' ? 'rowspan' : 'colspan';
  const lastVisualIndex = start + amount - 1;
  const affected: MergedCell[] = [];

  mergeCellsPlugin.mergedCellsCollection?.mergedCells.forEach((mergedCell: MergedCell) => {
    const mergeStart = mergedCell[axis];
    const mergeEnd = mergeStart + mergedCell[spanProp] - 1;

    if (mergeStart <= lastVisualIndex && mergeEnd >= start) {
      const { row, col, rowspan, colspan } = mergedCell;

      affected.push({ row, col, rowspan, colspan });
    }
  });

  return affected;
}

/**
 * The change source that owns the merge-geometry snapshot. Only a paste destroys merge areas, so
 * only a paste's own action may carry the geometry.
 */
const SNAPSHOT_OWNER_SOURCE = 'CopyPaste.paste';

/**
 * Collects the merge areas a data change is about to destroy, as recorded by the MergeCells plugin
 * itself. Only a multi-cell paste over a merged area reports anything here; every other change
 * yields an empty list, so an ordinary edit never re-merges on undo.
 *
 * The source check is what keeps the snapshot attached to the change that caused it. MergeCells
 * reads the same field from its own `afterChange`, so the read cannot consume it, and a paste's
 * validation window is wide enough for other changes to arrive in between: a validator that
 * corrects a value writes through `setDataAtCell` with its own `*Validator` source, once per
 * corrected cell, and each of those raises a `beforeChange` of its own. Without this check every
 * one of them recorded the paste's geometry, so undoing a single correction re-formed the merge on
 * top of the values the paste had already written - the very defect this geometry exists to avoid.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {string} source The change source, as passed to the `beforeChange` hook.
 * @returns {Array} Array of `{ row, col, rowspan, colspan }` objects.
 */
export function collectMergedCellsDestroyedByChange(hot: HotInstance, source: string) {
  if (source !== SNAPSHOT_OWNER_SOURCE) {
    return [];
  }

  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return [];
  }

  return mergeCellsPlugin.getPasteUnmergeSnapshot();
}

/**
 * Re-applies merge areas that a data change destroyed, restoring their geometry only.
 *
 * Unlike {@link restoreMergedCells} this must not repopulate the covered cells: the caller has just
 * written the pre-change values back, and `mergeRange`'s default population would null them out
 * again. `preventPopulation` returns the cleared data instead of writing it, and `auto` skips the
 * settings validation and the overlap check - the geometry came from the grid's own collection, and
 * the undo entry for it is the caller's own data-change action.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {Array} mergedCells Array of `{ row, col, rowspan, colspan }` objects.
 */
export function remergeCellsGeometryOnly(hot: HotInstance, mergedCells: MergedCell[]) {
  if (!mergedCells || mergedCells.length === 0) {
    return;
  }

  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return;
  }

  // `unmergeRange` renders on its own, so without suspending, an N-merge undo redraws N times.
  // `batchRender` cannot be used: it has no `try`/`finally`, and both `unmergeRange` and
  // `mergeRange` run their hooks whether `auto` is set or not. One throwing user listener would
  // otherwise skip `resumeRender()` and leave the grid permanently undrawn.
  hot.suspendRender();

  try {
    mergedCells.forEach((mergedCell: MergedCell) => {
      const range = toMergeAreaRange(hot, mergedCell);

      mergeCellsPlugin.unmergeRange(range, true);
      mergeCellsPlugin.mergeRange(range, true, true);
    });
  } finally {
    hot.resumeRender();
  }

  hot.render();
}

/**
 * Drops merge areas again after a redo has re-applied the data change that destroyed them.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {Array} mergedCells Array of `{ row, col, rowspan, colspan }` objects.
 */
export function unmergeCellsGeometryOnly(hot: HotInstance, mergedCells: MergedCell[]) {
  if (!mergedCells || mergedCells.length === 0) {
    return;
  }

  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return;
  }

  // Same suspend-in-`finally` as above, and for the same reason.
  hot.suspendRender();

  try {
    mergedCells.forEach((mergedCell: MergedCell) => {
      mergeCellsPlugin.unmergeRange(toMergeAreaRange(hot, mergedCell), true);
    });
  } finally {
    hot.resumeRender();
  }
}

/**
 * Re-applies merged cells affected by row/column removal. Any leftover partial merge in
 * the captured area is unmerged first so the original range can be re-merged.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {Array} mergedCells Array of `{ row, col, rowspan, colspan }` objects.
 */
export function restoreMergedCells(hot: HotInstance, mergedCells: MergedCell[]) {
  if (!mergedCells || mergedCells.length === 0) {
    return;
  }

  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return;
  }

  mergedCells.forEach(({ row, col, rowspan, colspan }: MergedCell) => {
    const endRow = row + rowspan - 1;
    const endCol = col + colspan - 1;
    const start = hot._createCellCoords(row, col);
    const end = hot._createCellCoords(endRow, endCol);
    const range = hot._createCellRange(start, start, end);

    mergeCellsPlugin.unmergeRange(range, true);
    mergeCellsPlugin.merge(row, col, endRow, endCol);
  });
}
