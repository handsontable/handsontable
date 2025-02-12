import * as C from '../../../i18n/constants';

export const KEY = 'row_above';

/**
 * @returns {object}
 */
export default function rowAboveItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_ABOVE);
    },
    callback() {
      const latestSelection = this.getSelectedRangeLast().getTopLeftCorner();

      this.alter('insert_row_above', latestSelection.row, 1, 'ContextMenu.rowAbove');
    },
    disabled() {
      const range = this.getSelectedRangeLast();

      if (
        !range ||
        this.selection.isSelectedByColumnHeader() ||
        (range.isSingleHeader() && range.highlight.row < 0) ||
        (this.countSourceRows() >= this.getSettings().maxRows)
      ) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        // Enable "Insert row above" only when there is at least one row.
        return this.countRows() === 0;
      }

      return false;
    },
    hidden() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
