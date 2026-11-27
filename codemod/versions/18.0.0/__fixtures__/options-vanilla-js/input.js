import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

const hot = new Handsontable(container, {
  data: [],
  colHeaders: true,
  columns: [
    {
      type: 'numeric',
      // Prices in the German format
      numericFormat: { pattern: '0,0.00 $', culture: 'de-DE' },
    },
    {
      type: 'date',
      dateFormat: 'DD/MM/YYYY',
      correctFormat: true, // fix typed dates
    },
    {
      type: 'date',
      correctFormat: false,
      datePickerConfig: { firstDay: 1 },
    },
    { type: 'text', correctFormat: true },
  ],
  cells(row, col) {
    if (row === 0) {
      return { type: 'date', correctFormat: true, readOnly: true };
    }

    return {};
  },
});

hot.updateSettings({
  cell: [{ row: 1, col: 1, type: 'numeric', numericFormat: { culture: 'ja-JP' } }],
});
