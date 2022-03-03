import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const autocomplete = new Handsontable.editors.AutocompleteEditor(hot);

autocomplete.isOpened();
autocomplete.flipDropdown(100);

const checkbox = new Handsontable.editors.CheckboxEditor(hot);

checkbox.getValue();
checkbox.setValue('foo');

const date = new Handsontable.editors.DateEditor(hot);

date.getDatePickerConfig();
date.showDatepicker();
date.hideDatepicker();

const dropdown = new Handsontable.editors.DropdownEditor(hot);

dropdown.flipDropdownIfNeeded();
dropdown.updateChoicesList([]);

const hansontable = new Handsontable.editors.HandsontableEditor(hot);

hansontable.beginEditing('');

const numeric = new Handsontable.editors.NumericEditor(hot);

numeric.checkEditorSection();
numeric.getEditedCell();
numeric.getEditedCellsZIndex();
numeric.close();

const password = new Handsontable.editors.PasswordEditor(hot);

password.open();
password.isWaiting();

const select = new Handsontable.editors.SelectEditor(hot);

select.prepareOptions([]);

const text = new Handsontable.editors.TextEditor(hot);

text.focus();
text.finishEditing();

const time = new Handsontable.editors.TimeEditor(hot);

time.focus();
time.finishEditing();

// Verify top-level editors API
class CustomEditor extends Handsontable.editors.getEditor('text') {
  open() {}
  close() {}
  getValue() {}
  setValue(value: any) {}
  focus() {}
}
Handsontable.editors.registerEditor('custom', CustomEditor);
