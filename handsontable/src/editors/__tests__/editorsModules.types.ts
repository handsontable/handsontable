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
  init(editor: BaseEditor) {},
  afterInit(editor: BaseEditor) {},
  afterOpen(editor: BaseEditor) {},
  afterClose(editor: BaseEditor) {},
  beforeOpen(editor: BaseEditor) {},
  getValue(editor: BaseEditor) {},
  setValue(editor: BaseEditor, value: unknown) {},
  onFocus(editor: BaseEditor) {},
  render(editor: BaseEditor) {},
  position: 'container',
  value: 'test',
  config: {
    test: 'test',
  },
  shortcutsGroup: 'custom-shortcuts',
  shortcuts: [
    {
      keys: [['Enter']],
      callback: (editor: BaseEditor) => {
        return false;
      },
    },
  ],
  args: {
    test: 'test',
  },
});
