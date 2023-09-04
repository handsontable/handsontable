import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  hiddenColumns: true,
});
new Handsontable(document.createElement('div'), {
  hiddenColumns: {
    columns: [1, 2],
  },
});
new Handsontable(document.createElement('div'), {
  hiddenColumns: {
    indicators: true,
  },
});
new Handsontable(document.createElement('div'), {
  hiddenColumns: {
    copyPasteEnabled: true,
  },
});
const plugin = hot.getPlugin('hiddenColumns');

plugin.showColumns([1, 2, 3]);
plugin.showColumn(1);
plugin.hideColumns([1, 2, 3]);
plugin.hideColumn(1);

const isHidden: boolean = plugin.isHidden(1);
const hiddenColumns: number[] = plugin.getHiddenColumns();
const isValidConfig: boolean = plugin.isValidConfig([1, 2, 3, 4]);
