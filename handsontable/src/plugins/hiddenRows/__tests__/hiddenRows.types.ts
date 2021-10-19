import Handsontable from 'handsontable';

const hiddenRows = Handsontable.plugins.HiddenRows;

hiddenRows.showRows([1, 2, 3]);
hiddenRows.showRow(1);
hiddenRows.hideRows([1, 2, 3]);
hiddenRows.hideRow(1);
hiddenRows.isHidden(1);
hiddenRows.getHiddenRows();
hiddenRows.isValidConfig([1, 2, 3, 4]);
