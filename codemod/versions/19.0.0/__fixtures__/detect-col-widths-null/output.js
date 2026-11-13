import Handsontable from 'handsontable';

// TODO(handsontable-codemod 19.0.0/col-widths-null): Set colWidths to 50 to keep fixed 50px columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-null-sizes-columns-like-undefined
new Handsontable(document.querySelector('#grid'), { data: [[1]], colWidths: null });

// Other values are not reported.
new Handsontable(document.querySelector('#other'), { data: [[1]], colWidths: 50 });
new Handsontable(document.querySelector('#third'), { data: [[1]], colWidths: [50, null] });
