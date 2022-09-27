import { getValidSelection } from '../utils';
import * as C from '../../../i18n/constants';

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
    callback() {
      const latestSelection = this.getSelectedRangeLast().getBottomRightCorner();

      this.alter('insert_row_below', latestSelection.row, 1, 'ContextMenu.rowBelow');

      if (this.selection.isSelectedByCorner()) {
        this.selectAll();
      }
    },
    disabled() {
      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        // Enable "Insert row below" always when the menu is triggered by corner click.
        return false;
      }

      return this.selection.isSelectedByColumnHeader() ||
        this.countRows() >= this.getSettings().maxRows;
    },
    hidden() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
