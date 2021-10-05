import { getValidSelection } from '../utils';
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
    callback(key, normalizedSelection) {
      const isSelectedByCorner = this.selection.isSelectedByCorner();
      let rowAbove = 0;

      if (!isSelectedByCorner) {
        const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];

        rowAbove = latestSelection.start.row;
      }

      this.alter('insert_row', rowAbove, 1, 'ContextMenu.rowAbove');

      if (isSelectedByCorner) {
        this.selectAll();
      }
    },
    disabled() {
      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        const totalRows = this.countRows();

        // Enable "Insert row above" only when there is at least one row.
        return totalRows === 0;
      }

      return this.selection.isSelectedByColumnHeader() ||
        this.countRows() >= this.getSettings().maxRows;
    },
    hidden() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
