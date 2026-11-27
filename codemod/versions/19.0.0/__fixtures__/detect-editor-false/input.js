import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  data: [[1, true]],
  editor: false,
  columns: [{ type: 'text' }, { type: 'checkbox', editor: null }],
});

// Other values are not reported.
new Handsontable(document.querySelector('#other'), {
  data: [[1]],
  columns: [{ type: 'numeric', editor: true }, { type: 'text', editor: 'text' }],
});
