import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1, 2], [3, 4]] });

hot.spliceCol(1, 1, 1);
hot.spliceRow(1, 1, 1);

// Array#splice and other objects are not reported.
const values = [1, 2, 3];

values.splice(1, 1);
sheet.spliceRow(0, 1);
