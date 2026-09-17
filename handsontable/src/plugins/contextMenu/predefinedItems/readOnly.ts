import type { HotInstance } from '../../../core/types';
import { checkSelectionConsistency, getSelectionCheckState } from '../utils';
import * as C from '../../../i18n/constants';

export const KEY = 'make_read_only';

/**
 * Reports whether every, no, or only some of the selected cells are read-only. A hidden cell under a
 * merged block is left out: the block's state sits on its top-left cell.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean|string}
 */
function getReadOnlyState(hot: HotInstance) {
  return getSelectionCheckState(hot.getSelectedRange() ?? [], (row: number, col: number) => {
    const cellMeta = hot.getCellMetaTransient(row, col);

    return cellMeta.hidden ? null : Boolean(cellMeta.readOnly);
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
      const atLeastOneReadOnly = checkSelectionConsistency(
        ranges,
        (row: number, col: number) => Boolean(this.getCellMetaTransient(row, col).readOnly)
      );

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
