import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  mergeCells: true
});
new Handsontable(document.createElement('div'), {
  mergeCells: [
    { row: 0, col: 0, rowspan: 3, colspan: 3 },
    { row: 3, col: 0, rowspan: 3, colspan: 3 },
  ]
});
new Handsontable(document.createElement('div'), {
  mergeCells: {
    virtualized: true,
    cells: [
      { row: 0, col: 0, rowspan: 3, colspan: 3 },
      { row: 3, col: 0, rowspan: 3, colspan: 3 },
    ],
  }
});
const mergeCells = hot.getPlugin('mergeCells');

mergeCells.clearCollections();
mergeCells.mergeSelection(hot.getSelectedRangeLast());
mergeCells.unmergeSelection(hot.getSelectedRangeLast())
mergeCells.merge(0, 0, 3, 3);
mergeCells.unmerge(0, 0, 3, 3);
