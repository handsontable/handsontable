import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';
import { isDefined } from './../../../helpers/mixed';

export const KEY = 'col_right';

/**
 * @returns {object}
 */
export default function columnRightItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_INSERT_RIGHT);
    },
    callback(key, normalizedSelection) {
      const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];
      const selectedColumn = latestSelection?.end?.col;
      // If there is no selection we have clicked on the corner and there is no data.
      const columnsRight = isDefined(selectedColumn) ? selectedColumn + 1 : 0;

      this.alter('insert_col', columnsRight, 1, 'ContextMenu.columnRight');
    },
    disabled() {
      const selected = getValidSelection(this);
      const anyCellVisible = this.countRows() > 0 && this.countCols() > 0;

      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      // There is no selection, because we have clicked on the corner and there is no data (click on the corner by default
      // selects all cells, but there are no cells).
      if (!anyCellVisible) {
        return false;
      }

      if (!selected) {
        return true;
      }

      return this.selection.isSelectedByRowHeader() ||
        this.selection.isSelectedByCorner() ||
        this.countCols() >= this.getSettings().maxCols;
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
