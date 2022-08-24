import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const hiddenRows = hot.getPlugin('hiddenRows');

hiddenRows.showRows([1, 2, 3]);
hiddenRows.showRow(1);
hiddenRows.hideRows([1, 2, 3]);
hiddenRows.hideRow(1);
hiddenRows.isHidden(1);
hiddenRows.getHiddenRows();
hiddenRows.isValidConfig([1, 2, 3, 4]);
