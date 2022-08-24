import { AutocompleteEditor } from '../autocompleteEditor';
import Hooks from '../../pluginHooks';

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
   * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
   */
  prepare(row, col, prop, td, value, cellProperties) {
    super.prepare(row, col, prop, td, value, cellProperties);
    this.cellProperties.filter = false;
    this.cellProperties.strict = true;
  }
}

Hooks.getSingleton().add('beforeValidate', function(value, row, col) {
  const cellMeta = this.getCellMeta(row, this.propToCol(col));

  if (cellMeta.editor === DropdownEditor) {
    if (cellMeta.strict === void 0) {
      cellMeta.filter = false;
      cellMeta.strict = true;
    }
  }
});
