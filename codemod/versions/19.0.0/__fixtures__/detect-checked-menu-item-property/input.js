import Handsontable from 'handsontable';

let isSyncing = false;

new Handsontable(document.querySelector('#grid'), {
  data: [[1]],
  contextMenu: {
    items: {
      sync: { name: 'Sync', checked: isSyncing, callback() {} },
      other: { name: 'Other', callback() {} },
    },
  },
});
