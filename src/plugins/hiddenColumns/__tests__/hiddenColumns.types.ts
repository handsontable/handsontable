import Handsontable from 'handsontable';

const hiddenColumns = Handsontable.plugins.HiddenColumns;

hiddenColumns.showColumns([1, 2, 3]);
hiddenColumns.showColumn(1);
hiddenColumns.hideColumns([1, 2, 3]);
hiddenColumns.hideColumn(1);
hiddenColumns.isHidden(1);
hiddenColumns.getHiddenColumns();
hiddenColumns.isValidConfig([1, 2, 3, 4]);
