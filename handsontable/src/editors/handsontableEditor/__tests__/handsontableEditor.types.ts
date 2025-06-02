import Handsontable from 'handsontable';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const editor = new Handsontable.editors.HandsontableEditor(hot);

// abstract ones
editor.open();
editor.close();
editor.beginEditing();
editor.createElements();
editor.finishEditing();
const value: string = editor.getValue();

// editor specific ones
const isFlippedVertically: boolean = editor.isFlippedVertically;
const isFlippedHorizontally: boolean = editor.isFlippedHorizontally;
const dropdownHeight: number = editor.getDropdownHeight();
const dropdownWidth: number = editor.getDropdownWidth();
const targetDropdownWidth: number = editor.getTargetDropdownWidth();
const targetDropdownHeight: number = editor.getTargetDropdownHeight();
