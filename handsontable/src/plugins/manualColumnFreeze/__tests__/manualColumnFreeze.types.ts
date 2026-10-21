import Handsontable from 'handsontable';
import type { ManualColumnFreezeSettings } from 'handsontable/plugins/manualColumnFreeze';

const hot = new Handsontable(document.createElement('div'), {
  manualColumnFreeze: true,
});
const manualColumnFreeze = hot.getPlugin('manualColumnFreeze');

manualColumnFreeze.freezeColumn(1);
manualColumnFreeze.unfreezeColumn(1);

const settings: ManualColumnFreezeSettings = {
  restoreColumnPosition: true,
};

new Handsontable(document.createElement('div'), {
  manualColumnFreeze: settings,
});
new Handsontable(document.createElement('div'), {
  manualColumnFreeze: {},
});
new Handsontable(document.createElement('div'), {
  manualColumnFreeze: false,
});
