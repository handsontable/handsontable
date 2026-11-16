import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), {
  data: [[1, 2, 3]],
  // TODO(handsontable-codemod 19.0.0/frozen-columns-drag-and-unfreeze-hooks): Check what this code assumes about frozen columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#frozen-columns-can-be-dragged-and-the-unfreeze-hooks-get-a-target
  manualColumnFreeze: true,
  manualColumnMove: true,
  // TODO(handsontable-codemod 19.0.0/frozen-columns-drag-and-unfreeze-hooks): Check what this code assumes about frozen columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#frozen-columns-can-be-dragged-and-the-unfreeze-hooks-get-a-target
  afterColumnFreeze(column) {
    track(column);
  },
});

// TODO(handsontable-codemod 19.0.0/frozen-columns-drag-and-unfreeze-hooks): Check what this code assumes about frozen columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#frozen-columns-can-be-dragged-and-the-unfreeze-hooks-get-a-target
hot.addHook('beforeColumnUnfreeze', (column, performed) => performed);
