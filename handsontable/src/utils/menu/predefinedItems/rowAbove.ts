import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';

export const KEY = 'row_above';

/**
 * @returns {object}
 */
export default function rowAboveItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_ABOVE);
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return;
      }

      const activeSelection = range.getTopLeftCorner();

      if (activeSelection.row === null) {
        return;
      }

      this.alter('insert_row_above', activeSelection.row, 1, 'ContextMenu.rowAbove');
    },
    disabled(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (
        !range ||
        this.selection.isSelectedByColumnHeader() ||
        (range.isSingleHeader() && range.highlight.row !== null && range.highlight.row < 0) ||
        (this.countSourceRows() >= (this.getSettings().maxRows ?? Infinity))
      ) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        // Enable "Insert row above" only when there is at least one row.
        return this.countRows() === 0;
      }

      return false;
    },
    hidden(this: HotInstance) {
      return !this.getSettings().allowInsertRow;
    }
  };
}
