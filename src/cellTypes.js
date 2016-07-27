/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

import {isMobileBrowser} from './helpers/browser';
import {getEditorConstructor} from './editors';
import {getRenderer} from './renderers';

import {AutocompleteEditor} from './editors/autocompleteEditor';
import {CheckboxEditor} from './editors/checkboxEditor';
import {DateEditor} from './editors/dateEditor';
import {DropdownEditor} from './editors/dropdownEditor';
import {HandsontableEditor} from './editors/handsontableEditor';
import {MobileTextEditor} from './editors/mobileTextEditor';
import {NumericEditor} from './editors/numericEditor';
import {PasswordEditor} from './editors/passwordEditor';
import {SelectEditor} from './editors/selectEditor';
import {TextEditor} from './editors/textEditor';

import {AutocompleteRenderer} from './renderers/autocompleteRenderer';
import {CheckboxRenderer} from './renderers/checkboxRenderer';
import {HtmlRenderer} from './renderers/htmlRenderer';
import {NumericRenderer} from './renderers/numericRenderer';
import {PasswordRenderer} from './renderers/passwordRenderer';
import {TextRenderer} from './renderers/textRenderer';

import {AutocompleteValidator} from './validators/autocompleteValidator';
import {DateValidator} from './validators/dateValidator';
import {TimeValidator} from './validators/timeValidator';
import {NumericValidator} from './validators/numericValidator';

import Handsontable from './browser';

Handsontable.AutocompleteCell = {
  editor: getEditorConstructor('autocomplete'),
  renderer: getRenderer('autocomplete'),
  validator: Handsontable.AutocompleteValidator,
};

Handsontable.CheckboxCell = {
  editor: getEditorConstructor('checkbox'),
  renderer: getRenderer('checkbox'),
};

Handsontable.TextCell = {
  editor: isMobileBrowser() ? getEditorConstructor('mobile') : getEditorConstructor('text'),
  renderer: getRenderer('text'),
};

Handsontable.NumericCell = {
  editor: getEditorConstructor('numeric'),
  renderer: getRenderer('numeric'),
  validator: Handsontable.NumericValidator,
  dataType: 'number',
};

Handsontable.DateCell = {
  editor: getEditorConstructor('date'),
  validator: Handsontable.DateValidator,
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
};

Handsontable.TimeCell = {
  editor: getEditorConstructor('text'),
  validator: Handsontable.TimeValidator,
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('text'),
};

Handsontable.HandsontableCell = {
  editor: getEditorConstructor('handsontable'),
  //displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
};

Handsontable.PasswordCell = {
  editor: getEditorConstructor('password'),
  renderer: getRenderer('password'),
  copyable: false,
};

Handsontable.DropdownCell = {
  editor: getEditorConstructor('dropdown'),
  //displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
  validator: Handsontable.AutocompleteValidator,
};

//here setup the friendly aliases that are used by cellProperties.type
Handsontable.cellTypes = {
  text: Handsontable.TextCell,
  date: Handsontable.DateCell,
  time: Handsontable.TimeCell,
  numeric: Handsontable.NumericCell,
  checkbox: Handsontable.CheckboxCell,
  autocomplete: Handsontable.AutocompleteCell,
  handsontable: Handsontable.HandsontableCell,
  password: Handsontable.PasswordCell,
  dropdown: Handsontable.DropdownCell,
};

//here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
Handsontable.cellLookup = {
  validator: {
    numeric: Handsontable.NumericValidator,
    autocomplete: Handsontable.AutocompleteValidator,
  }
};
