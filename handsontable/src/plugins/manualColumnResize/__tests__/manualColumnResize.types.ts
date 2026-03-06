import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  manualColumnResize: true
});

new Handsontable(document.createElement('div'), {
  manualColumnResize: [100, 40],
});

const manualColumnResize = hot.getPlugin('manualColumnResize');

manualColumnResize.saveManualColumnWidths();
manualColumnResize.clearManualSize(0);

const width: number = manualColumnResize.setManualSize(0, 5);
const widths: Array<number | null> = manualColumnResize.loadManualColumnWidths();
