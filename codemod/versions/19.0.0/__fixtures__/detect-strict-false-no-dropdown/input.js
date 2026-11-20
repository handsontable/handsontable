import Handsontable from 'handsontable';

// An autocomplete column accepts values outside its list, so it is not reported.
new Handsontable(document.querySelector('#grid'), {
  data: [['BMW']],
  columns: [{ type: 'autocomplete', source: ['BMW', 'Audi'], strict: false }],
});
