import {getValidSelection} from './../utils';
import * as C from './../../../i18n/constants';

export const KEY = 'row_above';

export default function rowAboveItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_ABOVE);
    },

    callback(key, selection) {
      this.alter('insert_row', selection[0].start.row, 1, 'ContextMenu.rowAbove');
    },
    disabled() {
      let selected = getValidSelection(this);

      if (!selected || selected.length > 1) {
        return true;
      }

      return this.selection.selectedHeader.cols || this.countRows() >= this.getSettings().maxRows;
    },
    hidden() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
