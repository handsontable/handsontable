import type { HotInstance } from '../../../core/types';
import { checkSelectionConsistency } from '../utils';
import * as C from '../../../i18n/constants';

export const KEY = 'make_read_only';

/**
 * Checks whether any cell in the current selection is already read-only.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {CellRange[]} [ranges] The ranges to check. Defaults to the whole selection.
 * @returns {boolean}
 */
function hasReadOnlyCell(hot: HotInstance, ranges = hot.getSelectedRange() ?? []) {
  return checkSelectionConsistency(
    ranges,
    (row: number, col: number) => Boolean(hot.getCellMetaTransient(row, col).readOnly)
  );
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
      return hasReadOnlyCell(this);
    },

    // No `ariaLabel`: the renderer falls back to the item's label, and these two were the same
    // translated phrase once the check mark stopped living inside the name.
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY) as string;
    },
    callback(this: HotInstance) {
      const ranges = this.getSelectedRange() ?? [];
      const atLeastOneReadOnly = hasReadOnlyCell(this, ranges);

      for (const range of ranges) {
        range.forAll((row: number, col: number) => {
          if (row >= 0 && col >= 0) {
            this.setCellMeta(row, col, 'readOnly', !atLeastOneReadOnly);
          }
        });
      }

      this.render();
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
