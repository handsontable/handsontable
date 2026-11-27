import Handsontable from 'handsontable';

// Not settings: a locale picker and a form default that share option names with the grid.
export const picker = { locale: 'zz', numericFormat: { culture: 'de-DE' } };
export const cfg = { correctFormat: true, datePickerConfig: {} };

// Settings that stay in this module: two other known options corroborate the object.
const local = { colHeaders: true, rowHeaders: true, correctFormat: true };

// Settings shared with another module: the other module may hand them to code that still reads the key.
export const shared = { colHeaders: true, rowHeaders: true, correctFormat: true };

export const grid = Handsontable;
