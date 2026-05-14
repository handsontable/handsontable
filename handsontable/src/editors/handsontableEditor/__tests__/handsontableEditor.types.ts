import Handsontable from 'handsontable';
import type { HotInstance } from 'handsontable';
import { HandsontableEditor } from 'handsontable/editors';

const element = document.createElement('div');
const hot = Handsontable(element, {}) as unknown as HotInstance;
const editor = new HandsontableEditor(hot);

// abstract ones
editor.open();
editor.close();
editor.beginEditing();
editor.createElements();
editor.finishEditing();
const value: unknown = editor.getValue();

// editor specific ones
const isFlippedVertically: boolean = editor.isFlippedVertically;
const isFlippedHorizontally: boolean = editor.isFlippedHorizontally;
const dropdownHeight: number = editor.getDropdownHeight();
const dropdownWidth: number = editor.getDropdownWidth();
const targetDropdownWidth: number = editor.getTargetDropdownWidth();
const targetDropdownHeight: number = editor.getTargetDropdownHeight();
