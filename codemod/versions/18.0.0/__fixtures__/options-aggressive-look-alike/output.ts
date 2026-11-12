import Handsontable from 'handsontable';

// Not settings: a locale picker and a form default that share option names with the grid.
export const picker = { locale: 'zz', numericFormat: { culture: 'de-DE' } };
export const cfg = { correctFormat: true, datePickerConfig: {} };

// Settings shared with another module: two other known options corroborate the object.
export const shared = {
  colHeaders: true,

  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  rowHeaders: true
};

export const grid = Handsontable;
