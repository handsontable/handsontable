/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

import * as helper from './helpers.js';
import {getEditorConstructor} from './editors.js';
import {getRenderer} from './renderers.js';

Handsontable.mobileBrowser = helper.isMobileBrowser();  // check if viewed on a mobile device

Handsontable.AutocompleteCell = {
  editor: getEditorConstructor('autocomplete'),
  renderer: getRenderer('autocomplete'),
  validator: Handsontable.AutocompleteValidator
};

Handsontable.CheckboxCell = {
  editor: getEditorConstructor('checkbox'),
  renderer: getRenderer('checkbox')
};

Handsontable.TextCell = {
  editor: Handsontable.mobileBrowser ? getEditorConstructor('mobile') : getEditorConstructor('text'),
  renderer: getRenderer('text')
};

Handsontable.NumericCell = {
  editor: getEditorConstructor('numeric'),
  renderer: getRenderer('numeric'),
  validator: Handsontable.NumericValidator,
  dataType: 'number'
};

Handsontable.DateCell = {
  editor: getEditorConstructor('date'),
  validator: Handsontable.DateValidator,
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete')
};

Handsontable.HandsontableCell = {
  editor: getEditorConstructor('handsontable'),
  //displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete')
};

Handsontable.PasswordCell = {
  editor: getEditorConstructor('password'),
  renderer: getRenderer('password'),
  copyable: false
};

Handsontable.DropdownCell = {
  editor: getEditorConstructor('dropdown'),
  //displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
  validator: Handsontable.AutocompleteValidator
};

//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {
  text: Handsontable.TextCell,
  date: Handsontable.DateCell,
  numeric: Handsontable.NumericCell,
  checkbox: Handsontable.CheckboxCell,
  autocomplete: Handsontable.AutocompleteCell,
  handsontable: Handsontable.HandsontableCell,
  password: Handsontable.PasswordCell,
  dropdown: Handsontable.DropdownCell
};

//here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
Handsontable.cellLookup = {
  validator: {
    numeric: Handsontable.NumericValidator,
    autocomplete: Handsontable.AutocompleteValidator
  }
};
