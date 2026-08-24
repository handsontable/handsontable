import { transformSelectionToColumnDistance } from '../../../selection/utils';
import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';

export const KEY = 'remove_col';

/**
 * @returns {object}
 */
export default function removeColumnItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
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

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_COLUMN, pluralForm) as string;
    },
    callback(this: HotInstance) {
      this.alter('remove_col', transformSelectionToColumnDistance(this), undefined, 'ContextMenu.removeColumn');
    },
    disabled(this: HotInstance): boolean {
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      const range = this.getSelectedRangeActive();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader() && range.highlight.col !== null && range.highlight.col < 0) {
        return true;
      }

      const totalColumns = this.countCols();

      if (this.selection.isSelectedByCorner()) {
        // Enable "Remove column" only when there is at least one column.
        return totalColumns === 0;
      }

      return (this.selection.isSelectedByRowHeader() as boolean) || totalColumns === 0;
    },
    hidden(this: HotInstance) {
      return !this.getSettings().allowRemoveColumn;
    }
  };
}
