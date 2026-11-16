import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), {
  data: [[1, 2, 3]],
  manualColumnFreeze: true,
  manualColumnMove: true,
  afterColumnFreeze(column) {
    track(column);
  },
});

hot.addHook('beforeColumnUnfreeze', (column, performed) => performed);
