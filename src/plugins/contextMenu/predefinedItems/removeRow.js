import { getValidSelection } from './../utils';
import { transformSelectionToRowDistance } from './../../../selection/utils';
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
    callback() {
      this.alter('remove_row', transformSelectionToRowDistance(this.getSelected()), null, 'ContextMenu.removeRow');
    },
    disabled() {
      const selected = getValidSelection(this);
      const totalRows = this.countRows();

      if (!selected) {
        return true;
      }

      return this.selection.isSelectedByColumnHeader() || this.selection.isSelectedByCorner() || !totalRows;
    },
    hidden() {
      return !this.getSettings().allowRemoveRow;
    }
  };
}
