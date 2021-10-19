import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const cellProperties: Handsontable.CellProperties = {
  row: 0,
  col: 0,
  instance: {} as Handsontable,
  visualRow: 0,
  visualCol: 0,
  prop: 'foo'
};

const TD = document.createElement('td');

// Verify the built-in editors exist and have the right class types -- spot check a couple class methods on each
const autocomplete = new Handsontable.editors.AutocompleteEditor(hot, 0, 0, 'prop', TD, cellProperties);
autocomplete.isOpened();
autocomplete.flipDropdown(100);

const checkbox = new Handsontable.editors.CheckboxEditor(hot, 0, 0, 'prop', TD, cellProperties);
checkbox.getValue();
checkbox.setValue('foo');

const date = new Handsontable.editors.DateEditor(hot, 0, 0, 'prop', TD, cellProperties);
date.getDatePickerConfig();
date.showDatepicker();
date.hideDatepicker();

const dropdown = new Handsontable.editors.DropdownEditor(hot, 0, 0, 'prop', TD, cellProperties);
dropdown.flipDropdownIfNeeded();
dropdown.updateChoicesList([]);

const hansontable = new Handsontable.editors.HandsontableEditor(hot, 0, 0, 'prop', TD, cellProperties);
hansontable.beginEditing('');

const mobile = new Handsontable.editors.MobileEditor(hot, 0, 0, 'prop', TD, cellProperties);
mobile.hideCellPointer();
mobile.scrollToView();

const numeric = new Handsontable.editors.NumericEditor(hot, 0, 0, 'prop', TD, cellProperties);
numeric.checkEditorSection();
numeric.getEditedCell();
numeric.getEditedCellsZIndex();
numeric.close();

const password = new Handsontable.editors.PasswordEditor(hot, 0, 0, 'prop', TD, cellProperties);
password.open();
password.isWaiting();

const select = new Handsontable.editors.SelectEditor(hot, 0, 0, 'prop', TD, cellProperties);
select.prepareOptions([]);

const text = new Handsontable.editors.TextEditor(hot, 0, 0, 'prop', TD, cellProperties);
text.focus();
text.finishEditing();

const time = new Handsontable.editors.TimeEditor(hot, 0, 0, 'prop', TD, cellProperties);
time.discardEditor();


// Verify top-level editors API
class CustomEditor extends Handsontable.editors.getEditor('text') {
  open(){}
  close(){}
  getValue(){}
  setValue(value: any){}
  focus(){}
}
Handsontable.editors.registerEditor('custom', CustomEditor);
