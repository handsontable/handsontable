import Handsontable from 'handsontable';

// A file with a context menu: only the checked key of a menu item is reported.
export const editorState = { undo: false, checked: true };

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  // TODO(handsontable-codemod 19.0.0/checked-menu-item-property): Check this checked property, which sits in a file that builds a context menu or a column menu. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#checked-is-a-reserved-context-menu-item-property
  contextMenu: ['row_above', { key: 'flag', name: 'Flag', checked: () => true }],
});
