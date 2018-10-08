import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';

export const KEY = 'col_left';

export default function columnLeftItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_INSERT_LEFT);
    },
    callback(key, normalizedSelection) {
      const latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];

      this.alter('insert_col', latestSelection.start.col, 1, 'ContextMenu.columnLeft');
    },
    disabled() {
      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      if (!this.isColumnModificationAllowed()) {
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
