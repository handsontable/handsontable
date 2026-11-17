import Handsontable from 'handsontable';

// A grid-level locale reaches every column, so the key is reported and stays where it is.
const grid = new Handsontable(document.body, {
  licenseKey: 'non-commercial-and-evaluation',
  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Set locale on the numeric columns that used numericFormat.culture, or on the grid if every... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  numericFormat: { culture: 'de-DE', pattern: '0,0' },
  columns: [{ type: 'intl-date' }, { type: 'numeric' }],
});

// A column and a cell read the key alone, so it moves there.
new Handsontable(document.body, {
  licenseKey: 'non-commercial-and-evaluation',
  columns: [{
    type: 'numeric',
    locale: 'pl-PL',

    numericFormat: {
      pattern: '0,0'
    }
  }, { type: 'intl-date' }],
  cell: [{
    row: 0,
    col: 0,
    type: 'numeric',
    locale: 'ja-JP',

    numericFormat: {
      pattern: '0,0'
    }
  }],
});

// The same settings through updateSettings() on a grid.
// TODO(handsontable-codemod 18.0.0/numeric-format-culture): Set locale on the numeric columns that used numericFormat.culture, or on the grid if every... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
grid.updateSettings({ numericFormat: { culture: 'fr-FR', pattern: '0,0' } });
