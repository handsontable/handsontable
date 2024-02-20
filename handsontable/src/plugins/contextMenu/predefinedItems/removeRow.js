import { transformSelectionToRowDistance } from '../../../selection/utils';
import * as C from '../../../i18n/constants';

export const KEY = 'remove_row';

/**
 * @returns {object}
 */
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
      // TODO: Please keep in mind that below `1` may be improper. The table's way of work, before change `f1747b3912ea3b21fe423fd102ca94c87db81379` was restored.
      // There is still problem when removing more than one row.
      this.alter('remove_row', transformSelectionToRowDistance(this), 1, 'ContextMenu.removeRow');
    },
    disabled() {
      const range = this.getSelectedRangeLast();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader() && range.highlight.row < 0) {
        return true;
      }

      const totalRows = this.countRows();

      if (this.selection.isSelectedByCorner()) {
        // Enable "Remove row" only when there is at least one row.
        return totalRows === 0;
      }

      return this.selection.isSelectedByColumnHeader() || totalRows === 0;
    },
    hidden() {
      return !this.getSettings().allowRemoveRow;
    }
  };
}
