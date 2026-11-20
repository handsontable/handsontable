import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]], mergeCells: true });
const collection = hot.getPlugin('mergeCells').mergedCellsCollection;
const range = hot.getSelectedRangeLast();

collection.getStartMostColumnIndex(range, 0);
collection.getBottomMostRowIndex(range, 0);
hot.getPlugin('mergeCells').mergedCellsCollection.getTopMostRowIndex(range, 0);

// The other methods of the collection are not reported.
collection.get(0, 0);
