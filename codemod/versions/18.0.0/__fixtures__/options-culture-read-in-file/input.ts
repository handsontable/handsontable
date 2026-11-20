import Handsontable from 'handsontable/base';
import type { CellProperties } from 'handsontable/settings';

export function cultureOf(cellProperties: CellProperties): string {
  const culture = (cellProperties.numericFormat as { culture?: string } | undefined)?.culture;

  return culture ?? 'en-US';
}

export function patternAndCulture(cellProperties: CellProperties) {
  const { pattern = '0,0', culture = 'en-US' } = (cellProperties.numericFormat ?? {}) as { pattern?: string; culture?: string };

  return [pattern, culture];
}

new Handsontable(document.body, {
  columns: [
    { data: 'amount', type: 'numeric', numericFormat: { culture: 'de-CH' } },
  ],
});
