import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';

export const KEY = 'col_right';

/**
 * @returns {object}
 */
export default function columnRightItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      const label: string = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_INSERT_RIGHT);

      return label;
    },
    callback(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (!range) {
        return;
      }

      const activeSelection = range.getTopRightCorner();
      const alterAction = this.isRtl() ? 'insert_col_start' : 'insert_col_end';

      if (activeSelection.col === null) {
        return;
      }

      this.alter(alterAction, activeSelection.col, 1, 'ContextMenu.columnRight');
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

      return false;
    },
    hidden(this: HotInstance) {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
