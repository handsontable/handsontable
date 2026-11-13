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
    // TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale and update the renderer in the same change. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
    { data: 'amount', type: 'numeric', numericFormat: { culture: 'de-CH' } },
  ],
});
