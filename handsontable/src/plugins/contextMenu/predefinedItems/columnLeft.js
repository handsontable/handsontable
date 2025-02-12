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
    },
    disabled() {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const range = this.getSelectedRangeLast();

      if (
        !range ||
        this.selection.isSelectedByRowHeader() ||
        (range.isSingleHeader() && range.highlight.col < 0) ||
        (this.countSourceCols() >= this.getSettings().maxCols)
      ) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        // Enable "Insert column left" only when there is at least one column.
        return this.countCols() === 0;
      }

      return false;
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
