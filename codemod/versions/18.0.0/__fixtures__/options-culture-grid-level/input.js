import Handsontable from 'handsontable';

// A grid-level locale reaches every column, so the key is reported and stays where it is.
const grid = new Handsontable(document.body, {
  licenseKey: 'non-commercial-and-evaluation',
  numericFormat: { culture: 'de-DE', pattern: '0,0' },
  columns: [{ type: 'intl-date' }, { type: 'numeric' }],
});

// A column and a cell read the key alone, so it moves there.
new Handsontable(document.body, {
  licenseKey: 'non-commercial-and-evaluation',
  columns: [{ type: 'numeric', numericFormat: { culture: 'pl-PL', pattern: '0,0' } }, { type: 'intl-date' }],
  cell: [{ row: 0, col: 0, type: 'numeric', numericFormat: { culture: 'ja-JP', pattern: '0,0' } }],
});

// The same settings through updateSettings() on a grid.
grid.updateSettings({ numericFormat: { culture: 'fr-FR', pattern: '0,0' } });
