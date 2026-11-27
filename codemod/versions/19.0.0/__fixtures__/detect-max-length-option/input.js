import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  data: [['a']],
  columns: [{ data: 0, maxLength: 20 }, { data: 1 }],
});

// Not an option object of the grid.
const form = { maxLength: 20 };
