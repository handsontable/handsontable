import {getValidSelection} from './../utils';
import L from './../../../i18n/index';
import * as C from './../../../i18n/constants';
import {createCellHeadersRange} from './../../../i18n/utils';

export const KEY = 'remove_col';

export default function removeColumnItem() {
  return {
    key: KEY,
    name() {
      const selection = this.getSelected();
      const translationConfiguration = {};

      if (Array.isArray(selection)) {
        const [, fromColumn, , toColumn] = selection;

        if (fromColumn - toColumn !== 0) {
          translationConfiguration.rangeOfColumns = createCellHeadersRange(fromColumn + 1, toColumn + 1);
        }
      }

      return L.getPhrase(this, C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, translationConfiguration);
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
