import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';

export const KEY = 'clear_column';

/**
 * @returns {object}
 */
export default function clearColumnItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_CLEAR_COLUMN);
    },
    callback(key: string, selection: { start: { row: number; col: number }; end: { row: number; col: number } }[]) {
      const startColumn = selection[0].start.col;
      const endColumn = selection[0].end.col;

      if (this.countRows()) {
        this.populateFromArray(0, startColumn, [[null]],
          Math.max(selection[0].start.row, selection[0].end.row), endColumn, 'ContextMenu.clearColumn');
      }
    },
    disabled() {
      const range = this.getSelectedRangeActive();

      if (
        !range ||
        range.isSingleHeader() && range.highlight.col < 0 ||
        !this.selection.isSelectedByColumnHeader()
      ) {
        return true;
      }

      let atLeastOneNonReadOnly = false;

      range.forAll((row: number, col: number) => {
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
