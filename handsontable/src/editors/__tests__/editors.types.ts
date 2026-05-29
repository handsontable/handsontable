import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';
import type {
  BaseEditor } from 'handsontable/editors';
import {
  AutocompleteEditor,
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
  registerEditor,
  editorFactory,
} from 'handsontable/editors';

const elem = document.createElement('div');
const hot = Handsontable(elem, {}) as unknown as HotInstance;

const autocomplete = new AutocompleteEditor(hot);

autocomplete.beginEditing('test');
autocomplete.beginEditing();
autocomplete.cancelChanges();
autocomplete.checkEditorSection();
autocomplete.close();
autocomplete.discardEditor(true);
autocomplete.discardEditor();
autocomplete.enableFullEditMode();
autocomplete.extend();
autocomplete.finishEditing(true, false, () => {});
autocomplete.finishEditing();
autocomplete.focus();
autocomplete.getEditedCell();
autocomplete.getEditedCellRect();
autocomplete.getEditedCellsLayerClass();
autocomplete.getValue();
autocomplete.init();
autocomplete.isInFullEditMode();
autocomplete.isOpened();
autocomplete.isWaiting();
autocomplete.open();
autocomplete.prepare(
  1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0)
);
autocomplete.saveValue('test', true);
autocomplete.saveValue(undefined);
autocomplete.setValue('test');
autocomplete.setValue();

const checkbox = new CheckboxEditor(hot);

checkbox.beginEditing('test');
checkbox.beginEditing();
checkbox.cancelChanges();
checkbox.checkEditorSection();
checkbox.close();
checkbox.discardEditor(true);
checkbox.discardEditor();
checkbox.enableFullEditMode();
checkbox.extend();
checkbox.finishEditing();
checkbox.finishEditing();
checkbox.focus();
checkbox.getEditedCell();
checkbox.getEditedCellRect();
checkbox.getEditedCellsLayerClass();
checkbox.getValue();
checkbox.init();
checkbox.isInFullEditMode();
checkbox.isOpened();
checkbox.isWaiting();
checkbox.open();
checkbox.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
checkbox.saveValue('test', true);
checkbox.saveValue(undefined);
checkbox.setValue();
checkbox.setValue();

const date = new DateEditor(hot);

date.beginEditing('test');
date.beginEditing();
date.cancelChanges();
date.checkEditorSection();
date.close();
date.discardEditor(true);
date.discardEditor();
date.enableFullEditMode();
date.extend();
date.finishEditing(true, false);
date.finishEditing();
date.focus();
date.getEditedCell();
date.getEditedCellRect();
date.getEditedCellsLayerClass();
date.getValue();
date.init();
date.isInFullEditMode();
date.isOpened();
date.isWaiting();
date.open();
date.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
date.saveValue('test', true);
date.saveValue(undefined);
date.setValue('test');
date.setValue();

date.getDatePickerConfig();
date.showDatepicker();
date.hideDatepicker();

const dropdown = new DropdownEditor(hot);

dropdown.beginEditing('test');
dropdown.beginEditing();
dropdown.cancelChanges();
dropdown.checkEditorSection();
dropdown.close();
dropdown.discardEditor(true);
dropdown.discardEditor();
dropdown.enableFullEditMode();
dropdown.extend();
dropdown.finishEditing(true, false, () => {});
dropdown.finishEditing();
dropdown.focus();
dropdown.getEditedCell();
dropdown.getEditedCellRect();
dropdown.getEditedCellsLayerClass();
dropdown.getValue();
dropdown.init();
dropdown.isInFullEditMode();
dropdown.isOpened();
dropdown.isWaiting();
dropdown.open();
dropdown.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
dropdown.saveValue('test', true);
dropdown.saveValue(undefined);
dropdown.setValue('test');
dropdown.setValue();

const hansontable = new HandsontableEditor(hot);

hansontable.beginEditing('test');
hansontable.beginEditing();
hansontable.cancelChanges();
hansontable.checkEditorSection();
hansontable.close();
hansontable.discardEditor(true);
hansontable.discardEditor();
hansontable.enableFullEditMode();
hansontable.extend();
hansontable.finishEditing(true, false, () => {});
hansontable.finishEditing();
hansontable.focus();
hansontable.getEditedCell();
hansontable.getEditedCellRect();
hansontable.getEditedCellsLayerClass();
hansontable.getValue();
hansontable.init();
hansontable.isInFullEditMode();
hansontable.isOpened();
hansontable.isWaiting();
hansontable.open();
hansontable.prepare(
  1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0)
);
hansontable.saveValue('test', true);
hansontable.saveValue(undefined);
hansontable.setValue('test');
hansontable.setValue();

const numeric = new NumericEditor(hot);

numeric.beginEditing('test');
numeric.beginEditing();
numeric.cancelChanges();
numeric.checkEditorSection();
numeric.close();
numeric.discardEditor(true);
numeric.discardEditor();
numeric.enableFullEditMode();
numeric.extend();
numeric.finishEditing(true, false, () => {});
numeric.finishEditing();
numeric.focus();
numeric.getEditedCell();
numeric.getEditedCellRect();
numeric.getEditedCellsLayerClass();
numeric.getValue();
numeric.init();
numeric.isInFullEditMode();
numeric.isOpened();
numeric.isWaiting();
numeric.open();
numeric.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
numeric.saveValue('test', true);
numeric.saveValue(undefined);
numeric.setValue('test');
numeric.setValue();

const password = new PasswordEditor(hot);

password.beginEditing('test');
password.beginEditing();
password.cancelChanges();
password.checkEditorSection();
password.close();
password.discardEditor(true);
password.discardEditor();
password.enableFullEditMode();
password.extend();
password.finishEditing(true, false, () => {});
password.finishEditing();
password.focus();
password.getEditedCell();
password.getEditedCellRect();
password.getEditedCellsLayerClass();
password.getValue();
password.init();
password.isInFullEditMode();
password.isOpened();
password.isWaiting();
password.open();
password.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
password.saveValue('test', true);
password.saveValue(undefined);
password.setValue('test');
password.setValue();

const select = new SelectEditor(hot);

select.beginEditing('test');
select.beginEditing();
select.cancelChanges();
select.checkEditorSection();
select.close();
select.discardEditor(true);
select.discardEditor();
select.enableFullEditMode();
select.extend();
select.finishEditing(true, false, () => {});
select.finishEditing();
select.focus();
select.getEditedCell();
select.getEditedCellRect();
select.getEditedCellsLayerClass();
select.getValue();
select.init();
select.isInFullEditMode();
select.isOpened();
select.isWaiting();
select.open();
select.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
select.saveValue('test', true);
select.saveValue(undefined);
select.setValue('test');
select.setValue();

select.prepareOptions([]);

const text = new TextEditor(hot);

text.beginEditing('test');
text.beginEditing();
text.cancelChanges();
text.checkEditorSection();
text.close();
text.discardEditor(true);
text.discardEditor();
text.enableFullEditMode();
text.extend();
text.finishEditing(true, false, () => {});
text.finishEditing();
text.focus();
text.getEditedCell();
text.getEditedCellRect();
text.getEditedCellsLayerClass();
text.getValue();
text.init();
text.isInFullEditMode();
text.isOpened();
text.isWaiting();
text.open();
text.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
text.saveValue('test', true);
text.saveValue(undefined);
text.setValue('test');
text.setValue();

const time = new TimeEditor(hot);

time.beginEditing('test');
time.beginEditing();
time.cancelChanges();
time.checkEditorSection();
time.close();
time.discardEditor(true);
time.discardEditor();
time.enableFullEditMode();
time.extend();
time.finishEditing(true, false, () => {});
time.finishEditing();
time.focus();
time.getEditedCell();
time.getEditedCellRect();
time.getEditedCellsLayerClass();
time.getValue();
time.init();
time.isInFullEditMode();
time.isOpened();
time.isWaiting();
time.open();
time.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
time.saveValue('test', true);
time.saveValue(undefined);
time.setValue('test');
time.setValue();

// Verify top-level editors API
class CustomEditor extends (getEditor('text') as typeof BaseEditor) {
  open() {}
  close() {}
  getValue() {}
  setValue(value?: unknown) {}
  focus() {}
}
registerEditor('custom', CustomEditor);

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
