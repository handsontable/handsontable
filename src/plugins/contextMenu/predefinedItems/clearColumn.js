import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';

export const KEY = 'clear_column';

export default function clearColumnItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_CLEAR_COLUMN);
    },
    callback(key, selection) {
      const column = selection[0].start.col;

      if (this.countRows()) {
        this.populateFromArray(0, column, [[null]], Math.max(selection[0].start.row, selection[0].end.row), column, 'ContextMenu.clearColumn');
      }
    },
    disabled() {
      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      const [startRow, startColumn, endRow] = selected[0];
      const entireRowSelection = [startRow, 0, endRow, this.countCols() - 1];
      const rowSelected = entireRowSelection.join(',') === selected.join(',');

      return startColumn < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
    }
  };
}
