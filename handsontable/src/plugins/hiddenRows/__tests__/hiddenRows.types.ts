import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  hiddenRows: true,
});
new Handsontable(document.createElement('div'), {
  hiddenRows: {
    rows: [1, 2],
  },
});
new Handsontable(document.createElement('div'), {
  hiddenRows: {
    indicators: true,
  },
});
new Handsontable(document.createElement('div'), {
  hiddenRows: {
    copyPasteEnabled: true,
  },
});
const plugin = hot.getPlugin('hiddenRows');

plugin.showRows([1, 2, 3]);
plugin.showRow(1);
plugin.hideRows([1, 2, 3]);
plugin.hideRow(1);

const isHidden: boolean = plugin.isHidden(1);
const hiddenRows: number[] = plugin.getHiddenRows();
const isValidConfig: boolean = plugin.isValidConfig([1, 2, 3, 4]);
