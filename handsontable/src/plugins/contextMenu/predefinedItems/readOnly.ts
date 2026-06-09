import type { HotInstance } from '../../../core/types';
import { checkSelectionConsistency, markLabelAsSelected } from '../utils';
import * as C from '../../../i18n/constants';

export const KEY = 'make_read_only';

/**
 * @returns {object}
 */
export default function readOnlyItem() {
  return {
    key: KEY,
    checkable: true,
    ariaChecked(this: HotInstance) {
      const atLeastOneReadOnly = checkSelectionConsistency(
        this.getSelectedRange() ?? [],
        (row: number, col: number) => Boolean(this.getCellMeta(row, col).readOnly)
      );

      return atLeastOneReadOnly;
    },

    ariaLabel(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY) as string;
    },

    name(this: HotInstance): string {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY) as string;
      const atLeastOneReadOnly = checkSelectionConsistency(
        this.getSelectedRange() ?? [],
        (row: number, col: number) => Boolean(this.getCellMeta(row, col).readOnly)
      );

      if (atLeastOneReadOnly) {
        label = markLabelAsSelected(label);
      }

      return label;
    },
    callback(this: HotInstance) {
      const ranges = this.getSelectedRange() ?? [];
      const atLeastOneReadOnly = checkSelectionConsistency(
        ranges,
        (row: number, col: number) => Boolean(this.getCellMeta(row, col).readOnly)
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
