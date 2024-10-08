import Handsontable from 'handsontable';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const editor = new Handsontable.editors.AutocompleteEditor(hot);

editor.queryChoices('test');
editor.updateChoicesList(['a', 'b', 'c']);
editor.limitDropdownIfNeeded(100, 20);
editor.flipDropdown(100);
editor.unflipDropdown();
editor.updateDropdownDimensions();
editor.setDropdownHeight(100);
editor.highlightBestMatchingChoice(1);
editor.stripValueIfNeeded('test');
editor.stripValuesIfNeeded(['test1', 'test2']);

const value: string = editor.getValue();
const isFlipped: boolean = editor.flipDropdownIfNeeded();
const dropdownHeight: number = editor.getDropdownHeight();
