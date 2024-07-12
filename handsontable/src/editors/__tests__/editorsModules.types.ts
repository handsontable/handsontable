import {
  AutocompleteEditor,
  BaseEditor,
  CheckboxEditor,
  DateEditor,
  DropdownEditor,
  HandsontableEditor,
  NumericEditor,
  PasswordEditor,
  SelectEditor,
  TextEditor,
  TimeEditor,
  getEditor,
  registerAllEditors,
  registerEditor,
} from 'handsontable/editors';

registerAllEditors();

registerEditor(AutocompleteEditor);
registerEditor(BaseEditor);
registerEditor(CheckboxEditor);
registerEditor(DateEditor);
registerEditor(DropdownEditor);
registerEditor(HandsontableEditor);
registerEditor(NumericEditor);
registerEditor(PasswordEditor);
registerEditor(SelectEditor);
registerEditor(TextEditor);
registerEditor(TimeEditor);

const AutocompleteEditorClass: typeof AutocompleteEditor = getEditor('autocomplete');
const BaseEditorClass: typeof BaseEditor = getEditor('base');
const CheckboxEditorClass: typeof CheckboxEditor = getEditor('checkbox');
const DateEditorClass: typeof DateEditor = getEditor('date');
const DropdownEditorClass: typeof DropdownEditor = getEditor('dropdown');
const HandsontableEditorClass: typeof HandsontableEditor = getEditor('handsontable');
const NumericEditorClass: typeof NumericEditor = getEditor('numeric');
const PasswordEditorClass: typeof PasswordEditor = getEditor('password');
const SelectEditorClass: typeof SelectEditor = getEditor('select');
const TextEditorClass: typeof TextEditor = getEditor('text');
const TimeEditorClass: typeof TimeEditor = getEditor('time');
const CustomEditorClass: typeof BaseEditor = getEditor('custom-editor');
