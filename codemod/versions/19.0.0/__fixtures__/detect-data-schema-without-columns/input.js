import Handsontable from 'handsontable';

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
