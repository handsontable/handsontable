import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  data: [[1, true]],
  // TODO(handsontable-codemod 19.0.0/editor-false): Check the columns this editor setting reaches. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#editor-false-is-honored-by-typed-and-checkbox-columns
  editor: false,
  // TODO(handsontable-codemod 19.0.0/editor-false): Check the columns this editor setting reaches. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#editor-false-is-honored-by-typed-and-checkbox-columns
  columns: [{ type: 'text' }, { type: 'checkbox', editor: null }],
});

// Other values are not reported.
new Handsontable(document.querySelector('#other'), {
  data: [[1]],
  columns: [{ type: 'numeric', editor: true }, { type: 'text', editor: 'text' }],
});
