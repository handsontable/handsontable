import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), { data: [[1]], rowHeights: 50 });
new Handsontable(document.querySelector('#other'), { data: [[1]], rowHeights: [20, 40] });

// minRowHeights keeps the old behavior and is not reported.
new Handsontable(document.querySelector('#third'), { data: [[1]], minRowHeights: 50 });
