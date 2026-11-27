import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  dataProvider: { rowId: 'meta.id', fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }) },
});

// A key without a dot and a function are not reported.
new Handsontable(document.querySelector('#other'), {
  dataProvider: { rowId: 'id', fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }) },
});
new Handsontable(document.querySelector('#third'), {
  dataProvider: { rowId: row => row.meta?.id ?? null, fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }) },
});
