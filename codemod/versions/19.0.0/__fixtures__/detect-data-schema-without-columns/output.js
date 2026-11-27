import Handsontable from 'handsontable';

// TODO(handsontable-codemod 19.0.0/data-schema-without-columns): Check the column order of this grid, which sets dataSchema and no columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-dataschema-with-non-null-values-creates-a-column-for-each-value
new Handsontable(document.querySelector('#grid'), {
  data: [{ isNew: true, id: 1, name: 'Ted' }],
  dataSchema: { isNew: true, id: null, name: null },
});

// A grid that sets columns, or no schema, is not reported.
new Handsontable(document.querySelector('#other'), {
  data: [{ id: 1, name: 'Ted' }],
  dataSchema: { id: null, name: null },
  columns: [{ data: 'id' }, { data: 'name' }],
});
new Handsontable(document.querySelector('#third'), { data: [{ id: 1 }] });
