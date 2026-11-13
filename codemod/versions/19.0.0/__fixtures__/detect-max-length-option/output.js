import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  data: [['a']],
  // TODO(handsontable-codemod 19.0.0/max-length-option): Rename this maxLength key if it is your own, for example to maxChars, in your settings and in... See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#maxlength-is-a-built-in-cell-option
  columns: [{ data: 0, maxLength: 20 }, { data: 1 }],
});

// Not an option object of the grid.
const form = { maxLength: 20 };
