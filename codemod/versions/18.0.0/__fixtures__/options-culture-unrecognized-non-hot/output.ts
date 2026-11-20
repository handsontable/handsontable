import { CULTURE_BY_CCY, DEFAULTS } from './formats';

// A statement printer: it has a numericFormat with a culture, but it never touches the grid.
export function printerSettings(ccy: string) {
  return DEFAULTS.columns.map(column => ({
    ...column,
    numericFormat: { ...column.numericFormat, culture: CULTURE_BY_CCY[ccy] },
  }));
}
