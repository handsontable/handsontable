import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';

export const KEY = 'row_below';

/**
 * @returns {object}
 */
export default function rowBelowItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_BELOW);
    },
    callback(key, normalizedSelection) {
      const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];
      const selectedRow = latestSelection?.end?.row;
      // If there is no selection we have clicked on the corner and there is no data.
      const rowBelow = selectedRow ? selectedRow + 1 : 0;

      this.alter('insert_row', rowBelow, 1, 'ContextMenu.rowBelow');
    },
    disabled() {
      const selected = getValidSelection(this);
      const anyCellVisible = this.countRows() > 0 && this.countCols() > 0;

      // We have clicked on the corner and there is no data.
      if (!anyCellVisible) {
        return false;
      }

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
