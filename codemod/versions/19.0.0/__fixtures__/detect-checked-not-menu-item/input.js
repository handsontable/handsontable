import Handsontable from 'handsontable';

// A file with a context menu: only the checked key of a menu item is reported.
export const editorState = { undo: false, checked: true };

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  contextMenu: ['row_above', { key: 'flag', name: 'Flag', checked: () => true }],
});
