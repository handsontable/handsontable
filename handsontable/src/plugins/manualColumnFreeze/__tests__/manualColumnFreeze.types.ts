import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  manualColumnFreeze: true,
});
const manualColumnFreeze = hot.getPlugin('manualColumnFreeze');

manualColumnFreeze.freezeColumn(1);
manualColumnFreeze.unfreezeColumn(1);
