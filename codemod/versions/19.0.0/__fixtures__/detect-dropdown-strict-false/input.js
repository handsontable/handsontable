import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  data: [['BMW']],
  columns: [{ type: 'dropdown', source: ['BMW', 'Audi'], strict: false }],
});
