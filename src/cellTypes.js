/**
 * Cell type is just a shortcut for setting bunch of cellProperties (used in getCellMeta)
 */

import {isMobileBrowser} from './helpers/browser';
import {getEditorConstructor} from './editors';
import {getRenderer} from './renderers';

import AutocompleteEditor from './editors/autocompleteEditor';
import CheckboxEditor from './editors/checkboxEditor';
import DateEditor from './editors/dateEditor';
import DropdownEditor from './editors/dropdownEditor';
import HandsontableEditor from './editors/handsontableEditor';
import MobileTextEditor from './editors/mobileTextEditor';
import NumericEditor from './editors/numericEditor';
import PasswordEditor from './editors/passwordEditor';
import SelectEditor from './editors/selectEditor';
import TextEditor from './editors/textEditor';

import AutocompleteRenderer from './renderers/autocompleteRenderer';
import CheckboxRenderer from './renderers/checkboxRenderer';
import HtmlRenderer from './renderers/htmlRenderer';
import NumericRenderer from './renderers/numericRenderer';
import PasswordRenderer from './renderers/passwordRenderer';
import TextRenderer from './renderers/textRenderer';

import AutocompleteValidator from './validators/autocompleteValidator';
import DateValidator from './validators/dateValidator';
import TimeValidator from './validators/timeValidator';
import NumericValidator from './validators/numericValidator';

export const AutocompleteCell = {
  editor: getEditorConstructor('autocomplete'),
  renderer: getRenderer('autocomplete'),
  validator: AutocompleteValidator,
};

export const CheckboxCell = {
  editor: getEditorConstructor('checkbox'),
  renderer: getRenderer('checkbox'),
};

export const TextCell = {
  editor: isMobileBrowser() ? getEditorConstructor('mobile') : getEditorConstructor('text'),
  renderer: getRenderer('text'),
};

export const NumericCell = {
  editor: getEditorConstructor('numeric'),
  renderer: getRenderer('numeric'),
  validator: NumericValidator,
  dataType: 'number',
};

export const DateCell = {
  editor: getEditorConstructor('date'),
  validator: DateValidator,
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
};

export const TimeCell = {
  editor: getEditorConstructor('text'),
  validator: TimeValidator,
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('text'),
};

export const HandsontableCell = {
  editor: getEditorConstructor('handsontable'),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
};

export const PasswordCell = {
  editor: getEditorConstructor('password'),
  renderer: getRenderer('password'),
  copyable: false,
};

export const DropdownCell = {
  editor: getEditorConstructor('dropdown'),
  // displays small gray arrow on right side of the cell
  renderer: getRenderer('autocomplete'),
  validator: AutocompleteValidator,
};

// here setup the friendly aliases that are used by cellProperties.renderer and cellProperties.editor
export const cellLookup = {
  validator: {
    numeric: NumericValidator,
    autocomplete: AutocompleteValidator,
  }
};

// here setup the friendly aliases that are used by cellProperties.type
const cellTypes = {
  text: TextCell,
  date: DateCell,
  time: TimeCell,
  numeric: NumericCell,
  checkbox: CheckboxCell,
  autocomplete: AutocompleteCell,
  handsontable: HandsontableCell,
  password: PasswordCell,
  dropdown: DropdownCell,
};

export default cellTypes;
