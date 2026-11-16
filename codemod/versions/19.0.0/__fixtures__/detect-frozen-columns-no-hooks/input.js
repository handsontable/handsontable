import Handsontable from 'handsontable';

// Freezing alone, moving alone, and the other freeze hooks are not reported.
new Handsontable(document.querySelector('#a'), { data: [[1]], manualColumnFreeze: true });
new Handsontable(document.querySelector('#b'), { data: [[1]], afterColumnMove() {} });
new Handsontable(document.querySelector('#c'), { data: [[1]], beforeColumnFreeze() {}, afterColumnSort() {} });
