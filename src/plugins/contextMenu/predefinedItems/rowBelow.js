import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';

export const KEY = 'row_below';

export default function rowBelowItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_BELOW);
    },
    callback(key, normalizedSelection) {
      const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];

      this.alter('insert_row', latestSelection.end.row + 1, 1, 'ContextMenu.rowBelow');
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
