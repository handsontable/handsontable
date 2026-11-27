import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), {
  columns: [
    // eslint-disable-next-line no-inline-comments
    { data: 'a', colWidths: null },
    { data: 'b' },
  ],
});

// A note about the next line.
// eslint-disable-next-line no-console
console.log(hot.spliceCol(0, 0));

// @ts-expect-error the typings differ
/* prettier-ignore */
hot.spliceRow(0,   1);

// eslint-disable-line no-console
hot.spliceCol(1, 1); // eslint-disable-line no-unused-expressions
