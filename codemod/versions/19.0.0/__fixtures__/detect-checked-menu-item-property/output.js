import Handsontable from 'handsontable';

let isSyncing = false;

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  contextMenu: {
    items: {
      // TODO(handsontable-codemod 19.0.0/checked-menu-item-property): Check this checked property, which sits in a file that builds a context menu or a column menu. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#checked-is-a-reserved-context-menu-item-property
      sync: { name: 'Sync', checked: isSyncing, callback() {} },
      other: { name: 'Other', callback() {} },
    },
  },
});
