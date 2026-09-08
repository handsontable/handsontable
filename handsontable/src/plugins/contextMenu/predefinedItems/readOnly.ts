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

    // Drives both the check mark the item renderer draws and the item's `aria-checked` state,
    // so the two can never disagree.
    checked(this: HotInstance) {
      return hasReadOnlyCell(this);
    },

    ariaLabel(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY) as string;
    },

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
