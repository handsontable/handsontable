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
      const activeSelection = this.getSelectedRangeActive().getTopRightCorner();
      const alterAction = this.isRtl() ? 'insert_col_start' : 'insert_col_end';

      this.alter(alterAction, activeSelection.col, 1, 'ContextMenu.columnRight');
    },
    disabled() {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const range = this.getSelectedRangeActive();

      if (
        !range ||
        this.selection.isSelectedByRowHeader() ||
        (range.isSingleHeader() && range.highlight.col < 0) ||
        (this.countSourceCols() >= this.getSettings().maxCols)
      ) {
        return true;
      }

      return false;
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
