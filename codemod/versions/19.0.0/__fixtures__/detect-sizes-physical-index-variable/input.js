import Handsontable from 'handsontable';

const widths = [100, 120];
const heights = (row) => 20 + row;
const single = 100;

function minimum(row) {
  return 20 + row;
}

new Handsontable(document.querySelector('#grid'), { data: [[1, 2]], colWidths: widths });
new Handsontable(document.querySelector('#other'), { data: [[1, 2]], rowHeights: heights });
new Handsontable(document.querySelector('#third'), { data: [[1, 2]], minRowHeights: minimum });

// A variable that holds one size is not reported.
new Handsontable(document.querySelector('#fourth'), { data: [[1, 2]], colWidths: single });

// A variable the tool cannot follow (a parameter) is reported with a message that says so.
export function build(el, fromProps) {
  return new Handsontable(el, { data: [[1, 2]], colWidths: fromProps });
}
