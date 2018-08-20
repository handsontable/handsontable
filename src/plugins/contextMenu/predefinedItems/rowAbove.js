import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';

export const KEY = 'row_above';

export default function rowAboveItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_ABOVE);
    },
    callback(key, normalizedSelection) {
      const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];

      this.alter('insert_row', latestSelection.start.row, 1, 'ContextMenu.rowAbove');
    },
    disabled() {
      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }

      return this.selection.isSelectedByColumnHeader() || this.countRows() >= this.getSettings().maxRows;
    },
    hidden() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
