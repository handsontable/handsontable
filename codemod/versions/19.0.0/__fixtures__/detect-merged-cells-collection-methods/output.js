import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]], mergeCells: true });
const collection = hot.getPlugin('mergeCells').mergedCellsCollection;
const range = hot.getSelectedRangeLast();

// TODO(handsontable-codemod 19.0.0/merged-cells-collection-methods): Remove this call before 20.0 removes the method. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#four-mergedcellscollection-methods-are-deprecated
collection.getStartMostColumnIndex(range, 0);
// TODO(handsontable-codemod 19.0.0/merged-cells-collection-methods): Remove this call before 20.0 removes the method. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#four-mergedcellscollection-methods-are-deprecated
collection.getBottomMostRowIndex(range, 0);
// TODO(handsontable-codemod 19.0.0/merged-cells-collection-methods): Remove this call before 20.0 removes the method. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#four-mergedcellscollection-methods-are-deprecated
hot.getPlugin('mergeCells').mergedCellsCollection.getTopMostRowIndex(range, 0);

// The other methods of the collection are not reported.
collection.get(0, 0);
