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

      // fix typed dates
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      dateFormat: 'DD/MM/YYYY'
    },
    {
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. Check the native date input, which replaces Pikaday. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
      type: 'date'
    },
    {
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      type: 'text'
    },
  ],
  cells(row, col) {
    if (row === 0) {
      return {
        type: 'date',

        // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
        readOnly: true
      };
    }

    return {};
  },
});

hot.updateSettings({
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Check the numbers this column shows. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  cell: [{
    row: 1,
    col: 1,
    type: 'numeric',
    locale: 'ja-JP',
    numericFormat: {}
  }],
});
