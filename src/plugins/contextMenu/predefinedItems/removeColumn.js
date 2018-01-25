import {getValidSelection} from './../utils';
import {arrayEach} from './../../../helpers/array';
import * as C from './../../../i18n/constants';

export const KEY = 'remove_col';

export default function removeColumnItem() {
  return {
    key: KEY,
    name() {
      const selection = this.getSelected();
      let pluralForm = 0;

      if (selection) {
        if (selection.length > 1) {
          pluralForm = 1;
        } else {
          const [, fromColumn, , toColumn] = selection[0];

          if (fromColumn - toColumn !== 0) {
            pluralForm = 1;
          }
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, pluralForm);
    },
    callback(key, selection) {
      const [{start, end}] = selection;
      const amount = end.col - start.col + 1;

      this.alter('remove_col', start.col, amount, 'ContextMenu.removeColumn');
    },
    disabled() {
      const selected = getValidSelection(this);
      const totalColumns = this.countCols();

      if (!selected || selected.length > 1) {
        return true;
      }

      return this.selection.selectedHeader.rows || this.selection.selectedHeader.corner ||
             !this.isColumnModificationAllowed() || !totalColumns;
    },
    hidden() {
      return !this.getSettings().allowRemoveColumn;
    }
  };
}
