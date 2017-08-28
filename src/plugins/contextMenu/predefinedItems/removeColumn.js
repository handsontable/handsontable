import {getValidSelection} from './../utils';
import L from './../../../i18n/index';
import * as C from './../../../i18n/constants';
import {createRange} from './../../../i18n/utils';

export const KEY = 'remove_col';

export default function removeColumnItem() {
  return {
    key: KEY,
    name() {
      const [, fromColumn, , toColumn] = this.getSelected();
      const translationConfiguration = {};

      if (fromColumn - toColumn !== 0) {
        translationConfiguration.rangeOfColumns = createRange(
          {index: fromColumn + 1, value: this.getColHeader(fromColumn)},
          {index: toColumn + 1, value: this.getColHeader(toColumn)}
        );
      }

      return L.getPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, translationConfiguration);
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
