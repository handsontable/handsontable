import type { HotInstance } from '../../../core/types';
import type { CellProperties } from '../../../settings';
import { isFunction } from '../../../helpers/function';
import { hasOwnProperty, isObject } from '../../../helpers/object';
import { checkSelectionConsistency, getReadOnlyStates, getSelectionCheckState } from '../utils';
import * as C from '../../../i18n/constants';

export const KEY = 'make_read_only';

type LockOwner = 'summary' | 'cells';

/**
 * Reports whether the `cells` option owns a cell's `readOnly` state, `true` or `false`. It is
 * evaluated on a probe that inherits from the cell meta, so a function that assigns
 * `this.readOnly = ...` is seen as well as one that returns `{ readOnly }`, and nothing leaks into
 * the meta being checked.
 *
 * @param {object} cellMeta The cell's transient meta.
 * @returns {boolean}
 */
function isReadOnlyOwnedByCells(cellMeta: CellProperties): boolean {
  if (!isFunction(cellMeta.cells)) {
    return false;
  }

  const probe = Object.create(cellMeta) as Record<string, unknown>;
  const cellSettings: unknown = cellMeta.cells.call(probe, cellMeta.row, cellMeta.col, cellMeta.prop);

  return hasOwnProperty(probe, 'readOnly') ||
    (isObject(cellSettings) && hasOwnProperty(cellSettings as object, 'readOnly'));
}

/**
 * Returns a check for whether a cell's read-only state is owned by someone else and cannot be
 * toggled. Two owners exist:
 *  - the ColumnSummary plugin, which writes `readOnly` on a summary cell and vetoes any other write
 *    that would clear it (DEV-148);
 *  - the `cells` option, which is evaluated again on top of every stored value, so a `readOnly` it
 *    sets, `true` or `false`, always wins over `setCellMeta()` (DEV-149).
 *
 * The `cells` lock applies only to a selection that also holds a cell `cells` does not own. A
 * selection made only of owned cells keeps the behavior it always had, because the menu item would
 * otherwise vanish from every grid whose `cells()` sets `readOnly` on every cell.
 *
 * The plugin is resolved once per call, not once per cell, because the item walks the whole
 * selection on every menu draw. The `cells` function is asked only when one is configured, so a
 * plain grid pays nothing.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {Function} A `(row, col, cellMeta) => owner` check, taking visual indexes and the
 * cell's transient meta, which every caller has already read. The owner is `'summary'`, `'cells'`,
 * or `null` for a cell that can be toggled, so the result can be used as a plain truthy check.
 */
function getLockedCellCheck(
  hot: HotInstance
): (row: number, col: number, cellMeta: CellProperties) => LockOwner | null {
  const columnSummary = hot.getPlugin('columnSummary');
  const isSummaryEnabled = columnSummary?.enabled === true;
  let hasCellFreeOfCells: boolean | undefined;
  // A hidden cell under a merged block is not a cell the user can toggle, so it does not count.
  const isFreeOfCells = (row: number, col: number) => {
    const cellMeta = hot.getCellMetaTransient(row, col);

    return !cellMeta.hidden && !isReadOnlyOwnedByCells(cellMeta);
  };

  return (row: number, col: number, cellMeta: CellProperties) => {
    if (isSummaryEnabled && columnSummary.isLockedSummaryCell(row, col)) {
      return 'summary';
    }

    if (!isReadOnlyOwnedByCells(cellMeta)) {
      return null;
    }

    hasCellFreeOfCells ??= checkSelectionConsistency(hot.getSelectedRange() ?? [], isFreeOfCells);

    return hasCellFreeOfCells ? 'cells' : null;
  };
}

/**
 * Reports whether every, no, or only some of the selected cells are read-only. Two kinds of cell
 * are left out: a hidden cell under a merged block, because the block's state sits on its top-left
 * cell, and a cell whose read-only state is locked (see `getLockedCellCheck()`).
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean|string}
 */
function getReadOnlyState(hot: HotInstance) {
  const isLocked = getLockedCellCheck(hot);

  return getSelectionCheckState(hot.getSelectedRange() ?? [], (row: number, col: number) => {
    const cellMeta = hot.getCellMetaTransient(row, col);

    return cellMeta.hidden || isLocked(row, col, cellMeta) ? null : Boolean(cellMeta.readOnly);
  });
}

/**
 * @returns {object}
 */
export default function readOnlyItem() {
  return {
    key: KEY,
    checkable: true,

    // The single source for both the check mark the renderer draws and the item's `aria-checked`
    // state, which is why this item declares no `ariaChecked` of its own any more.
    checked(this: HotInstance) {
      return getReadOnlyState(this);
    },

    // No `ariaLabel`: the renderer falls back to the item's label, and these two were the same
    // translated phrase once the check mark stopped living inside the name.
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY) as string;
    },
    callback(this: HotInstance) {
      const ranges = this.getSelectedRange() ?? [];
      // "At least one", unlike the mark: a partly read-only selection is made writable as a whole.
      // Asked of `checkSelectionConsistency()`, which stops at the first read-only cell.
      //
      // A locked cell is left out of the whole click (DEV-148). A read-only summary cell would
      // otherwise make every selection that holds it "at least one read-only", so a column with a
      // summary could never be made read-only, and the loop below would unlock the summary.
      //
      // `hasLockedCell` rides this same walk for free - `isLocked()` is already called for every
      // cell it visits, so tracking it costs no extra `getCellMetaTransient` read. That matters: a
      // plain selection (no summary plugin, or nothing locked in it) must keep reading exactly as
      // many cells as before - a pre-existing DEV-136 test pins the count for the no-match walk.
      //
      // The write loop below must skip locked cells too, and asking again would read every cell a
      // second time. So each walk files the locked cells it meets in `lockedCells`. Together the
      // walks cover the whole selection: the first one is complete when it finds no read-only cell,
      // and when it stops early the undo snapshot pass below reads every cell.
      const isLocked = getLockedCellCheck(this);
      const lockedCells = new Map<string, { row: number, col: number, owner: LockOwner, readOnly: boolean }>();
      let hasLockedCell = false;
      const isReadOnlyCell = (row: number, col: number) => {
        const cellMeta = this.getCellMetaTransient(row, col);

        const owner = isLocked(row, col, cellMeta);

        if (owner) {
          hasLockedCell = true;
          lockedCells.set(`${row}:${col}`, { row, col, owner, readOnly: Boolean(cellMeta.readOnly) });

          return false;
        }

        return Boolean(cellMeta.readOnly);
      };
      const atLeastOneReadOnly = checkSelectionConsistency(ranges, isReadOnlyCell);
      const readOnly = !atLeastOneReadOnly;

      // Reached through `executeCommand()`, which gates on `disabled` and not on `hidden`: with
      // nothing toggleable, do not record an undo step that changes nothing. Only worth asking when
      // the walk above actually found a locked cell - `hasLockedCell` is false whenever ColumnSummary
      // is absent or nothing in the selection is locked, and then this can never trigger. Matches
      // `hidden()`'s own definition of toggleable below - a hidden cell under a merge is excluded
      // there too, or a selection of only a locked summary block (its hidden covered cells included)
      // would pass this check on the covered cells alone and still write to them.
      if (hasLockedCell && !atLeastOneReadOnly) {
        const isToggleable = (row: number, col: number) => {
          const cellMeta = this.getCellMetaTransient(row, col);

          return !isLocked(row, col, cellMeta) && !cellMeta.hidden;
        };

        if (!checkSelectionConsistency(ranges, isToggleable)) {
          return;
        }
      }

      // Making the selection read-only: `checkSelectionConsistency()` above found no match, which
      // means it already walked every cell to confirm that - so every affected cell's prior state
      // is `false`, and an empty snapshot restores that correctly on undo (a cell with no explicit
      // entry reads as `false`) with no further reads. Making it writable needs the REAL per-cell
      // states, because the check above stopped at the FIRST read-only cell and knows nothing about
      // the rest - restoring a mixed selection on undo is only possible with a second, full pass.
      // That pass records a locked cell as it really is (read-only), so undo writes it back as is.
      // The empty snapshot has no entry for it, and undo's `false` there is vetoed by ColumnSummary.
      // A cell owned by `cells()` has no such veto: undo and redo still store a value for it, which
      // `cells()` then covers, so what the grid shows stays right (DEV-149).
      const stateBefore: Record<number, boolean[]> = atLeastOneReadOnly
        ? getReadOnlyStates(ranges, (row: number, col: number) => {
          const cellMeta = this.getCellMetaTransient(row, col);

          const owner = isLocked(row, col, cellMeta);

          if (owner) {
            lockedCells.set(`${row}:${col}`, { row, col, owner, readOnly: Boolean(cellMeta.readOnly) });
          }

          return Boolean(cellMeta.readOnly);
        })
        : {};

      // The empty snapshot is not true for a cell `cells()` made read-only: report it as it is, so a
      // `beforeReadOnlyToggle` listener does not read it as writable and undo restores it as it was.
      // A column summary cell is left out on purpose, ColumnSummary vetoes the write.
      if (!atLeastOneReadOnly) {
        lockedCells.forEach(({ row, col, owner, readOnly: isReadOnly }) => {
          if (owner === 'cells' && isReadOnly) {
            (stateBefore[row] ??= [])[col] = true;
          }
        });
      }

      this.runHooks('beforeReadOnlyToggle', stateBefore, ranges, readOnly);

      for (const range of ranges) {
        range.forAll((row: number, col: number) => {
          if (row >= 0 && col >= 0 && (lockedCells.size === 0 || !lockedCells.has(`${row}:${col}`))) {
            this.setCellMeta(row, col, 'readOnly', readOnly);
          }
        });
      }

      this.render();
    },
    // Hidden, not disabled, when nothing in the selection can be toggled, that is a selection made
    // only of read-only summary cells (DEV-148). A wider selection keeps the item and toggles the rest.
    hidden(this: HotInstance) {
      const isLocked = getLockedCellCheck(this);
      let hasLockedCell = false;
      // Stops at the first cell that can be toggled, so a large selection is not walked to the end.
      const hasToggleableCell = checkSelectionConsistency(this.getSelectedRange() ?? [], (row: number, col: number) => {
        const cellMeta = this.getCellMetaTransient(row, col);

        if (isLocked(row, col, cellMeta)) {
          hasLockedCell = true;

          return false;
        }

        return !cellMeta.hidden;
      });

      return hasLockedCell && !hasToggleableCell;
    },
    disabled(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader()) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        return true;
      }

      if (this.countRows() === 0 || this.countCols() === 0) {
        return true;
      }

      if (!this.getSelectedRange()?.length) {
        return true;
      }

      return false;
    }
  };
}
