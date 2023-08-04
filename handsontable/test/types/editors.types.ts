import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const autocomplete = new Handsontable.editors.AutocompleteEditor(hot);

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
autocomplete.getEditedCellsZIndex();
autocomplete.getValue();
autocomplete.init();
autocomplete.isInFullEditMode();
autocomplete.isOpened();
autocomplete.isWaiting();
autocomplete.open();
autocomplete.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0 , 0));
autocomplete.saveValue('test', true);
autocomplete.saveValue();
autocomplete.setValue('test');
autocomplete.setValue();

autocomplete.flipDropdown(100);

const checkbox = new Handsontable.editors.CheckboxEditor(hot);

checkbox.beginEditing('test');
checkbox.beginEditing();
checkbox.cancelChanges();
checkbox.checkEditorSection();
checkbox.close();
checkbox.discardEditor(true);
checkbox.discardEditor();
checkbox.enableFullEditMode();
checkbox.extend();
checkbox.finishEditing(true, false, () => {});
checkbox.finishEditing();
checkbox.focus();
checkbox.getEditedCell();
checkbox.getEditedCellRect();
checkbox.getEditedCellsZIndex();
checkbox.getValue();
checkbox.init();
checkbox.isInFullEditMode();
checkbox.isOpened();
checkbox.isWaiting();
checkbox.open();
checkbox.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
checkbox.saveValue('test', true);
checkbox.saveValue();
checkbox.setValue('test');
checkbox.setValue();

const date = new Handsontable.editors.DateEditor(hot);

date.beginEditing('test');
date.beginEditing();
date.cancelChanges();
date.checkEditorSection();
date.close();
date.discardEditor(true);
date.discardEditor();
date.enableFullEditMode();
date.extend();
date.finishEditing(true, false, () => {});
date.finishEditing();
date.focus();
date.getEditedCell();
date.getEditedCellRect();
date.getEditedCellsZIndex();
date.getValue();
date.init();
date.isInFullEditMode();
date.isOpened();
date.isWaiting();
date.open();
date.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
date.saveValue('test', true);
date.saveValue();
date.setValue('test');
date.setValue();

date.getDatePickerConfig();
date.showDatepicker();
date.hideDatepicker();

const dropdown = new Handsontable.editors.DropdownEditor(hot);

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
dropdown.getEditedCellsZIndex();
dropdown.getValue();
dropdown.init();
dropdown.isInFullEditMode();
dropdown.isOpened();
dropdown.isWaiting();
dropdown.open();
dropdown.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
dropdown.saveValue('test', true);
dropdown.saveValue();
dropdown.setValue('test');
dropdown.setValue();

dropdown.flipDropdownIfNeeded();
dropdown.updateChoicesList([]);

const hansontable = new Handsontable.editors.HandsontableEditor(hot);

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
hansontable.getEditedCellsZIndex();
hansontable.getValue();
hansontable.init();
hansontable.isInFullEditMode();
hansontable.isOpened();
hansontable.isWaiting();
hansontable.open();
hansontable.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
hansontable.saveValue('test', true);
hansontable.saveValue();
hansontable.setValue('test');
hansontable.setValue();

const numeric = new Handsontable.editors.NumericEditor(hot);

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
numeric.getEditedCellsZIndex();
numeric.getValue();
numeric.init();
numeric.isInFullEditMode();
numeric.isOpened();
numeric.isWaiting();
numeric.open();
numeric.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
numeric.saveValue('test', true);
numeric.saveValue();
numeric.setValue('test');
numeric.setValue();

const password = new Handsontable.editors.PasswordEditor(hot);

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
password.getEditedCellsZIndex();
password.getValue();
password.init();
password.isInFullEditMode();
password.isOpened();
password.isWaiting();
password.open();
password.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
password.saveValue('test', true);
password.saveValue();
password.setValue('test');
password.setValue();

const select = new Handsontable.editors.SelectEditor(hot);

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
select.getEditedCellsZIndex();
select.getValue();
select.init();
select.isInFullEditMode();
select.isOpened();
select.isWaiting();
select.open();
select.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
select.saveValue('test', true);
select.saveValue();
select.setValue('test');
select.setValue();

select.prepareOptions([]);

const text = new Handsontable.editors.TextEditor(hot);

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
text.getEditedCellsZIndex();
text.getValue();
text.init();
text.isInFullEditMode();
text.isOpened();
text.isWaiting();
text.open();
text.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
text.saveValue('test', true);
text.saveValue();
text.setValue('test');
text.setValue();

const time = new Handsontable.editors.TimeEditor(hot);

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
time.getEditedCellsZIndex();
time.getValue();
time.init();
time.isInFullEditMode();
time.isOpened();
time.isWaiting();
time.open();
time.prepare(1, 2, 'test', (document.createElement('TD') as HTMLTableCellElement), 'test', hot.getCellMeta(0, 0));
time.saveValue('test', true);
time.saveValue();
time.setValue('test');
time.setValue();

// Verify top-level editors API
class CustomEditor extends Handsontable.editors.getEditor('text') {
  open() {}
  close() {}
  getValue() {}
  setValue(value: any) {}
  focus() {}
}
Handsontable.editors.registerEditor('custom', CustomEditor);
