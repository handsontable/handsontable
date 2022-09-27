import { getValidSelection } from '../utils';
import * as C from '../../../i18n/constants';

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
    callback() {
      const latestSelection = this.getSelectedRangeLast().getTopRightCorner();
      const alterAction = this.isRtl() ? 'insert_col_start' : 'insert_col_end';

      this.alter(alterAction, latestSelection.col, 1, 'ContextMenu.columnRight');

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
        // Enable "Insert column right" always when the menu is triggered by corner click.
        return false;
      }

      return this.selection.isSelectedByRowHeader() ||
        this.countCols() >= this.getSettings().maxCols;
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
