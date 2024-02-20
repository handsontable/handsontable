import { transformSelectionToColumnDistance } from '../../../selection/utils';
import * as C from '../../../i18n/constants';

export const KEY = 'remove_col';

/**
 * @returns {object}
 */
export default function removeColumnItem() {
  return {
    key: KEY,
    name() {
      const selection = this.getSelected();
      let pluralForm = 0;

      if (selection) {
        if (selection.length > 1) {
          pluralForm = 1;
        } else {
          const [, fromColumn, , toColumn] = selection[0];

          if (fromColumn - toColumn !== 0) {
            pluralForm = 1;
          }
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, pluralForm);
    },
    callback() {
      this.alter('remove_col', transformSelectionToColumnDistance(this), null, 'ContextMenu.removeColumn');
    },
    disabled() {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const range = this.getSelectedRangeLast();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader() && range.highlight.col < 0) {
        return true;
      }

      const totalColumns = this.countCols();

      if (this.selection.isSelectedByCorner()) {
        // Enable "Remove column" only when there is at least one column.
        return totalColumns === 0;
      }

      return this.selection.isSelectedByRowHeader() || totalColumns === 0;
    },
    hidden() {
      return !this.getSettings().allowRemoveColumn;
    }
  };
}
