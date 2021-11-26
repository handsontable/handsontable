import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const hiddenColumns = hot.getPlugin('hiddenColumns');

hiddenColumns.showColumns([1, 2, 3]);
hiddenColumns.showColumn(1);
hiddenColumns.hideColumns([1, 2, 3]);
hiddenColumns.hideColumn(1);
hiddenColumns.isHidden(1);
hiddenColumns.getHiddenColumns();
hiddenColumns.isValidConfig([1, 2, 3, 4]);
