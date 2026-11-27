import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  data: [['BMW']],
  // TODO(handsontable-codemod 19.0.0/dropdown-strict-false): Check whether a dropdown column with this strict: false expects values outside its source list... See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-dropdown-column-with-strict-false-validates-strictly
  columns: [{ type: 'dropdown', source: ['BMW', 'Audi'], strict: false }],
});
