import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

const hot = new Handsontable(container, {
  data: [],
  colHeaders: true,
  columns: [
    {
      type: 'numeric',
      locale: 'de-DE',

      // Prices in the German format
      numericFormat: {
        pattern: '0,0.00 $'
      }
    },
    {
      type: 'date',

      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      dateFormat: 'DD/MM/YYYY'
    },
    {
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. The datePickerConfig option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
      type: 'date'
    },
    {
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      type: 'text'
    },
  ],
  cells(row, col) {
    if (row === 0) {
      return {
        type: 'date',

        // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        readOnly: true
      };
    }

    return {};
  },
});

hot.updateSettings({
  cell: [{
    row: 1,
    col: 1,
    type: 'numeric',
    locale: 'ja-JP',
    numericFormat: {}
  }],
});
