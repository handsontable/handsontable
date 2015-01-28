
import {getEditor, registerEditor} from './../editors.js';
import {AutocompleteEditor} from './autocompleteEditor.js';

var DropdownEditor = AutocompleteEditor.prototype.extend();

export {DropdownEditor};

Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.DropdownEditor = DropdownEditor;

DropdownEditor.prototype.prepare = function () {
  AutocompleteEditor.prototype.prepare.apply(this, arguments);

  this.cellProperties.filter = false;
  this.cellProperties.strict = true;
};

registerEditor('dropdown', DropdownEditor);
