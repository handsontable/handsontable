import Handsontable from 'handsontable';

const element = document.createElement('div');
const hot = new Handsontable(element, {});
const editor = new Handsontable.editors.IntlDateEditor(hot);

editor.focus();
