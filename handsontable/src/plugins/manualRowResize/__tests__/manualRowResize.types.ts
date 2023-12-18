import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  manualRowResize: true
});
const manualRowResize = hot.getPlugin('manualRowResize');

manualRowResize.saveManualRowHeights();

const height: number = manualRowResize.setManualSize(0, 5);
const heights: Array<number | null> = manualRowResize.loadManualRowHeights();
