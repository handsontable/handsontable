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
{
  const result: {
    isFlipped: boolean;
    spaceAbove: number;
    spaceBelow: number;
  } = editor.flipDropdownVerticallyIfNeeded();
}
editor.flipDropdownVertically();
editor.unflipDropdownVertically();
{
  const result: {
    isFlipped: boolean;
    spaceInlineStart: number;
    spaceInlineEnd: number;
  } = editor.flipDropdownHorizontallyIfNeeded();
}
editor.flipDropdownHorizontally();
editor.unflipDropdownHorizontally();

const dropdownHeight: number = editor.getDropdownHeight();
const dropdownWidth: number = editor.getDropdownWidth();
const targetDropdownWidth: number = editor.getTargetDropdownWidth();
const targetDropdownHeight: number = editor.getTargetDropdownHeight();
