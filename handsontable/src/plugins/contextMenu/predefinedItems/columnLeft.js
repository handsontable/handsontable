import { getValidSelection } from '../utils';
import * as C from '../../../i18n/constants';

export const KEY = 'col_left';

/**
 * @returns {object}
 */
export default function columnLeftItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_INSERT_LEFT);
    },
    callback() {
      const latestSelection = this.getSelectedRangeLast().getTopLeftCorner();
      const alterAction = this.isRtl() ? 'insert_col_end' : 'insert_col_start';

      this.alter(alterAction, latestSelection.col, 1, 'ContextMenu.columnLeft');

      if (this.selection.isSelectedByCorner()) {
        this.selectAll();
      }
    },
    disabled() {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const selected = getValidSelection(this);

      if (!selected) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        const totalColumns = this.countCols();

        // Enable "Insert column left" only when there is at least one column.
        return totalColumns === 0;
      }

      return this.selection.isSelectedByRowHeader() ||
        this.countCols() >= this.getSettings().maxCols;
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
