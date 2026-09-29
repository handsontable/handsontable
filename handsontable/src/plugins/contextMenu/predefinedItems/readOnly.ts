import type { HotInstance } from '../../../core/types';
import { checkSelectionConsistency, getReadOnlyStates, getSelectionCheckState } from '../utils';
import * as C from '../../../i18n/constants';
import { deepClone } from '../../../helpers/object';

export const KEY = 'make_read_only';

/**
 * Returns a check for whether a cell's read-only state is owned by another plugin and cannot be
 * toggled. That is the destination of a read-only column summary: the ColumnSummary plugin writes
 * its `readOnly` state and vetoes any other write that would clear it (DEV-148).
 *
 * The plugin is resolved once per call, not once per cell, because the item walks the whole
 * selection on every menu draw.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {Function} A `(row, col) => boolean` check, taking visual indexes.
 */
function getLockedCellCheck(hot: HotInstance): (row: number, col: number) => boolean {
  const columnSummary = hot.getPlugin('columnSummary');

  if (columnSummary?.enabled !== true) {
    return () => false;
  }

  return (row: number, col: number) => columnSummary.isLockedSummaryCell(row, col);
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

    return cellMeta.hidden || isLocked(row, col) ? null : Boolean(cellMeta.readOnly);
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
      const isLocked = getLockedCellCheck(this);
      let hasLockedCell = false;
      const isReadOnlyCell = (row: number, col: number) => {
        if (isLocked(row, col)) {
          hasLockedCell = true;

          return false;
        }

        return Boolean(this.getCellMetaTransient(row, col).readOnly);
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
        const isToggleable = (row: number, col: number) => !isLocked(row, col) &&
          !this.getCellMetaTransient(row, col).hidden;

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
      const stateBefore = atLeastOneReadOnly
        ? getReadOnlyStates(ranges, (row: number, col: number) => Boolean(this.getCellMetaTransient(row, col).readOnly))
        : {};

      // The whole selection is one undo step, under the action type the toggle has always recorded.
      // UndoRedo restores the `readOnly` meta from its journal; the step carries the toggle's own
      // description (plain copies of the ranges - the selection's are live objects).
      this.runOperation('read_only_toggle', 'ContextMenu.read_only_toggle', () => {
        this._getOperationScope().describe({ stateBefore, ranges: deepClone(ranges), readOnly });
        this.runHooks('beforeReadOnlyToggle', stateBefore, ranges, readOnly);

        for (const range of ranges) {
          range.forAll((row: number, col: number) => {
            if (row >= 0 && col >= 0 && !isLocked(row, col)) {
              this.setCellMeta(row, col, 'readOnly', readOnly);
            }
          });
        }
      });

      this.render();
    },
    // Hidden, not disabled, when nothing in the selection can be toggled, that is a selection made
    // only of read-only summary cells (DEV-148). A wider selection keeps the item and toggles the rest.
    hidden(this: HotInstance) {
      const isLocked = getLockedCellCheck(this);
      let hasLockedCell = false;
      // Stops at the first cell that can be toggled, so a large selection is not walked to the end.
      const hasToggleableCell = checkSelectionConsistency(this.getSelectedRange() ?? [], (row: number, col: number) => {
        if (isLocked(row, col)) {
          hasLockedCell = true;

          return false;
        }

        return !this.getCellMetaTransient(row, col).hidden;
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
