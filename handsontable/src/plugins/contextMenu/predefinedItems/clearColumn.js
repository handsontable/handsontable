import * as C from '../../../i18n/constants';

export const KEY = 'clear_column';

/**
 * @returns {object}
 */
export default function clearColumnItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_CLEAR_COLUMN);
    },
    callback(key, selection) {
      const startColumn = selection[0].start.col;
      const endColumn = selection[0].end.col;

      if (this.countRows()) {
        this.populateFromArray(0, startColumn, [[null]],
          Math.max(selection[0].start.row, selection[0].end.row), endColumn, 'ContextMenu.clearColumn');
      }
    },
    disabled() {
      const range = this.getSelectedRangeLast();

      if (
        !range ||
        range.isSingleHeader() && range.highlight.col < 0 ||
        !this.selection.isSelectedByColumnHeader()
      ) {
        return true;
      }

      let atLeastOneNonReadOnly = false;

      range.forAll((row, col) => {
        if (row < 0 || col < 0) {
          return true;
        }

        const { readOnly } = this.getCellMeta(row, col);

        if (!readOnly) {
          atLeastOneNonReadOnly = true;

          return false;
        }

        return true;
      });

      return !atLeastOneNonReadOnly;
    }
  };
}
