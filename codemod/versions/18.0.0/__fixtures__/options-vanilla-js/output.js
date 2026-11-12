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

      // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
      dateFormat: 'DD/MM/YYYY'
    },
    {
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
      // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): The datePickerConfig option was removed in 18.0 and was deleted here. The date and intl-date cell types use the browser's native date input instead of Pikaday.
      type: 'date'
    },
    {
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
      type: 'text'
    },
  ],
  cells(row, col) {
    if (row === 0) {
      return {
        type: 'date',

        // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
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
