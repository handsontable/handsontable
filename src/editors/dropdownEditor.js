import AutocompleteEditor from './autocompleteEditor';
import Hooks from './../pluginHooks';

/**
 * @private
 * @class DropdownEditor
 */
class DropdownEditor extends AutocompleteEditor {
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

Hooks.getSingleton().add('beforeValidate', function(value, row, prop) {
  const propToColResult = this.propToCol(prop);
  // Populated data may contain indexes beyond current table boundaries.
  const column = propToColResult !== null ? propToColResult : prop;
  const cellMeta = this.getCellMeta(row, column);

  if (cellMeta.editor === DropdownEditor) {
    if (cellMeta.strict === void 0) {
      cellMeta.filter = false;
      cellMeta.strict = true;
    }
  }
});

export default DropdownEditor;
