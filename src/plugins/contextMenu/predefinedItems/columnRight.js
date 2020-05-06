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
      // select all cells, but there are no cells).
      if (!anyCellVisible) {
        return false;
      }

      if (!selected) {
        return true;
      }

      const [startRow, startColumn, endRow] = selected[0];
      const entireRowSelection = [startRow, 0, endRow, this.countCols() - 1];
      const rowSelected = entireRowSelection.join(',') === selected.join(',');
      const onlyOneColumn = this.countCols() === 1;

      return startColumn < 0 || this.countCols() >= this.getSettings().maxCols || (!onlyOneColumn && rowSelected);
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
