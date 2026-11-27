import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1, 2], [3, 4]] });

// TODO(handsontable-codemod 19.0.0/splice-methods): Replace this call before 20.0 removes it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#splicecol-and-splicerow-are-deprecated
hot.spliceCol(1, 1, 1);
// TODO(handsontable-codemod 19.0.0/splice-methods): Replace this call before 20.0 removes it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#splicecol-and-splicerow-are-deprecated
hot.spliceRow(1, 1, 1);

// Array#splice and other objects are not reported.
const values = [1, 2, 3];

values.splice(1, 1);
sheet.spliceRow(0, 1);
