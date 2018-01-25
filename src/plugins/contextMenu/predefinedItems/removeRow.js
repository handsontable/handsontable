import {getValidSelection} from './../utils';
import {arrayEach} from './../../../helpers/array';
import * as C from './../../../i18n/constants';

export const KEY = 'remove_row';

export default function removeRowItem() {
  return {
    key: KEY,
    name() {
      const selection = this.getSelected();
      let pluralForm = 0;

      if (selection) {
        if (selection.length > 1) {
          pluralForm = 1;
        } else {
          const [fromRow, , toRow] = selection[0];

          if (fromRow - toRow !== 0) {
            pluralForm = 1;
          }
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_ROW, pluralForm);
    },
    callback(key, selection) {
      const [{start, end}] = selection;
      const amount = end.row - start.row + 1;

      this.alter('remove_row', start.row, amount, 'ContextMenu.removeRow');
    },
    disabled() {
      const selected = getValidSelection(this);
      const totalRows = this.countRows();

      if (!selected || selected.length > 1) {
        return true;
      }

      return this.selection.selectedHeader.cols || this.selection.selectedHeader.corner || !totalRows;
    },
    hidden() {
      return !this.getSettings().allowRemoveRow;
    }
  };
}
