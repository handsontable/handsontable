import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), {
  columns: [// TODO(handsontable-codemod 18.0.0/correct-format-removed): Check the code in this file that reads correctFormat before you delete correctFormat. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Check the code in this file that reads datePickerConfig before you delete datePickerConfig. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
  {
    data: 'a',
    type: 'date',
    correctFormat: true,
    datePickerConfig: {}
  }],
});

// A custom editor of the project reads the option, so the tool keeps both.
function configOf(editor) {
  return editor.cellProperties.datePickerConfig ?? {};
}

const { correctFormat } = hot.getCellMeta(0, 0);
