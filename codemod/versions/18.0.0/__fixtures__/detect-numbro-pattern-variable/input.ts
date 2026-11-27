import Handsontable from 'handsontable';

const fmt = { pattern: '0,0.00', culture: 'de-DE' };
const typed: NumericFormatOptions = { thousandSeparated: true };
const unrelated = { pattern: 'abc' };

export const columns = [{ type: 'numeric', numericFormat: fmt }, { numericFormat: typed }, unrelated];
export const grid = Handsontable;
