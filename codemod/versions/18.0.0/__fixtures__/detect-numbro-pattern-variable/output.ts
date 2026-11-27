import Handsontable from 'handsontable';

// TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
const fmt = { pattern: '0,0.00', culture: 'de-DE' };
// TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
const typed: NumericFormatOptions = { thousandSeparated: true };
const unrelated = { pattern: 'abc' };

// TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand: numericFormat comes from a variable that sets culture. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
export const columns = [{ type: 'numeric', numericFormat: fmt }, { numericFormat: typed }, unrelated];
export const grid = Handsontable;
