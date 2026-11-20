import Handsontable from 'handsontable/base';
import type { GridSettings } from 'handsontable/settings';
import { CULTURE_BY_CCY, LEDGER_DEFAULTS } from './formats';

export function statementSettings(ccy: string): GridSettings {
  const settings = structuredClone(LEDGER_DEFAULTS);

  settings.columns = settings.columns.map(column => (column.type === 'numeric'
    ? { ...column, numericFormat: { ...column.numericFormat, culture: CULTURE_BY_CCY[ccy] } }
    : column));

  return settings;
}

export const percent = settings => ({ ...settings, numericFormat: { style: 'percent' } });

new Handsontable(document.body, statementSettings('EUR'));
