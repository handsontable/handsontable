import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  // TODO(handsontable-codemod 19.0.0/data-provider-row-id-dot): Check this rowId, which has a dot in it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-string-dataproviderrowid-reads-a-property-with-a-dot-in-its-name
  dataProvider: { rowId: 'meta.id', fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }) },
});

// A key without a dot and a function are not reported.
new Handsontable(document.querySelector('#other'), {
  dataProvider: { rowId: 'id', fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }) },
});
new Handsontable(document.querySelector('#third'), {
  dataProvider: { rowId: row => row.meta?.id ?? null, fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }) },
});
