import Handsontable from 'handsontable';

// Not settings: a locale picker and a form default that share option names with the grid.
// TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
export const picker = { locale: 'zz', numericFormat: { culture: 'de-DE' } };
// TODO(handsontable-codemod 18.0.0/correct-format-removed): Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
// TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Check the native date input, which replaces Pikaday. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
export const cfg = { correctFormat: true, datePickerConfig: {} };

// Settings shared with another module: two other known options corroborate the object.
export const shared = {
  colHeaders: true,

  // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
  rowHeaders: true
};

export const grid = Handsontable;
