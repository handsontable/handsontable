import Handsontable from 'handsontable';

// TODO(handsontable-codemod 19.0.0/row-heights-exact): Check that the content of every row fits this rowHeights value. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#rowheights-sets-an-exact-row-height
new Handsontable(document.querySelector('#grid'), { data: [[1]], rowHeights: 50 });
// TODO(handsontable-codemod 19.0.0/row-heights-exact): Check that the content of every row fits this rowHeights value. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#rowheights-sets-an-exact-row-height
new Handsontable(document.querySelector('#other'), { data: [[1]], rowHeights: [20, 40] });

// minRowHeights keeps the old behavior and is not reported.
new Handsontable(document.querySelector('#third'), { data: [[1]], minRowHeights: 50 });
