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
  editorFactory,
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

const AutocompleteEditorClass = getEditor('autocomplete') as typeof AutocompleteEditor;
const BaseEditorClass = getEditor('base') as typeof BaseEditor;
const CheckboxEditorClass = getEditor('checkbox') as typeof CheckboxEditor;
const DateEditorClass = getEditor('date') as typeof DateEditor;
const DropdownEditorClass = getEditor('dropdown') as typeof DropdownEditor;
const HandsontableEditorClass = getEditor('handsontable') as typeof HandsontableEditor;
const NumericEditorClass = getEditor('numeric') as typeof NumericEditor;
const PasswordEditorClass = getEditor('password') as typeof PasswordEditor;
const SelectEditorClass = getEditor('select') as typeof SelectEditor;
const TextEditorClass = getEditor('text') as typeof TextEditor;
const TimeEditorClass = getEditor('time') as typeof TimeEditor;
const CustomEditorClass = getEditor('custom-editor') as typeof BaseEditor;

editorFactory({
  init(editor: Record<string, unknown>) {},
  afterInit(editor: Record<string, unknown>) {},
  afterOpen(editor: Record<string, unknown>) {},
  afterClose(editor: Record<string, unknown>) {},
  beforeOpen(editor: Record<string, unknown>) {},
  getValue(editor: Record<string, unknown>) {},
  setValue(editor: Record<string, unknown>, value: unknown) {},
  onFocus(editor: Record<string, unknown>) {},
  render(editor: Record<string, unknown>) {},
  position: 'container',
  value: 'test',
  config: {
    test: 'test',
  },
  shortcutsGroup: 'custom-shortcuts',
  shortcuts: [
    {
      keys: [['Enter']],
      callback: (editor: Record<string, unknown>) => {
        return false;
      },
    },
  ],
  args: {
    test: 'test',
  },
});
