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
    callback(this: HotInstance, key: string,
             selection: { start: { row: number; col: number }; end: { row: number; col: number } }[]) {
      const startColumn = selection[0].start.col;
      const endColumn = selection[0].end.col;
      const clear = (endRow: number) => {
        if (this.countRows()) {
          this.populateFromArray(0, startColumn, [[null]], endRow, endColumn, 'ContextMenu.clearColumn');
        }
      };
      const nestedRows = this.getPlugin('nestedRows');

      if (nestedRows?.enabled) {
        // Nested Rows adds the rows of collapsed parents for the duration of the call, and the
        // selection was read before it did, so the clear runs to the grid's last row instead. The
        // entry is enabled for header selections only, which span every row anyway (DEV-150).
        nestedRows.runWithCollapsedRowsExpanded(() => clear(this.countRows() - 1));

      } else {
        clear(Math.max(selection[0].start.row, selection[0].end.row));
      }
    },
    disabled(this: HotInstance) {
      const range = this.getSelectedRangeActive();

      if (
        !range ||
        range.isSingleHeader() && (range.highlight.col === null || range.highlight.col < 0) ||
        !this.selection.isSelectedByColumnHeader()
      ) {
        return true;
      }

      let atLeastOneNonReadOnly = false;

      range.forAll((row: number, col: number) => {
        if (row < 0 || col < 0) {
          return true;
        }

        const { readOnly } = this.getCellMetaTransient(row, col);

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
