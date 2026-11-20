import Handsontable from 'handsontable';

function pikadayEditor() {}

new Handsontable(document.querySelector('#grid'), {
  columns: [
    // TODO(handsontable-codemod 18.0.0/correct-format-removed): Check the custom validator set next to it before you delete correctFormat. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
    {
      data: 'a',
      type: 'date',
      correctFormat: true,
      validator: dateValidator
    },
    {
      data: 'b',
      type: 'date',

      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      editor: 'date'
    },
    // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Check the custom editor set next to it before you delete datePickerConfig. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
    {
      data: 'c',
      editor: pikadayEditor,
      datePickerConfig: { firstDay: 1 }
    },
    {
      data: 'd',

      // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. Check the native date input, which replaces Pikaday. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
      type: 'date'
    },
    // TODO(handsontable-codemod 18.0.0/correct-format-removed): Check the spread next to it that the tool cannot read before you delete correctFormat. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
    {
      data: 'e',
      type: 'date',
      correctFormat: true,
      ...cellDefinition
    },
    // TODO(handsontable-codemod 18.0.0/correct-format-removed): Check the cell type set next to it before you delete correctFormat. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
    {
      data: 'f',
      type: 'my-date',
      correctFormat: true
    },
  ],
});
