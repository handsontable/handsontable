import { AutocompleteEditor } from '../autocompleteEditor';

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
  prepare(row, col, prop, td, value, cellProperties) {
    cellProperties.filter = false;
    cellProperties.strict = true;

    super.prepare(row, col, prop, td, value, cellProperties);
  }
}
