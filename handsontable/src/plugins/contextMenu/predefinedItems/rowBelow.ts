import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';

export const KEY = 'row_below';

/**
 * @returns {object}
 */
export default function rowBelowItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_ROW_BELOW) as string;
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return;
      }

      const activeSelection = range.getBottomRightCorner();

      if (activeSelection.row === null) {
        return;
      }

      this.alter('insert_row_below', activeSelection.row, 1, 'ContextMenu.rowBelow');
    },
    disabled(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (
        !range ||
        this.selection.isSelectedByColumnHeader() ||
        (range.isSingleHeader() && range.highlight.row !== null && range.highlight.row < 0) ||
        (this.countSourceRows() >= (this.getSettings().maxRows ?? Infinity))
      ) {
        return true;
      }

      return false;
    },
    hidden(this: HotInstance) {
      return !this.getSettings().allowInsertRow;
    }
  };
}
