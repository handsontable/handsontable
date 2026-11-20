import Handsontable from 'handsontable';

function pikadayEditor() {}

new Handsontable(document.querySelector('#grid'), {
  columns: [
    { data: 'a', type: 'date', correctFormat: true, validator: dateValidator },
    { data: 'b', type: 'date', correctFormat: true, editor: 'date' },
    { data: 'c', editor: pikadayEditor, datePickerConfig: { firstDay: 1 } },
    { data: 'd', type: 'date', datePickerConfig: { firstDay: 1 } },
    { data: 'e', type: 'date', correctFormat: true, ...cellDefinition },
    { data: 'f', type: 'my-date', correctFormat: true },
  ],
});
