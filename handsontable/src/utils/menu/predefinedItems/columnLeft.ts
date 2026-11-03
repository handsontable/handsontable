import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';

export const KEY = 'col_left';

/**
 * @returns {object}
 */
export default function columnLeftItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_INSERT_LEFT) as string;
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return;
      }

      const activeSelection = range.getTopLeftCorner();
      const alterAction = this.isRtl() ? 'insert_col_end' : 'insert_col_start';

      if (activeSelection.col === null) {
        return;
      }

      this.alter(alterAction, activeSelection.col, 1, 'ContextMenu.columnLeft');
    },
    disabled(this: HotInstance) {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const range = this.getSelectedRangeActive();

      if (
        !range ||
        this.selection.isSelectedByRowHeader() ||
        (range.isSingleHeader() && (range.highlight.col ?? 0) < 0) ||
        (this.countSourceCols() >= (this.getSettings().maxCols ?? Infinity))
      ) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        // Enable "Insert column left" only when there is at least one column.
        return this.countCols() === 0;
      }

      return false;
    },
    hidden(this: HotInstance) {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
