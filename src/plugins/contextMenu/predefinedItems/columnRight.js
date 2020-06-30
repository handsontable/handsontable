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
      const columnRight = isDefined(selectedColumn) ? selectedColumn + 1 : 0;

      this.alter('insert_col', columnRight, 1, 'ContextMenu.columnRight');
    },
    disabled() {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const anyCellVisible = this.countRows() > 0 && this.countCols() > 0;

      // There is no selection, because we have clicked on the corner and there is no data
      // (click on the corner by default selects all cells, but there are no cells).
      if (!anyCellVisible) {
        return false;
      }

      const selected = getValidSelection(this);

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
