import { getValidSelection } from '../utils';
import * as C from '../../../i18n/constants';

export const KEY = 'col_left';

/**
 * @returns {object}
 */
export default function columnLeftItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_INSERT_LEFT);
    },
    callback(key, normalizedSelection) {
      const isSelectedByCorner = this.selection.isSelectedByCorner();
      let columnLeft = 0;

      if (!isSelectedByCorner) {
        const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];

        columnLeft = latestSelection.start.col;
      }

      this.alter('insert_col', columnLeft, 1, 'ContextMenu.columnLeft');

      if (isSelectedByCorner) {
        this.selectAll();
      }
    },
    disabled() {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        const totalColumns = this.countCols();

        // Enable "Insert column left" only when there is at least one column.
        return totalColumns === 0;
      }

      return this.selection.isSelectedByRowHeader() ||
        this.countCols() >= this.getSettings().maxCols;
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
