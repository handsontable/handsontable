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
      const currentColumn = this.getSelectedRangeLast()?.getTopRightCorner()?.col ?? 0;
      const alterAction = this.isRtl() ? 'insert_col_start' : 'insert_col_end';

      this.alter(alterAction, currentColumn, 1, 'ContextMenu.columnRight');
    },
    disabled() {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      // allows adding new column on the right when dataset is empty
      if (this.countSourceRows() === 0 && this.countSourceRows() === 0) {
        return false;
      }

      const range = this.getSelectedRangeLast();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader() && range.highlight.col < 0) {
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
