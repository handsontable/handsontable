import Handsontable from 'handsontable';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const editor = new Handsontable.editors.NumericEditor(hot);

// abstract ones
editor.open();
editor.close();
editor.beginEditing();
editor.createElements();
editor.finishEditing();

const value: string = editor.getValue();
