import Handsontable from 'handsontable';

// Not settings: a locale picker and a form default that share option names with the grid.
export const picker = { locale: 'zz', numericFormat: { culture: 'de-DE' } };
export const cfg = { correctFormat: true, datePickerConfig: {} };

// Settings shared with another module: two other known options corroborate the object.
export const shared = { colHeaders: true, rowHeaders: true, correctFormat: true };

export const grid = Handsontable;
