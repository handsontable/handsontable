import Handsontable from 'handsontable';

new Tabulator('#x', { correctFormat: true, datePickerConfig: {}, columns: [{ numericFormat: { culture: 'x' } }] });
