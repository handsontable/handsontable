import Handsontable from 'handsontable';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const editor = new Handsontable.editors.AutocompleteEditor(hot);

// abstract ones
editor.open();
editor.close();
editor.beginEditing();
editor.createElements();
editor.finishEditing();
editor.updateChoicesList([1, 2, 3]);
editor.updateChoicesList(['test', 'test2', 'test3']);
editor.updateChoicesList(['test', 2, 'test3']);
editor.updateChoicesList([{ key: 'test', value: 'test' }, { key: 'test2', value: 'test2' }]);
editor.updateChoicesList([{ key: 1, value: 'test' }, { key: 'test2', value: 2 }]);

const value: string = editor.getValue();

// editor specific ones
editor.queryChoices('test');

const dropdownHeight: number = editor.getDropdownHeight();
const dropdownWidth: number = editor.getDropdownWidth();
const targetDropdownWidth: number = editor.getTargetDropdownWidth();
const targetDropdownHeight: number = editor.getTargetDropdownHeight();
