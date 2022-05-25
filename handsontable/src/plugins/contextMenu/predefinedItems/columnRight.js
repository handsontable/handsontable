import { getValidSelection } from '../utils';
import * as C from '../../../i18n/constants';
import { isDefined } from '../../../helpers/mixed';

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
      const isSelectedByCorner = this.selection.isSelectedByCorner();
      let columnRight = this.isRtl() ? 0 : this.countCols();

      if (!isSelectedByCorner) {
        const selectedRange = this.getSelectedRangeLast();

        // If there is no selection we have clicked on the corner and there is no data.
        if (isDefined(selectedRange)) {
          const { col } = selectedRange.getTopRightCorner();

          columnRight = this.isRtl() ? col : col + 1;
        }
      }

      this.alter('insert_col', columnRight, 1, 'ContextMenu.columnRight');

      if (isSelectedByCorner) {
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
