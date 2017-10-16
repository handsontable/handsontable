import {getValidSelection} from './../utils';
import * as C from './../../../i18n/constants';

export const KEY = 'remove_col';

export default function removeColumnItem() {
  return {
    key: KEY,
    name() {
      const selection = this.getSelected();
      let pluralForm = 0;

      if (Array.isArray(selection)) {
        const [, fromColumn, , toColumn] = selection;

        if (fromColumn - toColumn !== 0) {
          pluralForm = 1;
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, pluralForm);
    },

    callback(key, selection) {
      let amount = selection.end.col - selection.start.col + 1;

      this.alter('remove_col', selection.start.col, amount, 'ContextMenu.removeColumn');
    },
    disabled() {
      const selected = getValidSelection(this);
      const totalColumns = this.countCols();

      return !selected || this.selection.selectedHeader.rows || this.selection.selectedHeader.corner ||
             !this.isColumnModificationAllowed() || !totalColumns;
    },
    hidden() {
      return !this.getSettings().allowRemoveColumn;
    }
  };
}
