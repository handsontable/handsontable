import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  stretchH: 'all',
});
new Handsontable(document.createElement('div'), {
  stretchH: 'last',
});
new Handsontable(document.createElement('div'), {
  stretchH: 'none',
});
const stretchColumns = hot.getPlugin('stretchColumns');

const columnWidth: number | null = stretchColumns.getColumnWidth(4);
