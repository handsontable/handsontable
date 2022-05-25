import { AutocompleteEditor, EDITOR_TYPE as AUTOCOMPLETE_EDITOR } from './autocompleteEditor';
import { BaseEditor, EDITOR_TYPE as BASE_EDITOR } from './baseEditor';
import { CheckboxEditor, EDITOR_TYPE as CHECKBOX_EDITOR } from './checkboxEditor';
import { DateEditor, EDITOR_TYPE as DATE_EDITOR } from './dateEditor';
import { DropdownEditor, EDITOR_TYPE as DROPDOWN_EDITOR } from './dropdownEditor';
import { HandsontableEditor, EDITOR_TYPE as HANDSONTABLE_EDITOR } from './handsontableEditor';
import { NumericEditor, EDITOR_TYPE as NUMERIC_EDITOR } from './numericEditor';
import { PasswordEditor, EDITOR_TYPE as PASSWORD_EDITOR } from './passwordEditor';
import { SelectEditor, EDITOR_TYPE as SELECT_EDITOR } from './selectEditor';
import { TextEditor, EDITOR_TYPE as TEXT_EDITOR } from './textEditor';
import { TimeEditor, EDITOR_TYPE as TIME_EDITOR } from './timeEditor';
import {
  registerEditor,
} from './registry';

/**
 * Registers all available editors.
 */
export function registerAllEditors() {
  registerEditor(BaseEditor);
  registerEditor(AutocompleteEditor);
  registerEditor(CheckboxEditor);
  registerEditor(DateEditor);
  registerEditor(DropdownEditor);
  registerEditor(HandsontableEditor);
  registerEditor(NumericEditor);
  registerEditor(PasswordEditor);
  registerEditor(SelectEditor);
  registerEditor(TextEditor);
  registerEditor(TimeEditor);
}

export {
  AutocompleteEditor, AUTOCOMPLETE_EDITOR,
  BaseEditor, BASE_EDITOR,
  CheckboxEditor, CHECKBOX_EDITOR,
  DateEditor, DATE_EDITOR,
  DropdownEditor, DROPDOWN_EDITOR,
  HandsontableEditor, HANDSONTABLE_EDITOR,
  NumericEditor, NUMERIC_EDITOR,
  PasswordEditor, PASSWORD_EDITOR,
  SelectEditor, SELECT_EDITOR,
  TextEditor, TEXT_EDITOR,
  TimeEditor, TIME_EDITOR,
};

export {
  RegisteredEditor,
  _getEditorInstance,
  getEditor,
  getEditorInstance,
  getRegisteredEditorNames,
  getRegisteredEditors,
  hasEditor,
  registerEditor,
} from './registry';
