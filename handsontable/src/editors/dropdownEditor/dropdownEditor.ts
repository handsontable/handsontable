import { AutocompleteEditor } from '../autocompleteEditor';
import { isUndefined, isDefined } from '../../helpers/mixed';

export const EDITOR_TYPE = 'dropdown';

/**
 * @private
 * @class DropdownEditor
 */
export class DropdownEditor extends AutocompleteEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(
    row: number, col: number, prop: string | number,
    td: HTMLTableCellElement, value: unknown, cellProperties: Record<string, unknown>): void {
    cellProperties.filter = false;
    cellProperties.strict = true;

    super.prepare(row, col, prop, td, value, cellProperties);
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: () => void) {
    if (this.isOpened()) {
      const lastSelectedRange = this.hot.getSelectedRangeActive();

      if (
        isUndefined(lastSelectedRange) ||
        (
          isDefined(lastSelectedRange) &&
          !lastSelectedRange.includes(this.hot._createCellCoords(this.row, this.col))
        )
      ) {
        restoreOriginalValue = true;
      }
    }

    super.finishEditing(restoreOriginalValue, ctrlDown, callback);
  }
}
