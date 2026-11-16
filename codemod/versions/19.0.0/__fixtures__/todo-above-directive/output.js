import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), {
  columns: [
    // TODO(handsontable-codemod 19.0.0/col-widths-null): Set colWidths to 50 to keep fixed 50px columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#colwidths-null-sizes-columns-like-undefined
    // eslint-disable-next-line no-inline-comments
    { data: 'a', colWidths: null },
    { data: 'b' },
  ],
});

// A note about the next line.
// TODO(handsontable-codemod 19.0.0/splice-methods): Replace this call before 20.0 removes it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#splicecol-and-splicerow-are-deprecated
// eslint-disable-next-line no-console
console.log(hot.spliceCol(0, 0));

// TODO(handsontable-codemod 19.0.0/splice-methods): Replace this call before 20.0 removes it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#splicecol-and-splicerow-are-deprecated
// @ts-expect-error the typings differ
/* prettier-ignore */
hot.spliceRow(0,   1);

// eslint-disable-line no-console
// TODO(handsontable-codemod 19.0.0/splice-methods): Replace this call before 20.0 removes it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#splicecol-and-splicerow-are-deprecated
hot.spliceCol(1, 1); // eslint-disable-line no-unused-expressions
