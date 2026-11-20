import Handsontable from 'handsontable/base';
import type { GridSettings } from 'handsontable/settings';
import { CULTURE_BY_CCY, LEDGER_DEFAULTS } from './formats';

export function statementSettings(ccy: string): GridSettings {
  const settings = structuredClone(LEDGER_DEFAULTS);

  // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if this object holds Handsontable options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
  settings.columns = settings.columns.map(column => (column.type === 'numeric'
    ? { ...column, numericFormat: { ...column.numericFormat, culture: CULTURE_BY_CCY[ccy] } }
    : column));

  return settings;
}

export const percent = settings => ({ ...settings, numericFormat: { style: 'percent' } });

new Handsontable(document.body, statementSettings('EUR'));
