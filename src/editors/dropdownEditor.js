
import {getEditor, registerEditor} from './../editors';
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

export {DropdownEditor};

registerEditor('dropdown', DropdownEditor);
