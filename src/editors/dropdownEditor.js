import Handsontable from './../browser';
import {getEditor, registerEditor, getEditorConstructor} from './../editors';
import {AutocompleteEditor} from './autocompleteEditor';

/**
 * @private
 * @editor DropdownEditor
 * @class DropdownEditor
 * @dependencies AutocompleteEditor
 */
class DropdownEditor extends AutocompleteEditor {
  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);
    this.cellProperties.filter = false;
    this.cellProperties.strict = true;
  }
}

Handsontable.hooks.add('beforeValidate', function(value, row, col, source) {
  let cellMeta = this.getCellMeta(row, this.propToCol(col));

  if (cellMeta.editor === Handsontable.editors.DropdownEditor) {
    if (cellMeta.strict === void 0) {
      cellMeta.filter = false;
      cellMeta.strict = true;
    }
  }
});

export {DropdownEditor};

registerEditor('dropdown', DropdownEditor);
