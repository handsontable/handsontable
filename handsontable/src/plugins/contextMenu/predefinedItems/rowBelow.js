import * as C from '../../../i18n/constants';

export const KEY = 'row_below';

/**
 * @returns {object}
 */
export default function rowBelowItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_BELOW);
    },
    callback() {
      const latestSelection = this.getSelectedRangeLast().getBottomRightCorner();

      this.alter('insert_row_below', latestSelection.row, 1, 'ContextMenu.rowBelow');
    },
    disabled() {
      const range = this.getSelectedRangeLast();

      if (
        !range ||
        this.selection.isSelectedByColumnHeader() ||
        (range.isSingleHeader() && range.highlight.row < 0) ||
        (this.countSourceRows() >= this.getSettings().maxRows)
      ) {
        return true;
      }

      return false;
    },
    hidden() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
