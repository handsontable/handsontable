import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';

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
      const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];

      this.alter('insert_col', latestSelection.start.col, 1, 'ContextMenu.columnLeft');
    },
    disabled() {
      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      return this.selection.isSelectedByRowHeader() ||
        this.selection.isSelectedByCorner() ||
        this.countCols() >= this.getSettings().maxCols;
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
