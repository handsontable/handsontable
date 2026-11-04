import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';

export const KEY = 'clear_column';
const SOURCE = 'ContextMenu.clearColumn';

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
      const endRow = Math.max(selection[0].start.row, selection[0].end.row);
      const clearVisibleRows = () => {
        if (this.countRows()) {
          this.populateFromArray(0, startColumn, [[null]], endRow, endColumn, SOURCE);
        }
      };
      const nestedRows = this.getPlugin('nestedRows');

      if (nestedRows?.enabled) {
        // The rows of a collapsed parent are trimmed, so the visual clear never reaches them. Nested
        // Rows clears them by row object, in the same undo step (DEV-150).
        nestedRows.clearCollapsedRows(endRow, startColumn, endColumn, SOURCE, clearVisibleRows);

      } else {
        clearVisibleRows();
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

      if (atLeastOneNonReadOnly) {
        return false;
      }

      // Every visible cell is read-only, but a collapsed parent can still hide editable ones.
      const nestedRows = this.getPlugin('nestedRows');

      const { row: endRow, col: endColumn } = range.getBottomEndCorner();
      const { col: startColumn } = range.getTopStartCorner();

      if (!nestedRows?.enabled || endRow === null || startColumn === null || endColumn === null) {
        return true;
      }

      return !nestedRows.hasEditableCollapsedRowCell(endRow, startColumn, endColumn);
    }
  };
}
