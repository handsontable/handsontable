import { getValidSelection } from '../utils';
import { isDefined } from '../../../helpers/mixed';
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
    callback(key, normalizedSelection) {
      const isSelectedByCorner = this.selection.isSelectedByCorner();
      let rowBelow = 0;

      if (isSelectedByCorner) {
        rowBelow = this.countRows();

      } else {
        const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];
        const selectedRow = latestSelection?.end?.row;

        // If there is no selection we have clicked on the corner and there is no data.
        rowBelow = isDefined(selectedRow) ? selectedRow + 1 : 0;
      }

      this.alter('insert_row', rowBelow, 1, 'ContextMenu.rowBelow');

      if (isSelectedByCorner) {
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
