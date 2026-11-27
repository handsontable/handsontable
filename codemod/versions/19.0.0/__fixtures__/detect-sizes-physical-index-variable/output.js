import Handsontable from 'handsontable';

const widths = [100, 120];
const heights = (row) => 20 + row;
const single = 100;

function minimum(row) {
  return 20 + row;
}

// TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check how this array or function sizes the columns or rows. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
new Handsontable(document.querySelector('#grid'), { data: [[1, 2]], colWidths: widths });
// TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check how this array or function sizes the columns or rows. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
new Handsontable(document.querySelector('#other'), { data: [[1, 2]], rowHeights: heights });
// TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check how this array or function sizes the columns or rows. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
new Handsontable(document.querySelector('#third'), { data: [[1, 2]], minRowHeights: minimum });

// A variable that holds one size is not reported.
new Handsontable(document.querySelector('#fourth'), { data: [[1, 2]], colWidths: single });

// A variable the tool cannot follow (a parameter) is reported with a message that says so.
export function build(el, fromProps) {
  // TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check what this size variable holds, because the tool could not follow it to an array or a... See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
  return new Handsontable(el, { data: [[1, 2]], colWidths: fromProps });
}
