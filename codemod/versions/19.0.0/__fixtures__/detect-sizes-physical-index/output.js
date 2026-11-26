import Handsontable from 'handsontable';

// TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check how this array or function sizes the columns or rows. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
new Handsontable(document.querySelector('#grid'), { data: [[1, 2]], colWidths: [100, 120], manualColumnMove: true });
// TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check how this array or function sizes the columns or rows. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
new Handsontable(document.querySelector('#other'), { data: [[1, 2]], rowHeights: [20, 40] });
new Handsontable(document.querySelector('#third'), {
  data: [[1, 2]],
  // TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check how this array or function sizes the columns or rows. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
  minRowHeights(row) {
    return row === 0 ? 40 : 20;
  },
  // TODO(handsontable-codemod 19.0.0/sizes-physical-index): Check how this array or function sizes the columns or rows. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-rowheights-and-minrowheights-address-columns-and-rows-by-physical-index
  colWidths: (column) => 50 + column,
});

// One size for everything is not reported, and neither is a size that is not a list or a function.
new Handsontable(document.querySelector('#fourth'), { data: [[1, 2]], colWidths: 100, rowHeights: '30px' });

// Not an option object of a grid.
const layout = { colWidths: [1, 2] };
